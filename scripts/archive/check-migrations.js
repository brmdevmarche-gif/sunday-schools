const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wzfkvegqytcnjdkxowvx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6Zmt2ZWdxeXRjbmpka3hvd3Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMwNjA5MCwiZXhwIjoyMDY0ODgyMDkwfQ.Su95IqdtPXuaU79_kEep17rgEn3pz5Q7TSjMvWcyXG0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('Checking database setup...\n');

  // Check if users table exists and has the necessary columns
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (usersError) {
    console.log('❌ Users table check:', usersError.message);
    console.log('\n⚠️  The database migrations have NOT been run yet!');
    console.log('\nPlease run the migrations first:');
    console.log('1. Go to https://wzfkvegqytcnjdkxowvx.supabase.co');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the migration files in supabase/migrations/ folder in order');
    return;
  }

  console.log('✅ Users table exists');

  // Check for other tables
  const tables = ['dioceses', 'churches', 'classes', 'login_history'];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`❌ ${table} table: NOT FOUND`);
    } else {
      console.log(`✅ ${table} table: exists`);
    }
  }
}

checkDatabase();
