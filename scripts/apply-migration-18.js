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
  console.log('🔄 Applying migration 18_create_store_orders.sql...');

  const migrationPath = path.join(
    __dirname,
    '../supabase/migrations/18_create_store_orders.sql'
  );

  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    // Execute the entire SQL file
    const { error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      // If RPC doesn't work, try using the raw SQL endpoint
      console.log('  Trying alternative method...');

      // Split into smaller statements for better error handling
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\s*$/));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';

        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', {
            sql_string: statement
          });

          if (stmtError && !stmtError.message.includes('already exists')) {
            console.log(`  ⚠️  Statement ${i + 1}: ${stmtError.message}`);
          } else {
            console.log(`  ✓ Statement ${i + 1} executed`);
          }
        } catch (err) {
          if (!err.message.includes('already exists')) {
            console.log(`  ⚠️  Statement ${i + 1}: ${err.message}`);
          }
        }
      }
    } else {
      console.log('  ✓ Migration applied successfully');
    }
  } catch (err) {
    console.error('  ⚠️  Error:', err.message);
  }

  // Verify tables exist
  console.log('\n🔍 Verifying tables...');

  const { data: ordersCheck, error: ordersError } = await supabase
    .from('orders')
    .select('id')
    .limit(0);

  const { data: orderItemsCheck, error: orderItemsError } = await supabase
    .from('order_items')
    .select('id')
    .limit(0);

  if (!ordersError && !orderItemsError) {
    console.log('✅ Migration completed successfully!');
    console.log('   - orders table: exists');
    console.log('   - order_items table: exists');
  } else {
    if (ordersError) console.error('❌ orders table:', ordersError.message);
    if (orderItemsError) console.error('❌ order_items table:', orderItemsError.message);
  }
}

applyMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
