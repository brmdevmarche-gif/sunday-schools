import { createClient } from './supabase/client'

export interface LoginHistoryEntry {
  id: string
  user_id: string
  success: boolean
  ip_address: string | null
  user_agent: string | null
  device_info: string | null
  location: string | null
  failure_reason: string | null
  created_at: string
}

export interface DeviceInfo {
  browser: string
  os: string
  device: string
}

/**
 * Parse user agent string to extract device information
 */
function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase()

  // Detect browser
  let browser = 'Unknown'
  if (ua.includes('chrome')) browser = 'Chrome'
  else if (ua.includes('firefox')) browser = 'Firefox'
  else if (ua.includes('safari')) browser = 'Safari'
  else if (ua.includes('edge')) browser = 'Edge'
  else if (ua.includes('opera')) browser = 'Opera'

  // Detect OS
  let os = 'Unknown'
  if (ua.includes('windows')) os = 'Windows'
  else if (ua.includes('mac')) os = 'macOS'
  else if (ua.includes('linux')) os = 'Linux'
  else if (ua.includes('android')) os = 'Android'
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'

  // Detect device
  let device = 'Desktop'
  if (ua.includes('mobile')) device = 'Mobile'
  else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet'

  return { browser, os, device }
}

/**
 * Get client IP address (Note: This only works server-side)
 * For client-side, we'll need to use a service or leave it null
 */
async function getClientIP(): Promise<string | null> {
  try {
    // This will only work if you have a server endpoint that returns IP
    // For now, we'll return null and handle it later if needed
    return null
  } catch {
    return null
  }
}

/**
 * Log a login attempt
 */
export async function logLoginAttempt(
  userId: string | null,
  success: boolean,
  failureReason?: string
): Promise<void> {
  try {
    const supabase = createClient()
    const userAgent = navigator.userAgent
    const deviceInfo = parseUserAgent(userAgent)
    const ipAddress = await getClientIP()

    const loginData = {
      user_id: userId,
      success,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_info: `${deviceInfo.browser} on ${deviceInfo.os} (${deviceInfo.device})`,
      location: null, // Can be enhanced with geolocation API
      failure_reason: failureReason || null,
    }

    const { error } = await supabase
      .from('login_history')
      .insert(loginData)

    if (error) {
      console.error('Failed to log login attempt:', error)
    }
  } catch (error) {
    console.error('Error logging login attempt:', error)
  }
}

/**
 * Get login history for the current user
 */
export async function getLoginHistory(limit: number = 10): Promise<LoginHistoryEntry[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('login_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching login history:', error)
    return []
  }

  return data as LoginHistoryEntry[]
}

/**
 * Get the last successful login for the current user
 */
export async function getLastSuccessfulLogin(): Promise<LoginHistoryEntry | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('login_history')
    .select('*')
    .eq('success', true)
    .order('created_at', { ascending: false })
    .limit(2) // Get 2 to skip the current login

  if (error) {
    console.error('Error fetching last login:', error)
    return null
  }

  // Return the second entry (previous login, not current)
  return data && data.length > 1 ? (data[1] as LoginHistoryEntry) : null
}

/**
 * Get recent failed login attempts
 */
export async function getRecentFailedAttempts(hours: number = 24): Promise<LoginHistoryEntry[]> {
  const supabase = createClient()
  const since = new Date()
  since.setHours(since.getHours() - hours)

  const { data, error } = await supabase
    .from('login_history')
    .select('*')
    .eq('success', false)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching failed attempts:', error)
    return []
  }

  return data as LoginHistoryEntry[]
}

/**
 * Check for suspicious activity
 */
export async function detectSuspiciousActivity(): Promise<{
  hasSuspiciousActivity: boolean
  reasons: string[]
}> {
  const recentFailed = await getRecentFailedAttempts(24)
  const reasons: string[] = []

  // Check for multiple failed attempts
  if (recentFailed.length >= 3) {
    reasons.push(`${recentFailed.length} failed login attempts in the last 24 hours`)
  }

  // Check for failed attempts in the last hour
  const lastHour = new Date()
  lastHour.setHours(lastHour.getHours() - 1)
  const recentFailedLastHour = recentFailed.filter(
    attempt => new Date(attempt.created_at) > lastHour
  )

  if (recentFailedLastHour.length >= 2) {
    reasons.push(`${recentFailedLastHour.length} failed attempts in the last hour`)
  }

  return {
    hasSuspiciousActivity: reasons.length > 0,
    reasons,
  }
}

/**
 * Get login statistics
 */
export async function getLoginStats(): Promise<{
  totalLogins: number
  successfulLogins: number
  failedLogins: number
  lastLogin: LoginHistoryEntry | null
}> {
  const history = await getLoginHistory(100) // Get more for stats
  const successful = history.filter(h => h.success)
  const failed = history.filter(h => !h.success)

  return {
    totalLogins: history.length,
    successfulLogins: successful.length,
    failedLogins: failed.length,
    lastLogin: successful[0] || null,
  }
}
