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
  console.log('🔄 Applying migration 20_create_wishlist.sql...');

  const migrationPath = path.join(
    __dirname,
    '../supabase/migrations/20_create_wishlist.sql'
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
        if ((i + 1) % 5 === 0) {
          console.log(`  ✓ Processed ${i + 1}/${statements.length} statements`);
        }
      }
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        skipCount++;
      } else {
        console.log(`  ⚠️  Statement ${i + 1}: ${err.message}`);
        console.log('');
        console.log('📝 MANUAL INSTRUCTIONS:');
        console.log('1. Open your Supabase Dashboard');
        console.log('2. Go to SQL Editor');
        console.log('3. Click "New query"');
        console.log('4. Copy the contents of: supabase/migrations/20_create_wishlist.sql');
        console.log('5. Paste into SQL Editor');
        console.log('6. Click "Run"');
        console.log('');
        break;
      }
    }
  }

  console.log(`\n  ✓ Successfully executed: ${successCount} statements`);
  if (skipCount > 0) {
    console.log(`  ⊘ Skipped (already exists): ${skipCount} statements`);
  }

  // Verify table exists
  console.log('\n🔍 Verifying wishlist table...');

  const { data, error } = await supabase
    .from('wishlist')
    .select('id')
    .limit(0);

  if (error) {
    console.error(`❌ wishlist table: ${error.message}`);
    console.log('');
    console.log('📝 Please run the migration manually via Supabase SQL Editor.');
    console.log('File: supabase/migrations/20_create_wishlist.sql');
  } else {
    console.log(`✅ wishlist table: exists`);
    console.log('\n✅ Migration completed successfully!');
  }
}

applyMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  console.log('');
  console.log('📝 Please run the migration manually via Supabase SQL Editor.');
  console.log('File: supabase/migrations/20_create_wishlist.sql');
  process.exit(1);
});

