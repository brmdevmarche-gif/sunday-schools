const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wzfkvegqytcnjdkxowvx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6Zmt2ZWdxeXRjbmpka3hvd3Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMwNjA5MCwiZXhwIjoyMDY0ODgyMDkwfQ.Su95IqdtPXuaU79_kEep17rgEn3pz5Q7TSjMvWcyXG0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUser() {
  console.log('🔍 Debugging admin user...\n');

  // Check public.users table
  console.log('1. Checking public.users table...');
  const { data: publicUser, error: publicError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'admin@knasty.local')
    .single();

  if (publicError) {
    console.log('❌ Error querying public.users:', publicError.message);
  } else if (publicUser) {
    console.log('✅ Found in public.users:');
    console.log('   ID:', publicUser.id);
    console.log('   Email:', publicUser.email);
    console.log('   Username:', publicUser.username);
    console.log('   Role:', publicUser.role);
    console.log('   Active:', publicUser.is_active);
  } else {
    console.log('❌ User NOT found in public.users');
  }

  console.log('\n2. Attempting to login...');

  // Try to sign in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'admin@knasty.local',
    password: '123456789'
  });

  if (signInError) {
    console.log('❌ Login failed:', signInError.message);
    console.log('   Error code:', signInError.status);
  } else {
    console.log('✅ Login successful!');
    console.log('   User ID:', signInData.user.id);
    console.log('   Email:', signInData.user.email);
  }

  console.log('\n3. Trying to create user with auth API...');

  // Try to create with admin API
  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email: 'admin@knasty.local',
    password: '123456789',
    email_confirm: true
  });

  if (createError) {
    if (createError.message.includes('already registered')) {
      console.log('✅ User already exists in auth.users');
    } else {
      console.log('❌ Error creating user:', createError.message);
    }
  } else {
    console.log('✅ User created successfully!');
    console.log('   User ID:', createData.user.id);
  }
}

debugUser();
