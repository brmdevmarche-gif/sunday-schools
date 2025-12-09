const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
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
  console.log('🔄 Applying migration 17_ensure_user_avatar_phone.sql...');

  const migrationPath = path.join(
    __dirname,
    '../supabase/migrations/17_ensure_user_avatar_phone.sql'
  );

  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split by semicolons but be smart about it
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;

    try {
      console.log(`  Executing statement ${i + 1}/${statements.length}...`);
      const { error } = await supabase.rpc('exec_sql', { sql_string: statement });

      if (error) {
        // Try direct query if RPC doesn't work
        const { error: directError } = await supabase.from('_').select(statement);
        if (directError) {
          console.error(`  ⚠️  Warning:`, directError.message);
        }
      }
    } catch (err) {
      console.error(`  ⚠️  Error executing statement:`, err.message);
    }
  }

  // Verify columns exist
  console.log('\n🔍 Verifying columns...');
  const { data, error } = await supabase
    .from('users')
    .select('avatar_url, phone')
    .limit(1);

  if (error) {
    console.error('❌ Error verifying columns:', error.message);
    process.exit(1);
  }

  console.log('✅ Columns verified successfully!');
  console.log('   - avatar_url: exists');
  console.log('   - phone: exists');
}

applyMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
