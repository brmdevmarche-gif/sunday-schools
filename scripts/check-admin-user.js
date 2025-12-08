const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkAdminUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Checking admin@knasty.local user...\n');

  // Get user by email
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'admin@knasty.local');

  if (usersError) {
    console.error('Error fetching user:', usersError);
    return;
  }

  if (!users || users.length === 0) {
    console.log('❌ User admin@knasty.local not found in users table');

    // Check auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (!authError) {
      const adminAuthUser = authUsers.users.find(u => u.email === 'admin@knasty.local');
      if (adminAuthUser) {
        console.log('✅ User exists in auth.users but not in users table');
        console.log('Auth User ID:', adminAuthUser.id);
      } else {
        console.log('❌ User does not exist in auth.users either');
      }
    }
    return;
  }

  const user = users[0];
  console.log('✅ User found:');
  console.log('ID:', user.id);
  console.log('Email:', user.email);
  console.log('Full Name:', user.full_name);
  console.log('Role:', user.role);
  console.log('Is Active:', user.is_active);
  console.log('Diocese ID:', user.diocese_id);
  console.log('Church ID:', user.church_id);
  console.log('\nAccess Permissions:');
  console.log('- Can access admin panel:', ['super_admin', 'diocese_admin', 'church_admin', 'teacher'].includes(user.role));
  console.log('- Can access store:', ['super_admin', 'church_admin'].includes(user.role));
}

checkAdminUser().catch(console.error);
