/**
 * Run Complete Seed - Creates All Dummy Data
 * 
 * Usage:
 *   npx tsx scripts/seed-all-data.ts
 *   or
 *   npm run seed:all
 */

import { seedAllDummyData, getSeedDataSummary } from '../src/lib/utils/seed-all-dummy-data'

async function main() {
  console.log('🌱 Starting complete dummy data seed...\n')
  
  const summary = getSeedDataSummary()
  console.log('📊 Will create:')
  console.log(`  - Diocese & Church (if needed)`)
  console.log(`  - ${summary.teachers} teachers`)
  console.log(`  - ${summary.students} students`)
  console.log(`  - ${summary.classes} classes`)
  console.log(`  - Class assignments (teachers & students)`)
  console.log(`  - Default password: ${summary.defaultPassword}\n`)

  try {
    const result = await seedAllDummyData({
      createDiocese: true,
      createChurch: true,
    })

    console.log('\n📊 Results:')
    console.log('═══════════════════════════════════════════')
    
    if (result.diocese) {
      console.log(`✅ Diocese: ${result.diocese.name} (${result.diocese.id})`)
    }
    if (result.church) {
      console.log(`✅ Church: ${result.church.name} (${result.church.id})`)
    }
    
    console.log(`\n👨‍🏫 Teachers: ${result.teachers.created} created`)
    if (result.teachers.users.length > 0) {
      result.teachers.users.forEach(teacher => {
        console.log(`   - ${teacher.name} (${teacher.email})`)
      })
    }

    console.log(`\n👨‍🎓 Students: ${result.students.created} created`)
    if (result.students.users.length > 0) {
      result.students.users.slice(0, 5).forEach(student => {
        console.log(`   - ${student.name} (${student.email})`)
      })
      if (result.students.users.length > 5) {
        console.log(`   ... and ${result.students.users.length - 5} more`)
      }
    }

    console.log(`\n📚 Classes: ${result.classes.created} created`)
    if (result.classes.classes.length > 0) {
      result.classes.classes.forEach(cls => {
        console.log(`   - ${cls.name}`)
      })
    }

    console.log(`\n🔗 Assignments:`)
    console.log(`   - ${result.assignments.teachers} teacher assignments`)
    console.log(`   - ${result.assignments.students} student enrollments`)

    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors (${result.errors.length}):`)
      result.errors.forEach(error => {
        console.log(`   - ${error}`)
      })
    }

    console.log('\n═══════════════════════════════════════════')
    
    if (result.success) {
      console.log('✅ Seed completed successfully!')
      console.log(`\n🔑 All users have password: ${summary.defaultPassword}`)
      console.log('✨ You can now test the classes module!')
    } else {
      console.log('⚠️  Seed completed with some errors')
      console.log('   Check the errors above for details')
    }
  } catch (error: any) {
    console.error('\n❌ Seed failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()

