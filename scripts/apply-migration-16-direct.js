const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  // Get database connection string from Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  // Extract project ref from URL (e.g., https://abc123.supabase.co)
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];

  if (!projectRef) {
    console.error('Could not extract project ref from URL');
    process.exit(1);
  }

  // Construct direct database connection string
  const connectionString = `postgresql://postgres.${projectRef}:${dbPassword || '[REDACTED]'}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

  console.log('Connecting to database...');
  console.log('Project ref:', projectRef);

  let sql;
  try {
    sql = postgres(connectionString, {
      ssl: 'require',
      max: 1,
    });
  } catch (error) {
    console.error('Failed to connect. Trying alternative method...');

    // If direct connection fails, let's just output the SQL for manual execution
    const migrationPath = path.join(__dirname, '../supabase/migrations/16_enhance_store_items.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n================================================================================');
    console.log('Please run this SQL manually in the Supabase SQL Editor:');
    console.log('================================================================================\n');
    console.log(migrationSQL);
    console.log('\n================================================================================');
    return;
  }

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/16_enhance_store_items.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('Applying enhanced store items migration...');

  try {
    await sql.unsafe(migrationSQL);
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);

    // Output SQL for manual execution
    console.log('\n================================================================================');
    console.log('Please run this SQL manually in the Supabase SQL Editor:');
    console.log('================================================================================\n');
    console.log(migrationSQL);
    console.log('\n================================================================================');
  } finally {
    await sql.end();
  }
}

applyMigration().catch(console.error);
