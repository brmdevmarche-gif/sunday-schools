/**
 * Standalone script to seed dummy users
 * 
 * Run with: npx tsx scripts/seed-users.ts
 * Or: ts-node scripts/seed-users.ts
 */

import { seedDummyUsers, getSeedDataInfo } from '../src/lib/utils/seed-dummy-users'

async function main() {
  console.log('🌱 Starting to seed dummy users...\n')
  
  const info = getSeedDataInfo()
  console.log(`Will create:`)
  console.log(`  - ${info.teachers} teachers`)
  console.log(`  - ${info.students} students`)
  console.log(`  - Total: ${info.total} users`)
  console.log(`  - Default password: ${info.defaultPassword}\n`)

  // You can optionally pass a churchId here
  // const churchId = 'your-church-id-here'
  const result = await seedDummyUsers()

  console.log('\n📊 Results:')
  console.log(`  ✅ Created: ${result.created}`)
  console.log(`  ❌ Failed: ${result.failed}`)
  console.log(`  ${result.success ? '✅ Success!' : '⚠️  Partial success'}\n`)

  if (result.users.length > 0) {
    console.log('Created users:')
    result.users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`)
    })
  }

  if (result.errors.length > 0) {
    console.log('\n⚠️  Errors:')
    result.errors.forEach(error => {
      console.log(`  - ${error}`)
    })
  }

  console.log(`\n🔑 All users have password: ${info.defaultPassword}`)
  console.log('✨ Done!')
}

main().catch(console.error)

