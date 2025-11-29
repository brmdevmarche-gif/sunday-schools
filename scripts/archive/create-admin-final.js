const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wzfkvegqytcnjdkxowvx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6Zmt2ZWdxeXRjbmpka3hvd3Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMwNjA5MCwiZXhwIjoyMDY0ODgyMDkwfQ.Su95IqdtPXuaU79_kEep17rgEn3pz5Q7TSjMvWcyXG0';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  console.log('🚀 Creating admin user...\n');

  try {
    // Step 1: Check if user exists in auth
    console.log('Step 1: Checking for existing user...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      return;
    }

    const existingAuthUser = users.find(u => u.email === 'admin@knasty.local');

    let userId;

    if (existingAuthUser) {
      console.log('⚠️  User exists in auth.users');
      console.log('   User ID:', existingAuthUser.id);
      userId = existingAuthUser.id;

      // Update password to make sure it's correct
      console.log('\nStep 2: Updating password...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: '123456789' }
      );

      if (updateError) {
        console.error('❌ Error updating password:', updateError.message);
      } else {
        console.log('✅ Password updated');
      }

    } else {
      console.log('✅ No existing user found');

      // Step 2: Create new auth user
      console.log('\nStep 2: Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'admin@knasty.local',
        password: '123456789',
        email_confirm: true,
        user_metadata: {
          username: 'admin',
          full_name: 'System Administrator'
        }
      });

      if (authError) {
        console.error('❌ Error creating auth user:', authError.message);
        console.error('   Code:', authError.code);
        console.error('   Status:', authError.status);

        // If it's a database error, the trigger might be failing
        if (authError.message.includes('Database error')) {
          console.log('\n⚠️  DATABASE ERROR DETECTED');
          console.log('This usually means:');
          console.log('1. The trigger on auth.users is failing');
          console.log('2. The public.users table has constraints that are blocking the insert');
          console.log('\nTry running this SQL in Supabase:');
          console.log('```sql');
          console.log('-- Disable the trigger temporarily');
          console.log('ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;');
          console.log('```');
          console.log('\nThen run this script again, and re-enable the trigger after.');
        }
        return;
      }

      console.log('✅ Auth user created!');
      console.log('   User ID:', authData.user.id);
      userId = authData.user.id;
    }

    // Step 3: Wait for trigger to fire
    console.log('\nStep 3: Waiting for auto-trigger...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Check/create profile in public.users
    console.log('\nStep 4: Checking profile in public.users...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Error checking profile:', profileError.message);
      return;
    }

    if (!profile) {
      console.log('⚠️  Profile not found, creating manually...');

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: 'admin@knasty.local',
          username: 'admin',
          full_name: 'System Administrator',
          role: 'super_admin',
          is_active: true
        });

      if (insertError) {
        console.error('❌ Error creating profile:', insertError.message);
        console.error('   Details:', insertError.details);
        console.error('   Hint:', insertError.hint);
        return;
      }
      console.log('✅ Profile created manually');
    } else {
      console.log('✅ Profile exists');
    }

    // Step 5: Update to super_admin
    console.log('\nStep 5: Setting role to super_admin...');
    const { error: updateError } = await supabase
      .from('users')
      .update({
        role: 'super_admin',
        username: 'admin',
        full_name: 'System Administrator',
        is_active: true
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error updating role:', updateError.message);
      return;
    }

    console.log('✅ Role updated to super_admin!');

    // Step 6: Verify
    console.log('\nStep 6: Verifying setup...');
    const { data: finalProfile } = await supabase
      .from('users')
      .select('id, email, username, role, is_active')
      .eq('id', userId)
      .single();

    console.log('✅ Verification complete:');
    console.log('   Email:', finalProfile.email);
    console.log('   Username:', finalProfile.username);
    console.log('   Role:', finalProfile.role);
    console.log('   Active:', finalProfile.is_active);

    // Step 7: Test login
    console.log('\nStep 7: Testing login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@knasty.local',
      password: '123456789'
    });

    if (signInError) {
      console.error('❌ Login test failed:', signInError.message);
      console.log('\n⚠️  The user was created but login is failing.');
      console.log('This might be a Supabase configuration issue.');
      console.log('Please check:');
      console.log('1. Go to Authentication → Settings in Supabase');
      console.log('2. Make sure "Enable email confirmations" is OFF for testing');
      console.log('3. Make sure "Enable email provider" is ON');
    } else {
      console.log('✅ Login test successful!');
    }

    console.log('\n═══════════════════════════════════════');
    console.log('✅ ADMIN USER SETUP COMPLETE!');
    console.log('═══════════════════════════════════════');
    console.log('Email:    admin@knasty.local');
    console.log('Password: 123456789');
    console.log('Username: admin');
    console.log('Role:     super_admin');
    console.log('═══════════════════════════════════════');
    console.log('\nLogin at: http://localhost:3000/login');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

createAdmin();
