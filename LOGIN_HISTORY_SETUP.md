# Login History & Security Monitoring Setup

This document explains the login history and security monitoring features that have been added to your application.

## What's Been Implemented

### 1. Database Table (`login_history`)
A new table that stores all login attempts with the following information:
- User ID (who attempted to log in)
- Success/failure status
- IP address (when available)
- User agent (browser, OS, device information)
- Device info (parsed from user agent)
- Location (placeholder for future geolocation)
- Failure reason (error message for failed attempts)
- Timestamp

### 2. Row Level Security (RLS)
The login_history table has RLS policies that ensure:
- Users can only view their own login history
- Users can insert their own login records
- Anonymous users can log failed login attempts (for security tracking even before auth)

### 3. Tracking System
**Automatic tracking on every login attempt:**
- ✅ Successful logins are logged with user ID
- ✅ Failed logins are logged with error message
- ✅ Device information is automatically parsed and stored
- ✅ Timestamps are recorded for all attempts

**Files modified:**
- `src/app/login/page.tsx` - Added login tracking to the login form

### 4. Helper Functions (`src/lib/login-history.ts`)
New utility functions for managing login history:
```typescript
// Log a login attempt
logLoginAttempt(userId, success, failureReason)

// Get recent login history
getLoginHistory(limit)

// Get the previous successful login
getLastSuccessfulLogin()

// Get recent failed attempts
getRecentFailedAttempts(hours)

// Detect suspicious activity
detectSuspiciousActivity()

// Get login statistics
getLoginStats()
```

### 5. UI Components

**SecurityAlerts Component (`src/components/SecurityAlerts.tsx`)**
Displays at the top of the dashboard:
- 🟢 **Welcome back** - Shows last login info when everything is normal
- 🟡 **Security Alert** - Warns about suspicious activity (multiple failed attempts)
- 🔵 **First-time login** - Welcome message for new users

**LoginHistory Component (`src/components/LoginHistory.tsx`)**
Displays on the dashboard:
- Shows recent login attempts (default: 10 most recent)
- Color-coded: Green for success, Red for failures
- Displays device info, timestamp, and failure reasons
- Clean, card-based UI using shadcn components

### 6. Dashboard Integration
The dashboard now shows:
1. **Security alerts** at the top (suspicious activity warnings or last login info)
2. **Login history** at the bottom (list of recent login attempts)

## How It Works

### Login Flow

```
User enters credentials
        ↓
Login attempt is made
        ↓
    ┌───────┴───────┐
    ↓               ↓
SUCCESS          FAILURE
    ↓               ↓
Log with         Log with
user ID          error msg
    ↓               ↓
Redirect to      Show error
dashboard        to user
    ↓
Show security
alerts + history
```

### Security Detection

The app checks for:
- **3+ failed attempts in 24 hours** → Security alert
- **2+ failed attempts in 1 hour** → Security alert

## Setup Instructions

### Step 1: Run the Migration

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Run `supabase/migrations/04_create_login_history.sql`

### Step 2: Test the Feature

1. **Test failed login:**
   - Try logging in with wrong password
   - You should see the error
   - This attempt will be logged

2. **Test successful login:**
   - Log in with correct credentials
   - You'll be redirected to dashboard
   - This attempt will be logged

3. **View login history:**
   - On the dashboard, scroll down to see your login history
   - You should see both the failed and successful attempts

4. **Test security alerts:**
   - Try failing to log in 3+ times
   - Then successfully log in
   - You should see a security alert on the dashboard

## Customization Options

### Change How Long History is Kept

By default, login history is kept for 90 days. To change this:

1. In Supabase SQL Editor, run:
```sql
CREATE OR REPLACE FUNCTION public.cleanup_old_login_history()
RETURNS void AS $$
BEGIN
  DELETE FROM public.login_history
  WHERE created_at < NOW() - INTERVAL '30 days'; -- Change to desired days
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

2. Set up a cron job in Supabase to run this function periodically

### Change Alert Thresholds

Edit `src/lib/login-history.ts` in the `detectSuspiciousActivity()` function:

```typescript
// Current: Alert on 3+ failed attempts in 24 hours
if (recentFailed.length >= 3) { // Change this number

// Current: Alert on 2+ failed attempts in 1 hour
if (recentFailedLastHour.length >= 2) { // Change this number
```

### Change Number of Displayed Logins

In `src/app/dashboard/page.tsx`:
```typescript
<LoginHistory limit={10} /> // Change to show more or fewer
```

## Privacy & Security

### What's Stored
- ✅ User agent strings (contains browser/OS info)
- ✅ Timestamps
- ✅ Success/failure status
- ⚠️ IP addresses (currently null, can be enabled)
- ❌ Passwords (NEVER stored)

### Who Can See What
- Users can ONLY see their own login history
- Admins (with service role key) can see all login history
- Anonymous users cannot query the table

### Data Retention
- Login history is kept for 90 days by default
- Old records can be automatically cleaned up with a cron job
- You can manually delete history anytime

## Troubleshooting

### Login history is empty
- Make sure you've run the migration `04_create_login_history.sql`
- Try logging out and logging back in
- Check browser console for errors

### RLS errors when viewing history
- Verify the RLS policies were created correctly
- Make sure you're using the browser client (not server client)
- Check that you're authenticated when viewing the dashboard

### Device info shows as "Unknown"
- This is normal for some browsers or privacy-focused setups
- The user agent parsing is best-effort
- The raw user agent is still stored for reference

## Future Enhancements

You can extend this feature with:

1. **IP Geolocation** - Show approximate location of login attempts
2. **Email Notifications** - Send emails for suspicious activity
3. **2FA/MFA** - Add two-factor authentication
4. **Device Management** - Allow users to "trust" devices
5. **Export History** - Let users download their login history as CSV
6. **More Detailed Stats** - Add charts/graphs of login patterns

## Questions?

For more information, see:
- `README.md` - Main project documentation
- `supabase/migrations/README.md` - Database setup instructions
- `src/lib/login-history.ts` - Login tracking implementation
