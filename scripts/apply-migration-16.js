const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/16_enhance_store_items.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('Migration file not found:', migrationPath);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('Applying enhanced store items migration...');
  console.log('Migration file:', migrationPath);

  // Split SQL into individual statements and execute them
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Some errors are acceptable (like "already exists")
        if (error.message.includes('already exists') || error.message.includes('SQLSTATE 42P07')) {
          console.log(`⚠️  Skipping (already exists): ${error.message.substring(0, 100)}`);
        } else {
          console.error('❌ Statement failed:', error);
          console.error('Statement was:', statement.substring(0, 200));
          // Continue with next statement instead of exiting
        }
      } else {
        console.log('✅ Success');
      }
    } catch (err) {
      console.error('❌ Error executing statement:', err.message);
      console.error('Statement was:', statement.substring(0, 200));
    }
  }

  console.log('\n✅ Migration process completed!');
}

applyMigration().catch(console.error);
