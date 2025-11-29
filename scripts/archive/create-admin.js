// Script to create admin user
const { createClient } = require('@supabase/supabase-js');

// Read values directly from .env.local
const supabaseUrl = 'https://wzfkvegqytcnjdkxowvx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6Zmt2ZWdxeXRjbmpka3hvd3Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMwNjA5MCwiZXhwIjoyMDY0ODgyMDkwfQ.Su95IqdtPXuaU79_kEep17rgEn3pz5Q7TSjMvWcyXG0';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  console.log('Creating admin user...\n');

  try {
    // First check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', 'admin@knasty.local')
      .single();

    if (existingUser) {
      console.log('⚠️  User already exists!');
      console.log('Updating existing user to super_admin...\n');

      const { error: updateError } = await supabase
        .from('users')
        .update({
          role: 'super_admin',
          username: 'admin',
          full_name: 'System Administrator',
          is_active: true
        })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('❌ Error updating user:', updateError.message);
        return;
      }

      console.log('✅ User updated to super_admin!\n');
      console.log('═══════════════════════════════════════');
      console.log('📋 ADMIN USER CREDENTIALS:');
      console.log('═══════════════════════════════════════');
      console.log('Email:    admin@knasty.local');
      console.log('Password: 123456789');
      console.log('Username: admin');
      console.log('Role:     super_admin');
      console.log('═══════════════════════════════════════\n');
      console.log('✨ You can now login at http://localhost:3000/login');
      return;
    }

    // Create the user with Supabase Auth
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
      console.error('❌ Error creating auth user:', authError);
      console.error('Full error:', JSON.stringify(authError, null, 2));
      return;
    }

    console.log('✅ Auth user created successfully!');
    console.log('User ID:', authData.user.id);

    // Wait a moment for the trigger to fire
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if profile was auto-created
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profile) {
      console.log('✅ Profile auto-created by trigger');
    } else {
      console.log('⚠️  Profile not auto-created, creating manually...');

      // Manually insert profile
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: 'admin@knasty.local',
          username: 'admin',
          full_name: 'System Administrator',
          role: 'super_admin',
          is_active: true
        });

      if (insertError) {
        console.error('❌ Error inserting profile:', insertError.message);
        return;
      }
      console.log('✅ Profile created manually');
    }

    // Update the user profile to super_admin
    const { error: updateError } = await supabase
      .from('users')
      .update({
        role: 'super_admin',
        username: 'admin',
        full_name: 'System Administrator',
        is_active: true
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('❌ Error updating user profile:', updateError.message);
      return;
    }

    console.log('✅ User profile updated to super_admin!\n');
    console.log('═══════════════════════════════════════');
    console.log('📋 ADMIN USER CREDENTIALS:');
    console.log('═══════════════════════════════════════');
    console.log('Email:    admin@knasty.local');
    console.log('Password: 123456789');
    console.log('Username: admin');
    console.log('Role:     super_admin');
    console.log('═══════════════════════════════════════\n');
    console.log('✨ You can now login at http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createAdminUser();
