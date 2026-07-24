/**
 * Knasty Portal — Core Database Seeder
 *
 * Seeds: permissions, roles, role_permissions, dioceses, churches, classes,
 *        2 super-admins, diocese admins, church admins, teachers, students.
 *
 * Usage:
 *   npm run db:seed            — seed (additive, skip existing)
 *   npm run db:seed:clear      — flush ALL data then seed
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config() // fallback to .env
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: {
    // New-format sb_secret_ keys are rejected by GoTrue when sent as a Bearer
    // token; authenticate via the apikey header only.
    fetch: (input: RequestInfo | URL, init: RequestInit = {}) => {
      const headers = new Headers(init.headers)
      if (SERVICE_KEY.startsWith('sb_secret_')) headers.delete('Authorization')
      return fetch(input, { ...init, headers })
    },
  },
})

const CLEAR = process.argv.includes('--clear')

// ---------------------------------------------------------------------------
// Egyptian Coptic Orthodox Dioceses + Churches
// ---------------------------------------------------------------------------

interface DioceseData {
  name: string
  location: string
  churches: { name: string; city: string }[]
}

const EGYPT_DIOCESES: DioceseData[] = [
  {
    name: 'إيبارشية القاهرة',
    location: 'القاهرة',
    churches: [
      { name: 'كنيسة العذراء مريم - المعادي', city: 'المعادي' },
      { name: 'كنيسة مارجرجس - مصر الجديدة', city: 'مصر الجديدة' },
      { name: 'كنيسة الأنبا أنطونيوس - شبرا', city: 'شبرا' },
      { name: 'كنيسة العذراء مريم - الزيتون', city: 'الزيتون' },
      { name: 'كنيسة مارمرقس - مصر الجديدة', city: 'مصر الجديدة' },
    ],
  },
  {
    name: 'إيبارشية الجيزة',
    location: 'الجيزة',
    churches: [
      { name: 'كنيسة مارجرجس - الجيزة', city: 'الجيزة' },
      { name: 'كنيسة العذراء مريم - فيصل', city: 'فيصل' },
      { name: 'كنيسة الأنبا موسى - الهرم', city: 'الهرم' },
      { name: 'كنيسة مارمينا - الدقي', city: 'الدقي' },
      { name: 'كنيسة الأنبا بولا - العجوزة', city: 'العجوزة' },
    ],
  },
  {
    name: 'إيبارشية الإسكندرية',
    location: 'الإسكندرية',
    churches: [
      { name: 'الكاتدرائية المرقسية - الإسكندرية', city: 'الإسكندرية' },
      { name: 'كنيسة مارجرجس - سبورتنج', city: 'سبورتنج' },
      { name: 'كنيسة العذراء مريم - كليوباترا', city: 'كليوباترا' },
      { name: 'كنيسة مارمينا - فلمنج', city: 'فلمنج' },
      { name: 'كنيسة الأنبا تكلا - سموحة', city: 'سموحة' },
    ],
  },
  {
    name: 'إيبارشية المنيا',
    location: 'المنيا',
    churches: [
      { name: 'كنيسة العذراء مريم - المنيا', city: 'المنيا' },
      { name: 'كنيسة مارجرجس - ملوي', city: 'ملوي' },
      { name: 'كنيسة الأنبا موسى - أبو قرقاص', city: 'أبو قرقاص' },
    ],
  },
  {
    name: 'إيبارشية أسيوط',
    location: 'أسيوط',
    churches: [
      { name: 'كنيسة العذراء مريم - أسيوط', city: 'أسيوط' },
      { name: 'كنيسة مارجرجس - أسيوط', city: 'أسيوط' },
      { name: 'كنيسة الأنبا أنطونيوس - ديروط', city: 'ديروط' },
    ],
  },
  {
    name: 'إيبارشية سوهاج',
    location: 'سوهاج',
    churches: [
      { name: 'كنيسة الأنبا شنودة - سوهاج', city: 'سوهاج' },
      { name: 'كنيسة مارجرجس - أخميم', city: 'أخميم' },
      { name: 'كنيسة العذراء مريم - طهطا', city: 'طهطا' },
    ],
  },
  {
    name: 'إيبارشية قنا',
    location: 'قنا',
    churches: [
      { name: 'كنيسة مارجرجس - قنا', city: 'قنا' },
      { name: 'كنيسة العذراء مريم - نجع حمادي', city: 'نجع حمادي' },
    ],
  },
  {
    name: 'إيبارشية الأقصر',
    location: 'الأقصر',
    churches: [
      { name: 'كنيسة مارجرجس - الأقصر', city: 'الأقصر' },
      { name: 'كنيسة العذراء مريم - إسنا', city: 'إسنا' },
    ],
  },
  {
    name: 'إيبارشية أسوان',
    location: 'أسوان',
    churches: [
      { name: 'كنيسة الأنبا مكاريوس - أسوان', city: 'أسوان' },
      { name: 'كنيسة مارجرجس - كوم أمبو', city: 'كوم أمبو' },
    ],
  },
  {
    name: 'إيبارشية بني سويف',
    location: 'بني سويف',
    churches: [
      { name: 'كنيسة مارجرجس - بني سويف', city: 'بني سويف' },
      { name: 'كنيسة العذراء مريم - الفشن', city: 'الفشن' },
      { name: 'كنيسة الأنبا أنطونيوس - ببا', city: 'ببا' },
    ],
  },
  {
    name: 'إيبارشية الفيوم',
    location: 'الفيوم',
    churches: [
      { name: 'كنيسة العذراء مريم - الفيوم', city: 'الفيوم' },
      { name: 'كنيسة مارجرجس - إبشواي', city: 'إبشواي' },
    ],
  },
  {
    name: 'إيبارشية المنصورة',
    location: 'المنصورة',
    churches: [
      { name: 'كنيسة مارجرجس - المنصورة', city: 'المنصورة' },
      { name: 'كنيسة العذراء مريم - طلخا', city: 'طلخا' },
      { name: 'كنيسة مارمينا - المنصورة', city: 'المنصورة' },
    ],
  },
  {
    name: 'إيبارشية طنطا',
    location: 'طنطا',
    churches: [
      { name: 'كنيسة مارجرجس - طنطا', city: 'طنطا' },
      { name: 'كنيسة العذراء مريم - المحلة الكبرى', city: 'المحلة الكبرى' },
    ],
  },
  {
    name: 'إيبارشية الشرقية',
    location: 'الزقازيق',
    churches: [
      { name: 'كنيسة مارجرجس - الزقازيق', city: 'الزقازيق' },
      { name: 'كنيسة العذراء مريم - بلبيس', city: 'بلبيس' },
    ],
  },
  {
    name: 'إيبارشية بورسعيد',
    location: 'بورسعيد',
    churches: [
      { name: 'كنيسة مارجرجس - بورسعيد', city: 'بورسعيد' },
      { name: 'كنيسة العذراء مريم - بورسعيد', city: 'بورسعيد' },
    ],
  },
]

const CLASS_NAMES = [
  'حضانة',
  'أولى ابتدائي',
  'ثانية ابتدائي',
  'ثالثة ابتدائي',
  'رابعة ابتدائي',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function createAuthUser(email: string, password: string, fullName: string) {
  // The hosted auth API intermittently rejects valid requests, so retry
  // transient failures (including flaky listUsers in the recovery path).
  let lastError: unknown
  for (let attempt = 1; attempt <= 7; attempt++) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    if (!error) {
      if (data?.user) return data.user.id
      lastError = new Error('no user returned')
    } else if (error.message?.includes('already been registered')) {
      // Fetch existing user and reset its password
      const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      const existing = list?.users?.find((u) => u.email === email)
      if (existing) {
        await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true })
        return existing.id
      }
      lastError = listError ?? error
    } else {
      lastError = error
    }
    await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** (attempt - 1), 30000)))
  }
  const msg = lastError instanceof Error ? lastError.message : JSON.stringify(lastError)
  throw new Error(`Failed to create user ${email}: ${msg}`)
}

async function waitForProfile(userId: string, retries = 5): Promise<void> {
  for (let i = 0; i < retries; i++) {
    const { data } = await supabase.from('users').select('id').eq('id', userId).single()
    if (data) return
    await new Promise((r) => setTimeout(r, 500))
  }
}

async function updateProfile(
  userId: string,
  fields: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('users').update(fields).eq('id', userId)
  if (error) throw new Error(`Failed to update profile ${userId}: ${error.message}`)
}

// ---------------------------------------------------------------------------
// Flush
// ---------------------------------------------------------------------------

async function flush() {
  console.log('Flushing all data...')

  // Delete all auth users (cascades to public.users via FK)
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const users = list?.users || []
  console.log(`  Deleting ${users.length} auth users...`)
  for (const u of users) {
    await supabase.auth.admin.deleteUser(u.id)
  }

  // Delete data tables in FK-safe order (children first)
  const tables = [
    'points_transactions', 'student_points_balance', 'church_points_config',
    'order_items', 'orders',
    'activity_completions', 'activity_participants', 'activities',
    'trip_participants', 'trip_destinations', 'trip_churches', 'trip_dioceses', 'trips',
    'announcement_views', 'announcements',
    'class_assignments', 'classes',
    'user_relationships', 'user_roles',
    'login_history', 'user_settings', 'notifications',
    'user_badges', 'user_streaks',
    'store_items',
    'churches', 'dioceses',
    'rate_limits', 'audit_logs',
  ]

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().gte('created_at', '1970-01-01')
    if (error) {
      console.log(`  Warning: could not clear ${table}: ${error.message}`)
    }
  }

  console.log('  Flush complete.')
}

// ---------------------------------------------------------------------------
// Seed permissions & roles (idempotent — migration 48 already seeds these,
// but we re-run to ensure they exist after a flush)
// ---------------------------------------------------------------------------

async function seedPermissionsAndRoles() {
  console.log('Seeding permissions & roles...')

  // Check if permissions exist
  const { count } = await supabase.from('permissions').select('id', { count: 'exact', head: true })
  if (count && count > 0) {
    console.log(`  Permissions already seeded (${count} found), skipping.`)
    return
  }

  console.log('  Permissions missing — run migrations first: npm run db:push')
  console.log('  The seeder expects migration 48_seed_permissions.sql to have run.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Seed dioceses, churches, classes
// ---------------------------------------------------------------------------

async function getOrCreateChurch(dioceseId: string, name: string, city: string) {
  const { data: existing } = await supabase
    .from('churches')
    .select('id, name')
    .eq('diocese_id', dioceseId)
    .eq('name', name)
    .limit(1)
    .maybeSingle()
  if (existing) return existing
  const { data: ch, error } = await supabase
    .from('churches')
    .insert({ diocese_id: dioceseId, name, city })
    .select('id, name')
    .single()
  if (error) console.error(`  Church "${name}" failed: ${error.message}`)
  return ch
}

async function getOrCreateClass(churchId: string, name: string, description: string) {
  const { data: existing } = await supabase
    .from('classes')
    .select('id, name')
    .eq('church_id', churchId)
    .eq('name', name)
    .limit(1)
    .maybeSingle()
  if (existing) return existing
  const { data: cls, error } = await supabase
    .from('classes')
    .insert({
      church_id: churchId,
      name,
      description,
      academic_year: '2025-2026',
      is_active: true,
    })
    .select('id, name')
    .single()
  if (error) console.error(`  Class "${name}" failed: ${error.message}`)
  return cls
}

async function seedDiocesesAndChurches() {
  console.log('Seeding dioceses, churches, and classes...')

  const createdDioceses: { id: string; name: string }[] = []
  const createdChurches: { id: string; name: string; dioceseId: string }[] = []
  const createdClasses: { id: string; name: string; churchId: string }[] = []

  for (const d of EGYPT_DIOCESES) {
    // Get-or-create diocese (name has no unique constraint, so select first)
    let diocese: { id: string; name: string } | null = null
    const { data: existing } = await supabase
      .from('dioceses')
      .select('id, name')
      .eq('name', d.name)
      .limit(1)
      .maybeSingle()
    if (existing) {
      diocese = existing
    } else {
      const { data: newD, error: dErr } = await supabase
        .from('dioceses')
        .insert({ name: d.name, location: d.location, description: `${d.name} - مصر` })
        .select('id, name')
        .single()
      if (dErr) console.error(`  Diocese "${d.name}" failed: ${dErr.message}`)
      diocese = newD
    }
    if (!diocese) continue

    createdDioceses.push(diocese)

    for (const c of d.churches) {
      const ch = await getOrCreateChurch(diocese.id, c.name, c.city)
      if (ch) createdChurches.push({ ...ch, dioceseId: diocese.id })
    }
  }

  console.log(`  Created ${createdDioceses.length} dioceses, ${createdChurches.length} churches`)

  // Create 5 classes per church
  for (const church of createdChurches) {
    for (const className of CLASS_NAMES) {
      const cls = await getOrCreateClass(church.id, className, `${className} - ${church.name}`)
      if (cls) createdClasses.push({ ...cls, churchId: church.id })
    }
  }

  console.log(`  Created ${createdClasses.length} classes`)

  return { dioceses: createdDioceses, churches: createdChurches, classes: createdClasses }
}

// ---------------------------------------------------------------------------
// Seed users
// ---------------------------------------------------------------------------

async function seedUsers(
  dioceses: { id: string; name: string }[],
  churches: { id: string; name: string; dioceseId: string }[],
  classes: { id: string; name: string; churchId: string }[]
) {
  console.log('Seeding users...')

  // ---------- 2 Super Admins ----------
  const superAdmins = [
    { email: 'admin1@knasty.local', name: 'مدير النظام ١', password: 'Admin@123456' },
    { email: 'admin2@knasty.local', name: 'مدير النظام ٢', password: 'Admin@123456' },
  ]

  for (const sa of superAdmins) {
    const uid = await createAuthUser(sa.email, sa.password, sa.name)
    await waitForProfile(uid)
    await updateProfile(uid, {
      role: 'super_admin',
      full_name: sa.name,
      is_active: true,
    })
    console.log(`  Super Admin: ${sa.email}`)
  }

  // ---------- 1 Diocese Admin per diocese ----------
  for (let di = 0; di < dioceses.length; di++) {
    const diocese = dioceses[di]
    const email = `diocese.admin.${di + 1}@knasty.local`
    const uid = await createAuthUser(email, 'Test@123456', `مسؤول ${diocese.name}`)
    await waitForProfile(uid)
    await updateProfile(uid, {
      role: 'diocese_admin',
      full_name: `مسؤول ${diocese.name}`,
      diocese_id: diocese.id,
      is_active: true,
    })
  }
  console.log(`  ${dioceses.length} diocese admins`)

  // ---------- 1 Church Admin per church ----------
  for (let ci = 0; ci < churches.length; ci++) {
    const church = churches[ci]
    const email = `church.admin.${ci + 1}@knasty.local`
    const uid = await createAuthUser(email, 'Test@123456', `مسؤول ${church.name}`)
    await waitForProfile(uid)
    await updateProfile(uid, {
      role: 'church_admin',
      full_name: `مسؤول ${church.name}`,
      diocese_id: church.dioceseId,
      church_id: church.id,
      is_active: true,
    })
  }
  console.log(`  ${churches.length} church admins`)

  // ---------- 1 Teacher per class ----------
  let teacherCount = 0
  for (let ti = 0; ti < classes.length; ti++) {
    const cls = classes[ti]
    const church = churches.find((c) => c.id === cls.churchId)!
    const email = `teacher.${ti + 1}@knasty.local`
    const uid = await createAuthUser(email, 'Test@123456', `معلم ${cls.name} - ${church.name}`)
    await waitForProfile(uid)
    await updateProfile(uid, {
      role: 'teacher',
      full_name: `معلم ${cls.name}`,
      diocese_id: church.dioceseId,
      church_id: church.id,
      is_active: true,
    })

    // Assign teacher to class
    await supabase.from('class_assignments').insert({
      class_id: cls.id,
      user_id: uid,
      assignment_type: 'teacher',
      is_active: true,
    })
    teacherCount++
  }
  console.log(`  ${teacherCount} teachers (assigned to classes)`)

  // ---------- 3 Students per class ----------
  let studentCount = 0
  for (let si = 0; si < classes.length; si++) {
    const cls = classes[si]
    const church = churches.find((c) => c.id === cls.churchId)!
    for (let i = 1; i <= 3; i++) {
      const email = `student.${si * 3 + i}@knasty.local`
      const uid = await createAuthUser(email, 'Test@123456', `طالب ${i} - ${cls.name}`)
      await waitForProfile(uid)
      await updateProfile(uid, {
        role: 'student',
        full_name: `طالب ${i} - ${cls.name}`,
        diocese_id: church.dioceseId,
        church_id: church.id,
        is_active: true,
        gender: i % 2 === 0 ? 'male' : 'female',
      })

      // Assign student to class
      await supabase.from('class_assignments').insert({
        class_id: cls.id,
        user_id: uid,
        assignment_type: 'student',
        is_active: true,
      })
      studentCount++
    }
  }
  console.log(`  ${studentCount} students (assigned to classes)`)

  // After all users are created, update non-admin passwords to user_code@knasty.temp
  console.log('  Updating non-admin passwords to {user_code}@knasty.temp...')
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, user_code, role')
  if (allUsers) {
    let updated = 0
    let failed = 0
    for (const u of allUsers) {
      // Skip super_admins — they keep Admin@123456
      if (u.role === 'super_admin') continue
      if (u.user_code) {
        // Retry: the hosted auth API has short intermittent failure windows
        let ok = false
        for (let attempt = 1; attempt <= 5 && !ok; attempt++) {
          const { error } = await supabase.auth.admin.updateUserById(u.id, {
            password: `${u.user_code}@knasty.temp`,
          })
          if (!error) ok = true
          else await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)))
        }
        if (ok) updated++
        else {
          failed++
          console.error(`  Password update failed for user ${u.id}`)
        }
      }
    }
    console.log(`  Updated ${updated} passwords, ${failed} failed (super_admins keep Admin@123456)`)
  }
}

// ---------------------------------------------------------------------------
// Seed system roles assignment (map users.role → user_roles junction)
// ---------------------------------------------------------------------------

async function seedUserRoleAssignments() {
  console.log('Mapping users to system roles...')

  const roleMap: Record<string, string> = {}
  const { data: roles } = await supabase.from('roles').select('id, title').eq('is_system_role', true)
  if (!roles || roles.length === 0) {
    console.log('  No system roles found — skipping user_roles mapping.')
    return
  }

  for (const r of roles) {
    const key = r.title.toLowerCase().replace(/\s+/g, '_')
    roleMap[key] = r.id
  }

  const { data: users } = await supabase.from('users').select('id, role')
  if (!users) return

  let mapped = 0
  for (const u of users) {
    const roleId = roleMap[u.role]
    if (roleId) {
      await supabase.from('user_roles').upsert(
        { user_id: u.id, role_id: roleId },
        { onConflict: 'user_id,role_id' }
      )
      mapped++
    }
  }
  console.log(`  Mapped ${mapped} users to system roles`)
}

// ---------------------------------------------------------------------------
// Seed announcements
// ---------------------------------------------------------------------------

async function seedAnnouncements(
  dioceses: { id: string }[],
  churches: { id: string }[],
) {
  console.log('Seeding announcements...')

  // Get a super_admin for created_by
  const { data: admin } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'super_admin')
    .limit(1)
    .single()
  const createdBy = admin?.id || null

  const now = new Date()
  const announcements = [
    {
      title: 'مرحبًا بكم في العام الدراسي الجديد',
      description: '<p>نرحب بجميع الطلاب والمعلمين في بداية العام الدراسي الجديد ٢٠٢٥-٢٠٢٦. نتمنى لكم عامًا مباركًا مليئًا بالنمو الروحي.</p>',
      audience: 'both',
      target_roles: ['student', 'parent', 'teacher'],
      publish_from: new Date(now.getTime() - 7 * 86400000).toISOString(),
      types: ['general'],
    },
    {
      title: 'مسابقة حفظ المزامير',
      description: '<p>تبدأ مسابقة حفظ المزامير يوم الأحد القادم. المطلوب حفظ مزمور ٢٣ كاملاً. الجوائز: ٥٠ نقطة للمركز الأول.</p>',
      audience: 'students',
      target_roles: ['student'],
      publish_from: new Date(now.getTime() - 3 * 86400000).toISOString(),
      types: ['competition'],
    },
    {
      title: 'اجتماع أولياء الأمور',
      description: '<p>ندعو جميع أولياء الأمور لحضور الاجتماع الدوري يوم الجمعة القادم الساعة ٦ مساءً لمناقشة خطة الفصل الدراسي.</p>',
      audience: 'parents',
      target_roles: ['parent'],
      publish_from: new Date(now.getTime() - 1 * 86400000).toISOString(),
      types: ['meeting'],
    },
    {
      title: 'تحديث جدول الحصص',
      description: '<p>تم تحديث جدول الحصص لجميع الفصول. يرجى مراجعة الجدول الجديد من خلال صفحة الفصل الخاص بكم.</p>',
      audience: 'both',
      target_roles: ['student', 'parent', 'teacher'],
      publish_from: now.toISOString(),
      types: ['general'],
    },
    {
      title: 'رحلة دير الأنبا بولا',
      description: '<p>رحلة روحية إلى دير الأنبا بولا بالبحر الأحمر. التسجيل متاح الآن من خلال صفحة الرحلات.</p>',
      audience: 'both',
      target_roles: ['student', 'parent'],
      publish_from: now.toISOString(),
      publish_to: new Date(now.getTime() + 14 * 86400000).toISOString(),
      types: ['trip'],
    },
  ]

  // No scope rows = globally visible (targeting is via announcement_dioceses/
  // announcement_churches/announcement_classes junction tables, migration 28)
  let created = 0
  for (const a of announcements) {
    const { error } = await supabase.from('announcements').insert({
      ...a,
      is_deleted: false,
      created_by: createdBy,
    })
    if (error) {
      console.error(`  Announcement "${a.title}" failed: ${error.message}`)
    } else {
      created++
    }
  }
  console.log(`  Created ${created}/${announcements.length} announcements`)
}

// ---------------------------------------------------------------------------
// Seed trips
// ---------------------------------------------------------------------------

async function seedTrips(
  churches: { id: string; dioceseId: string }[],
) {
  console.log('Seeding trips...')

  const { data: admin } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'super_admin')
    .limit(1)
    .single()
  const createdBy = admin?.id || null

  const now = new Date()
  const trips = [
    {
      title: 'رحلة دير الأنبا بولا',
      description: 'رحلة روحية إلى دير الأنبا بولا بالبحر الأحمر',
      destination: 'دير الأنبا بولا - البحر الأحمر',
      trip_type: 'spiritual',
      start_datetime: new Date(now.getTime() + 14 * 86400000).toISOString(),
      end_datetime: new Date(now.getTime() + 15 * 86400000).toISOString(),
      price_normal: 150, price_mastor: 100, price_botl: 50,
      transportation_details: 'أتوبيس مكيف - التجمع الساعة ٦ صباحًا أمام الكنيسة',
      what_to_bring: 'مياه - طعام خفيف - كتاب مقدس - مفكرة',
      participation_points: 30,
    },
    {
      title: 'رحلة ترفيهية - أكوا بارك',
      description: 'رحلة ترفيهية لطلاب مدارس الأحد',
      destination: 'أكوا بارك - ٦ أكتوبر',
      trip_type: 'fun',
      start_datetime: new Date(now.getTime() + 21 * 86400000).toISOString(),
      end_datetime: new Date(now.getTime() + 21 * 86400000 + 10 * 3600000).toISOString(),
      price_normal: 200, price_mastor: 150, price_botl: 80,
      transportation_details: 'أتوبيس مكيف - التجمع الساعة ٨ صباحًا',
      what_to_bring: 'ملابس سباحة - واقي شمس - مياه',
      participation_points: 20,
    },
    {
      title: 'معسكر روحي - الأقصر',
      description: 'معسكر روحي لمدة ٣ أيام في الأقصر',
      destination: 'الأقصر',
      trip_type: 'retreat',
      start_datetime: new Date(now.getTime() + 30 * 86400000).toISOString(),
      end_datetime: new Date(now.getTime() + 33 * 86400000).toISOString(),
      price_normal: 500, price_mastor: 350, price_botl: 200,
      transportation_details: 'قطار نوم - التجمع في محطة القاهرة الساعة ٨ مساءً',
      what_to_bring: 'ملابس مريحة - كتاب مقدس - أدوات نظافة شخصية',
      participation_points: 50,
    },
    {
      title: 'زيارة دير وادي النطرون',
      description: 'زيارة يوم واحد لأديرة وادي النطرون',
      destination: 'وادي النطرون - البحيرة',
      trip_type: 'one_day',
      start_datetime: new Date(now.getTime() + 7 * 86400000).toISOString(),
      end_datetime: new Date(now.getTime() + 7 * 86400000 + 12 * 3600000).toISOString(),
      price_normal: 120, price_mastor: 80, price_botl: 40,
      transportation_details: 'أتوبيس مكيف - التجمع الساعة ٥ صباحًا',
      what_to_bring: 'مياه - طعام - كتاب مقدس',
      participation_points: 25,
    },
  ]

  const firstChurches = churches.slice(0, 8)

  for (const t of trips) {
    const { data: trip } = await supabase
      .from('trips')
      .insert({
        ...t,
        church_id: firstChurches[0]?.id || null,
        status: 'active',
        available: true,
        created_by: createdBy,
      })
      .select('id')
      .single()

    if (trip) {
      // Link trip to multiple churches
      for (const ch of firstChurches) {
        await supabase.from('trip_churches').insert({
          trip_id: trip.id,
          church_id: ch.id,
        }).then(() => {})
      }
      // Link trip to diocese
      const uniqueDioceses = [...new Set(firstChurches.map((c) => c.dioceseId))]
      for (const dId of uniqueDioceses) {
        await supabase.from('trip_dioceses').insert({
          trip_id: trip.id,
          diocese_id: dId,
        }).then(() => {})
      }
    }
  }
  console.log(`  Created ${trips.length} trips (linked to ${firstChurches.length} churches)`)
}

// ---------------------------------------------------------------------------
// Seed activities
// ---------------------------------------------------------------------------

async function seedActivities(
  dioceses: { id: string }[],
  churches: { id: string; dioceseId: string }[],
) {
  console.log('Seeding activities...')

  const { data: admin } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'super_admin')
    .limit(1)
    .single()
  const createdBy = admin?.id || null

  const now = new Date()

  // Global activities (available to all)
  const globalActivities = [
    { name: 'حفظ مزمور ٢٣', description: 'حفظ مزمور ٢٣ (الرب راعيّ) كاملاً وتسميعه', points: 50, status: 'active' },
    { name: 'قراءة سفر يونان', description: 'قراءة سفر يونان كاملاً وكتابة ملخص', points: 30, status: 'active' },
    { name: 'حضور ٤ أسابيع متتالية', description: 'الحضور المنتظم لمدة ٤ أسابيع بدون غياب', points: 40, status: 'active' },
    { name: 'مسابقة الكتاب المقدس', description: 'المشاركة في مسابقة الكتاب المقدس الشهرية', points: 60, status: 'active' },
  ]

  for (const a of globalActivities) {
    await supabase.from('activities').insert({
      ...a,
      diocese_id: null, church_id: null, class_id: null,
      requires_participation_approval: false,
      requires_completion_approval: true,
      is_time_sensitive: false,
      deadline: new Date(now.getTime() + 60 * 86400000).toISOString(),
      created_by: createdBy,
    })
  }

  // Diocese-level activities (first 3 dioceses)
  const dioceseActivities = [
    { name: 'مسابقة الترانيم', description: 'مسابقة حفظ وأداء الترانيم على مستوى الإيبارشية', points: 80 },
    { name: 'مشروع خدمة المجتمع', description: 'المشاركة في مشروع خدمة المجتمع المحلي', points: 100 },
  ]

  for (const d of dioceses.slice(0, 3)) {
    for (const a of dioceseActivities) {
      await supabase.from('activities').insert({
        ...a,
        diocese_id: d.id, church_id: null, class_id: null,
        status: 'active',
        requires_participation_approval: true,
        requires_completion_approval: true,
        is_time_sensitive: false,
        deadline: new Date(now.getTime() + 45 * 86400000).toISOString(),
        created_by: createdBy,
      })
    }
  }

  // Church-level activities (first 5 churches)
  const churchActivities = [
    { name: 'ألحان الكنيسة', description: 'تعلم ألحان القداس الإلهي', points: 35 },
    { name: 'خدمة التربية الكنسية', description: 'المساعدة في تنظيم فصول مدارس الأحد', points: 45 },
  ]

  for (const ch of churches.slice(0, 5)) {
    for (const a of churchActivities) {
      await supabase.from('activities').insert({
        ...a,
        diocese_id: ch.dioceseId, church_id: ch.id, class_id: null,
        status: 'active',
        requires_participation_approval: false,
        requires_completion_approval: true,
        is_time_sensitive: false,
        created_by: createdBy,
      })
    }
  }

  const total = globalActivities.length + dioceseActivities.length * 3 + churchActivities.length * 5
  console.log(`  Created ${total} activities (${globalActivities.length} global, ${dioceseActivities.length * 3} diocese, ${churchActivities.length * 5} church)`)
}

// ---------------------------------------------------------------------------
// Seed store items
// ---------------------------------------------------------------------------

async function seedStoreItems(
  churches: { id: string }[],
) {
  console.log('Seeding store items...')

  const { data: admin } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'super_admin')
    .limit(1)
    .single()
  const createdBy = admin?.id || null

  // Global store items (available to all churches)
  const globalItems = [
    { name: 'كتاب مقدس صغير', description: 'كتاب مقدس حجم جيب', price_normal: 50, price_mastor: 35, price_botl: 20, stock_quantity: 100 },
    { name: 'صليب خشبي', description: 'صليب خشبي منحوت يدويًا', price_normal: 30, price_mastor: 20, price_botl: 10, stock_quantity: 200 },
    { name: 'أيقونة العذراء مريم', description: 'أيقونة صغيرة للعذراء مريم', price_normal: 40, price_mastor: 30, price_botl: 15, stock_quantity: 50 },
    { name: 'مفكرة روحية', description: 'مفكرة مع آيات يومية', price_normal: 25, price_mastor: 18, price_botl: 10, stock_quantity: 150 },
    { name: 'ميدالية مارجرجس', description: 'ميدالية معدنية بصورة مارجرجس', price_normal: 15, price_mastor: 10, price_botl: 5, stock_quantity: 300 },
    { name: 'سي دي ترانيم', description: 'مجموعة ترانيم قبطية', price_normal: 20, price_mastor: 15, price_botl: 8, stock_quantity: 80 },
    { name: 'حقيبة مدارس الأحد', description: 'حقيبة قماشية بشعار مدارس الأحد', price_normal: 60, price_mastor: 45, price_botl: 25, stock_quantity: 40 },
    { name: 'تيشيرت مدارس الأحد', description: 'تيشيرت قطني بشعار مدارس الأحد', price_normal: 80, price_mastor: 60, price_botl: 35, stock_quantity: 60 },
  ]

  for (const item of globalItems) {
    await supabase.from('store_items').insert({
      ...item,
      church_id: null,
      is_active: true,
      created_by: createdBy,
    })
  }

  // Church-specific items (first 3 churches)
  const churchItems = [
    { name: 'شهادة تقدير', description: 'شهادة تقدير مطبوعة باسم الطالب', price_normal: 10, price_mastor: 8, price_botl: 5, stock_quantity: 500 },
    { name: 'كأس التفوق', description: 'كأس صغير للطلاب المتفوقين', price_normal: 100, price_mastor: 75, price_botl: 50, stock_quantity: 10 },
  ]

  for (const ch of churches.slice(0, 3)) {
    for (const item of churchItems) {
      await supabase.from('store_items').insert({
        ...item,
        church_id: ch.id,
        is_active: true,
        created_by: createdBy,
      })
    }
  }

  console.log(`  Created ${globalItems.length + churchItems.length * 3} store items`)
}

// ---------------------------------------------------------------------------
// Seed parents + relationships
// ---------------------------------------------------------------------------

async function seedParents(
  churches: { id: string; dioceseId: string }[],
) {
  console.log('Seeding parents...')

  // Get some students to link parents to
  const { data: students } = await supabase
    .from('users')
    .select('id, church_id, diocese_id')
    .eq('role', 'student')
    .limit(30)

  if (!students || students.length === 0) {
    console.log('  No students found, skipping parents.')
    return
  }

  let parentCount = 0
  // Create 1 parent per 3 students (so ~10 parents)
  for (let i = 0; i < students.length; i += 3) {
    const student = students[i]
    const email = `parent.${i + 1}@knasty.local`
    const uid = await createAuthUser(email, 'Test@123456', `ولي أمر ${i + 1}`)
    await waitForProfile(uid)
    await updateProfile(uid, {
      role: 'parent',
      full_name: `ولي أمر ${i + 1}`,
      diocese_id: student.diocese_id,
      church_id: student.church_id,
      is_active: true,
    })

    // Link parent to this student and the next 1-2
    for (let j = i; j < Math.min(i + 3, students.length); j++) {
      await supabase.from('user_relationships').insert({
        parent_id: uid,
        student_id: students[j].id,
        relationship_type: 'parent',
        is_active: true,
      })
    }
    parentCount++
  }

  // Update parent passwords to user_code@knasty.temp
  const { data: parents } = await supabase
    .from('users')
    .select('id, user_code')
    .eq('role', 'parent')
  if (parents) {
    for (const p of parents) {
      if (p.user_code) {
        await supabase.auth.admin.updateUserById(p.id, {
          password: `${p.user_code}@knasty.temp`,
        })
      }
    }
  }

  console.log(`  Created ${parentCount} parents (linked to students)`)
}

// ---------------------------------------------------------------------------
// Seed church points config
// ---------------------------------------------------------------------------

async function seedPointsConfig(churches: { id: string }[]) {
  console.log('Seeding church points config...')
  let count = 0
  for (const ch of churches) {
    const { error } = await supabase.from('church_points_config').upsert({
      church_id: ch.id,
      attendance_points_present: 10,
      attendance_points_late: 5,
      attendance_points_excused: 0,
      attendance_points_absent: 0,
      trip_participation_points: 20,
      max_teacher_adjustment: 50,
      is_attendance_points_enabled: true,
      is_trip_points_enabled: true,
      is_teacher_adjustment_enabled: true,
    }, { onConflict: 'church_id' })
    if (!error) count++
  }
  console.log(`  Configured ${count} churches with points settings`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Knasty Portal Database Seeder ===')
  console.log(`Supabase: ${SUPABASE_URL}`)
  console.log(`Mode: ${CLEAR ? 'FLUSH + SEED' : 'SEED (additive)'}`)
  console.log()

  if (CLEAR) {
    await flush()
    console.log()
  }

  await seedPermissionsAndRoles()

  const { dioceses, churches, classes } = await seedDiocesesAndChurches()

  await seedUsers(dioceses, churches, classes)

  await seedUserRoleAssignments()

  // Extended data
  await seedAnnouncements(dioceses, churches)
  await seedTrips(churches)
  await seedActivities(dioceses, churches)
  await seedStoreItems(churches)
  await seedParents(churches)
  await seedPointsConfig(churches)

  console.log()
  console.log('=== Seed complete! ===')
  console.log()
  console.log('Key accounts:')
  console.log('  admin1@knasty.local  /  Admin@123456  (super_admin)')
  console.log('  admin2@knasty.local  /  Admin@123456  (super_admin)')
  console.log()
  console.log('All other users: password = {user_code}@knasty.temp')
  console.log('Login with email OR 6-digit user code.')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
