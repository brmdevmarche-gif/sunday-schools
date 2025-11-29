const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wzfkvegqytcnjdkxowvx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6Zmt2ZWdxeXRjbmpka3hvd3Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMwNjA5MCwiZXhwIjoyMDY0ODgyMDkwfQ.Su95IqdtPXuaU79_kEep17rgEn3pz5Q7TSjMvWcyXG0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEverything() {
  console.log('🔍 COMPLETE DATABASE CHECK\n');
  console.log('═══════════════════════════════════════\n');

  // Check 1: All users in public.users
  console.log('1️⃣ ALL USERS IN public.users:');
  const { data: allPublicUsers, error: publicError } = await supabase
    .from('users')
    .select('id, email, username, role, is_active, created_at');

  if (publicError) {
    console.log('❌ Error:', publicError.message);
  } else {
    console.log(`Found ${allPublicUsers.length} users:`);
    allPublicUsers.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email || 'NO EMAIL'} - Role: ${u.role || 'none'} - Active: ${u.is_active}`);
    });
  }

  // Check 2: All users in auth.users
  console.log('\n2️⃣ ALL USERS IN auth.users:');
  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.log('❌ Error:', authError.message);
  } else {
    console.log(`Found ${authUsers.length} users:`);
    authUsers.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} - Confirmed: ${u.email_confirmed_at ? 'YES' : 'NO'}`);
    });
  }

  // Check 3: Look for admin email specifically
  console.log('\n3️⃣ SEARCHING FOR admin@knasty.local:');

  const { data: publicAdmin, error: publicAdminError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'admin@knasty.local');

  if (publicAdminError) {
    console.log('❌ Error in public.users:', publicAdminError.message);
  } else {
    console.log(`Found ${publicAdmin.length} record(s) in public.users`);
    if (publicAdmin.length > 0) {
      publicAdmin.forEach((u, i) => {
        console.log(`   Record ${i + 1}:`, JSON.stringify(u, null, 2));
      });
    }
  }

  const authAdmin = authUsers?.find(u => u.email === 'admin@knasty.local');
  if (authAdmin) {
    console.log('✅ Found in auth.users:');
    console.log('   ID:', authAdmin.id);
    console.log('   Email confirmed:', authAdmin.email_confirmed_at ? 'YES' : 'NO');
    console.log('   Created:', authAdmin.created_at);
  } else {
    console.log('❌ NOT found in auth.users');
  }

  // Check 4: Test creating a simple user
  console.log('\n4️⃣ TESTING USER CREATION:');
  const testEmail = 'test-' + Date.now() + '@test.local';
  console.log(`Attempting to create: ${testEmail}`);

  const { data: testUser, error: testError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'test123456',
    email_confirm: true
  });

  if (testError) {
    console.log('❌ User creation failed:', testError.message);
    console.log('   This confirms the trigger issue');
  } else {
    console.log('✅ User created successfully!');
    console.log('   ID:', testUser.user.id);

    // Check if profile was created
    await new Promise(r => setTimeout(r, 1000));
    const { data: testProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUser.user.id)
      .single();

    if (testProfile) {
      console.log('✅ Profile auto-created by trigger');
    } else {
      console.log('❌ Profile NOT auto-created (trigger not working)');
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('📋 DIAGNOSIS:');
  console.log('═══════════════════════════════════════');
}

checkEverything();
