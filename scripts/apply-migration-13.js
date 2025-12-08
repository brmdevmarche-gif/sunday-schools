const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })

// Extract connection details from Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

// Parse Supabase project ref from URL (e.g., https://xxxxx.supabase.co)
const projectRef = new URL(supabaseUrl).hostname.split('.')[0]

// Construct Postgres connection string
// For Supabase: postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
const connectionString = process.env.DATABASE_URL ||
  `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`

async function applyMigration() {
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    const migrationPath = path.join(process.cwd(), 'supabase/migrations/13_add_images_and_themes.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('📝 Applying migration 13_add_images_and_themes.sql...')

    await client.query(sql)

    console.log('✅ Migration applied successfully')
  } catch (error) {
    console.error('❌ Error applying migration:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

applyMigration()
