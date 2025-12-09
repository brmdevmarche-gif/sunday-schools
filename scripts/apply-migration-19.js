const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  console.log('🔄 Applying migration 19_create_activities_system.sql...');

  const migrationPath = path.join(
    __dirname,
    '../supabase/migrations/19_create_activities_system.sql'
  );

  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.match(/^\s*--/) && !s.match(/^\s*$/));

  console.log(`  Found ${statements.length} SQL statements`);

  let successCount = 0;
  let skipCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    try {
      // Use direct query for DDL statements
      const { error } = await supabase.rpc('exec_sql', {
        sql_string: statement
      });

      if (error) {
        if (error.message.includes('already exists')) {
          skipCount++;
        } else {
          console.log(`  ⚠️  Statement ${i + 1}: ${error.message}`);
        }
      } else {
        successCount++;
        if ((i + 1) % 10 === 0) {
          console.log(`  ✓ Processed ${i + 1}/${statements.length} statements`);
        }
      }
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        skipCount++;
      } else {
        console.log(`  ⚠️  Statement ${i + 1}: ${err.message}`);
      }
    }
  }

  console.log(`\n  ✓ Successfully executed: ${successCount} statements`);
  if (skipCount > 0) {
    console.log(`  ⊘ Skipped (already exists): ${skipCount} statements`);
  }

  // Verify tables exist
  console.log('\n🔍 Verifying tables...');

  const tables = ['activities', 'activity_participants', 'activity_completions'];
  let allExist = true;

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .limit(0);

    if (error) {
      console.error(`❌ ${table} table: ${error.message}`);
      allExist = false;
    } else {
      console.log(`✅ ${table} table: exists`);
    }
  }

  if (allExist) {
    console.log('\n✅ Migration completed successfully!');
  } else {
    console.log('\n⚠️  Migration completed with warnings');
  }
}

applyMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
