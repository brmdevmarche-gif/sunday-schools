const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkForeignKeys() {
  // Try a simple query first
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error fetching orders:', error);
  } else {
    console.log('✅ Orders table accessible');
    console.log('Sample order:', orders?.[0]);
  }
  
  // Try joining with users
  const { data: ordersWithUsers, error: joinError } = await supabase
    .from('orders')
    .select('*, users(*)')
    .limit(1);
    
  if (joinError) {
    console.error('❌ Error joining with users:', joinError);
  } else {
    console.log('✅ Join with users works');
  }
  
  // Try with explicit foreign key
  const { data: ordersWithUsersFk, error: fkError } = await supabase
    .from('orders')
    .select('*, users!user_id(*)')
    .limit(1);
    
  if (fkError) {
    console.error('❌ Error with user_id foreign key:', fkError);
  } else {
    console.log('✅ user_id foreign key works');
  }
}

checkForeignKeys();
