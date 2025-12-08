import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...')

  // Delete in reverse order of dependencies
  await supabase.from('class_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('user_relationships').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('classes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('diocese_admin_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('churches').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('dioceses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  // Note: We don't delete users as they're managed by Supabase Auth

  console.log('✅ Database cleared')
}

async function seedDioceses() {
  console.log('🏛️  Seeding dioceses...')

  const dioceseNames = [
    { name: 'Diocese of Alexandria', location: 'Alexandria, Egypt', phone: '+20 3 123 4567' },
    { name: 'Diocese of Cairo', location: 'Cairo, Egypt', phone: '+20 2 234 5678' },
    { name: 'Diocese of Giza', location: 'Giza, Egypt', phone: '+20 2 345 6789' },
    { name: 'Diocese of Upper Egypt', location: 'Assiut, Egypt', phone: '+20 88 345 6789' },
    { name: 'Diocese of Lower Egypt', location: 'Tanta, Egypt', phone: '+20 40 456 7890' },
    { name: 'Diocese of Suez', location: 'Suez, Egypt', phone: '+20 62 567 8901' },
    { name: 'Diocese of Port Said', location: 'Port Said, Egypt', phone: '+20 66 678 9012' },
    { name: 'Diocese of Luxor', location: 'Luxor, Egypt', phone: '+20 95 789 0123' },
    { name: 'Diocese of Aswan', location: 'Aswan, Egypt', phone: '+20 97 890 1234' },
    { name: 'Diocese of Sharm El Sheikh', location: 'Sharm El Sheikh, Egypt', phone: '+20 69 901 2345' },
  ]

  const themeColors = [
    { primary: '#3b82f6', secondary: '#8b5cf6', accent: '#ec4899' },
    { primary: '#10b981', secondary: '#06b6d4', accent: '#f59e0b' },
    { primary: '#ef4444', secondary: '#f97316', accent: '#eab308' },
    { primary: '#8b5cf6', secondary: '#ec4899', accent: '#3b82f6' },
    { primary: '#06b6d4', secondary: '#10b981', accent: '#f59e0b' },
    { primary: '#f97316', secondary: '#ef4444', accent: '#eab308' },
    { primary: '#ec4899', secondary: '#8b5cf6', accent: '#3b82f6' },
    { primary: '#f59e0b', secondary: '#10b981', accent: '#06b6d4' },
    { primary: '#eab308', secondary: '#ef4444', accent: '#f97316' },
    { primary: '#3b82f6', secondary: '#06b6d4', accent: '#10b981' },
  ]

  const dioceses = dioceseNames.map((diocese, index) => ({
    name: diocese.name,
    description: `Serving the Christian community in ${diocese.location.split(',')[0]} and surrounding areas with faith and dedication.`,
    location: diocese.location,
    contact_email: `info@${diocese.name.toLowerCase().replace(/\s+/g, '').replace('diocese', '').replace('of', '')}diocese.org`,
    contact_phone: diocese.phone,
    logo_image_url: `https://picsum.photos/seed/${diocese.name.replace(/\s+/g, '-').toLowerCase()}-logo/400/400`,
    cover_image_url: `https://picsum.photos/seed/${diocese.name.replace(/\s+/g, '-').toLowerCase()}-cover/1200/400`,
    theme_primary_color: themeColors[index].primary,
    theme_secondary_color: themeColors[index].secondary,
    theme_accent_color: themeColors[index].accent,
  }))

  const { data, error } = await supabase
    .from('dioceses')
    .insert(dioceses)
    .select()

  if (error) {
    console.error('Error seeding dioceses:', error)
    throw error
  }

  console.log(`✅ Created ${data.length} dioceses`)
  return data
}

async function seedChurches(dioceses: any[]) {
  console.log('⛪ Seeding churches...')

  const saintNames = [
    'St. Mark', 'St. Mary', 'St. George', 'Holy Trinity', 'St. Anthony',
    'St. John', 'St. Peter', 'St. Paul', 'St. Stephen', 'St. Michael',
    'St. Gabriel', 'St. Raphael', 'St. Joseph', 'St. Thomas', 'St. Matthew',
    'St. Luke', 'St. James', 'St. Andrew', 'St. Philip', 'St. Bartholomew',
    'St. Mina', 'St. Bishoy', 'St. Shenouda', 'St. Samuel', 'St. Mercurius',
    'St. Demiana', 'St. Marina', 'St. Catherine', 'St. Barbara', 'St. Verena',
    'St. Teresa', 'St. Monica', 'St. Augustine', 'St. Athanasius', 'St. Cyril',
    'St. Basil', 'St. Gregory', 'St. Nicholas', 'St. Clement', 'St. Ignatius',
  ]

  const churchTypes = ['Cathedral', 'Church', 'Chapel', 'Parish', 'Basilica']

  const churches = []
  let saintIndex = 0

  // Create 4 churches per diocese (10 dioceses × 4 = 40 churches)
  for (let dioceseIndex = 0; dioceseIndex < dioceses.length; dioceseIndex++) {
    const diocese = dioceses[dioceseIndex]
    const city = diocese.location.split(',')[0]

    for (let i = 0; i < 4; i++) {
      const saintName = saintNames[saintIndex % saintNames.length]
      const churchType = churchTypes[i % churchTypes.length]
      const churchName = `${saintName} ${churchType}`
      const slug = churchName.toLowerCase().replace(/\s+/g, '')

      churches.push({
        diocese_id: diocese.id,
        name: churchName,
        description: `A vibrant parish serving the ${city} community with dedication and faith.`,
        city: city,
        address: `${100 + saintIndex} ${saintName.replace('St. ', '')} Street`,
        contact_email: `${slug}@${diocese.name.toLowerCase().replace(/\s+/g, '').replace('diocese', '').replace('of', '')}diocese.org`,
        contact_phone: `+20 ${10 + dioceseIndex} ${100 + saintIndex} ${1000 + saintIndex}`,
        logo_image_url: `https://picsum.photos/seed/${slug}-logo/400/400`,
        cover_image_url: `https://picsum.photos/seed/${slug}-cover/1200/400`,
      })

      saintIndex++
    }
  }

  const { data, error } = await supabase
    .from('churches')
    .insert(churches)
    .select()

  if (error) {
    console.error('Error seeding churches:', error)
    throw error
  }

  console.log(`✅ Created ${data.length} churches`)
  return data
}

async function seedClasses(churches: any[]) {
  console.log('📚 Seeding classes...')

  const gradeLevels = [
    { grade: 'Kindergarten', time: '9:00 AM - 10:00 AM', capacity: 15 },
    { grade: 'Grade 1', time: '10:00 AM - 11:30 AM', capacity: 20 },
    { grade: 'Grade 3', time: '10:00 AM - 11:30 AM', capacity: 22 },
    { grade: 'Grade 5', time: '11:45 AM - 1:15 PM', capacity: 25 },
    { grade: 'Grade 7', time: '11:45 AM - 1:15 PM', capacity: 25 },
    { grade: 'High School', time: '6:00 PM - 8:00 PM', capacity: 30 },
  ]

  const classes = []

  // Create 3-4 classes per church
  for (const church of churches) {
    const numClasses = 3 + Math.floor(Math.random() * 2) // 3 or 4 classes
    const selectedGrades = gradeLevels.slice(0, numClasses)

    for (const gradeLevel of selectedGrades) {
      const churchShortName = church.name.split(' ')[1] || church.name.split(' ')[0]
      classes.push({
        church_id: church.id,
        name: `${gradeLevel.grade} - ${churchShortName}`,
        description: `Sunday school curriculum for ${gradeLevel.grade} students`,
        grade_level: gradeLevel.grade,
        academic_year: '2024-2025',
        schedule: `Sundays ${gradeLevel.time}`,
        capacity: gradeLevel.capacity,
        is_active: true,
      })
    }
  }

  const { data, error } = await supabase
    .from('classes')
    .insert(classes)
    .select()

  if (error) {
    console.error('Error seeding classes:', error)
    throw error
  }

  console.log(`✅ Created ${data.length} classes`)
  return data
}

async function createSampleUsers(churches: any[], dioceses: any[]) {
  console.log('👥 Creating sample users...')

  const firstNames = {
    male: ['Michael', 'John', 'Peter', 'Paul', 'David', 'James', 'Thomas', 'Matthew', 'Mark', 'Luke', 'Andrew', 'Philip', 'Simon', 'Joseph', 'Daniel', 'Samuel', 'Benjamin', 'Jacob', 'Isaac', 'Abraham', 'Moses', 'Joshua', 'Caleb', 'Nathan', 'Elijah'],
    female: ['Mary', 'Sarah', 'Elizabeth', 'Hannah', 'Rebecca', 'Rachel', 'Ruth', 'Esther', 'Deborah', 'Miriam', 'Anna', 'Martha', 'Lydia', 'Priscilla', 'Dorcas', 'Phoebe', 'Julia', 'Claudia', 'Lois', 'Eunice', 'Monica', 'Catherine', 'Barbara', 'Margaret', 'Helen']
  }
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Carter', 'Mitchell', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Morris', 'Rogers', 'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy']

  const users = []
  const createdUsers = []

  // 1. Create Super Admin
  users.push({
    email: 'admin@sundayschool.org',
    password: 'Admin123!@#',
    full_name: 'System Administrator',
    role: 'super_admin',
    diocese_id: null,
    church_id: null,
  })

  // 2. Create Diocese Admins (2 per diocese = 20 total)
  for (let i = 0; i < dioceses.length; i++) {
    const diocese = dioceses[i]
    const dioceseSlug = diocese.name.toLowerCase().replace(/diocese of |diocese |of |\s+/g, '')

    for (let j = 0; j < 2; j++) {
      const gender = j % 2 === 0 ? 'male' : 'female'
      const firstName = firstNames[gender][i * 2 + j] || firstNames[gender][0]
      const lastName = lastNames[(i * 2 + j) % lastNames.length]
      const title = gender === 'male' ? 'Father' : 'Sister'

      users.push({
        email: `dioceseadmin.${dioceseSlug}${j + 1}@sundayschool.org`,
        password: 'Diocese123!@#',
        full_name: `${title} ${firstName} ${lastName}`,
        role: 'diocese_admin',
        diocese_id: diocese.id,
        church_id: null,
      })
    }
  }

  // 3. Create Church Admins (2 per church = 80 total)
  for (let i = 0; i < churches.length; i++) {
    const church = churches[i]
    const churchSlug = church.name.toLowerCase().replace(/\s+/g, '').substring(0, 20)

    for (let j = 0; j < 2; j++) {
      const gender = j % 2 === 0 ? 'male' : 'female'
      const firstName = firstNames[gender][(i + j) % firstNames[gender].length]
      const lastName = lastNames[(i * 2 + j) % lastNames.length]
      const title = gender === 'male' ? 'Deacon' : 'Deaconess'

      users.push({
        email: `churchadmin.${churchSlug}${j + 1}@sundayschool.org`,
        password: 'Church123!@#',
        full_name: `${title} ${firstName} ${lastName}`,
        role: 'church_admin',
        diocese_id: church.diocese_id,
        church_id: church.id,
      })
    }
  }

  // 4. Create Teachers (50 total, distributed across churches)
  const teachersPerChurch = Math.ceil(50 / churches.length)
  let teacherCount = 0

  for (let i = 0; i < churches.length && teacherCount < 50; i++) {
    const church = churches[i]
    const numTeachers = Math.min(teachersPerChurch, 50 - teacherCount)

    for (let j = 0; j < numTeachers; j++) {
      const gender = (teacherCount % 2 === 0) ? 'female' : 'male'
      const firstName = firstNames[gender][teacherCount % firstNames[gender].length]
      const lastName = lastNames[teacherCount % lastNames.length]

      users.push({
        email: `teacher${teacherCount + 1}@sundayschool.org`,
        password: 'Teacher123!@#',
        full_name: `${firstName} ${lastName}`,
        role: 'teacher',
        diocese_id: church.diocese_id,
        church_id: church.id,
      })

      teacherCount++
    }
  }

  // 5. Create Students (300 total, distributed across churches)
  const studentsPerChurch = Math.ceil(300 / churches.length)
  let studentCount = 0

  for (let i = 0; i < churches.length && studentCount < 300; i++) {
    const church = churches[i]
    const numStudents = Math.min(studentsPerChurch, 300 - studentCount)

    for (let j = 0; j < numStudents; j++) {
      const gender = (studentCount % 2 === 0) ? 'female' : 'male'
      const firstName = firstNames[gender][studentCount % firstNames[gender].length]
      const lastName = lastNames[studentCount % lastNames.length]
      const birthYear = 2008 + (studentCount % 12) // Ages 6-18
      const birthMonth = String(1 + (studentCount % 12)).padStart(2, '0')
      const birthDay = String(1 + (studentCount % 28)).padStart(2, '0')

      users.push({
        email: `student${studentCount + 1}@sundayschool.org`,
        password: 'Student123!@#',
        full_name: `${firstName} ${lastName}`,
        role: 'student',
        diocese_id: church.diocese_id,
        church_id: church.id,
        date_of_birth: `${birthYear}-${birthMonth}-${birthDay}`,
        gender: gender,
      })

      studentCount++
    }
  }

  console.log(`📊 Generating ${users.length} users...`)
  console.log(`   - 1 Super Admin`)
  console.log(`   - ${dioceses.length * 2} Diocese Admins`)
  console.log(`   - ${churches.length * 2} Church Admins`)
  console.log(`   - 50 Teachers`)
  console.log(`   - 300 Students`)

  // Create users in batches to avoid timeouts
  const batchSize = 20
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize)
    console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)} (${batch.length} users)...`)

    for (const user of batch) {
      try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        })

        if (authError) {
          console.error(`   ✗ ${user.email}: ${authError.message}`)
          continue
        }

        // Update user profile in users table
        const { error: updateError } = await supabase
          .from('users')
          .update({
            full_name: user.full_name,
            role: user.role,
            diocese_id: user.diocese_id,
            church_id: user.church_id,
            date_of_birth: user.date_of_birth || null,
            gender: user.gender || null,
            is_active: true,
          })
          .eq('id', authData.user.id)

        if (updateError) {
          console.error(`   ✗ ${user.email}: ${updateError.message}`)
        } else {
          createdUsers.push({ id: authData.user.id, ...user })
          console.log(`   ✓ ${user.email} (${user.role})`)
        }
      } catch (error: any) {
        console.error(`   ✗ ${user.email}: ${error.message}`)
      }
    }
  }

  console.log(`\n✅ Created ${createdUsers.length} users`)
  return createdUsers
}

async function seedUserSettings(users: any[]) {
  console.log('⚙️  Seeding user settings...')

  const settings = users.map(user => ({
    user_id: user.id,
    language: 'en',
    theme: 'system',
    date_format: 'MM/DD/YYYY',
    time_format: '12h',
    timezone: 'Africa/Cairo',
    notifications_enabled: true,
    email_notifications: true,
  }))

  const { error } = await supabase
    .from('user_settings')
    .insert(settings)

  if (error) {
    console.error('Error seeding user settings:', error)
  } else {
    console.log(`✅ Created ${settings.length} user settings`)
  }
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n')

    // Optional: Clear existing data
    const shouldClear = process.argv.includes('--clear')
    if (shouldClear) {
      await clearDatabase()
      console.log()
    }

    // Seed data
    const dioceses = await seedDioceses()
    console.log()

    const churches = await seedChurches(dioceses)
    console.log()

    const classes = await seedClasses(churches)
    console.log()

    const users = await createSampleUsers(churches, dioceses)
    console.log()

    await seedUserSettings(users)
    console.log()

    console.log('🎉 Database seeding completed successfully!\n')
    console.log('📊 Summary:')
    console.log(`   - ${dioceses.length} Dioceses`)
    console.log(`   - ${churches.length} Churches`)
    console.log(`   - ${classes.length} Classes`)
    console.log(`   - ${users.length} Users (1 super admin, ${dioceses.length * 2} diocese admins, ${churches.length * 2} church admins, 50 teachers, 300 students)`)
    console.log()
    console.log('📝 Sample Credentials:')
    console.log('   Super Admin:        admin@sundayschool.org / Admin123!@#')
    console.log('   Diocese Admin:      dioceseadmin.alexandria1@sundayschool.org / Diocese123!@#')
    console.log('   Church Admin:       churchadmin.stmarkcathedral1@sundayschool.org / Church123!@#')
    console.log('   Teacher:            teacher1@sundayschool.org / Teacher123!@#')
    console.log('   Student:            student1@sundayschool.org / Student123!@#')
    console.log()
    console.log('💡 Login pattern:')
    console.log('   Diocese Admins:     dioceseadmin.[diocesename][1-2]@sundayschool.org')
    console.log('   Church Admins:      churchadmin.[churchname][1-2]@sundayschool.org')
    console.log('   Teachers:           teacher[1-50]@sundayschool.org')
    console.log('   Students:           student[1-300]@sundayschool.org')
    console.log()

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Run the seeding
seedDatabase()
