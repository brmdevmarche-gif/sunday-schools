const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  // Parse Supabase URL to get connection string
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  // Extract project reference from URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

  // Construct PostgreSQL connection string
  // Format: postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
  console.log('📋 Please provide your Supabase database password');
  console.log('   (Found in: Supabase Dashboard > Settings > Database > Connection string)');
  console.log('');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Database password: ', async (password) => {
    rl.close();

    const connectionString = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;

    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    try {
      console.log('\n🔄 Connecting to database...');
      await client.connect();
      console.log('✅ Connected!');

      console.log('\n🔄 Running migration...');
      const migrationPath = path.join(
        __dirname,
        '../supabase/migrations/18_create_store_orders.sql'
      );

      const sql = fs.readFileSync(migrationPath, 'utf8');

      await client.query(sql);

      console.log('✅ Migration applied successfully!');

      // Verify tables exist
      const result = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('orders', 'order_items')
        ORDER BY table_name;
      `);

      console.log('\n📊 Verified tables:');
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });

    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    } finally {
      await client.end();
    }
  });
}

// Check if pg is installed
try {
  require.resolve('pg');
  runMigration();
} catch (e) {
  console.log('❌ The "pg" package is not installed.');
  console.log('');
  console.log('To apply this migration, you have two options:');
  console.log('');
  console.log('1. Install pg and run this script:');
  console.log('   npm install pg');
  console.log('   node scripts/run-sql-migration.js');
  console.log('');
  console.log('2. Run the SQL manually in Supabase Dashboard:');
  console.log('   - Go to: https://supabase.com/dashboard');
  console.log('   - Navigate to: SQL Editor');
  console.log('   - Copy contents of: supabase/migrations/18_create_store_orders.sql');
  console.log('   - Paste and run');
  console.log('');
}
