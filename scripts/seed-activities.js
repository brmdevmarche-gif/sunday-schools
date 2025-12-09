const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedActivities() {
  console.log('🌱 Starting activities seeding...\n');

  try {
    // Get some churches and classes for scoping
    const { data: churches } = await supabase
      .from('churches')
      .select('id, name')
      .limit(3);

    const { data: classes } = await supabase
      .from('classes')
      .select('id, name, church_id')
      .limit(5);

    // Sample activities
    const activities = [
      {
        name: 'Bible Memory Verse Challenge',
        description: 'Memorize and recite 5 bible verses from the Gospel of John',
        points: 50,
        requires_participation_approval: false,
        requires_completion_approval: true,
        is_time_sensitive: false,
        status: 'active',
        diocese_id: null,
        church_id: null,
        class_id: null, // Available to all
      },
      {
        name: 'Church Service Attendance',
        description: 'Attend Sunday service and participate in worship',
        points: 20,
        requires_participation_approval: false,
        requires_completion_approval: true,
        is_time_sensitive: false,
        status: 'active',
        church_id: churches?.[0]?.id || null,
      },
      {
        name: 'Help Setup Church Event',
        description: 'Volunteer to help setup tables and chairs for church event',
        points: 30,
        requires_participation_approval: true,
        requires_completion_approval: true,
        is_time_sensitive: false,
        status: 'active',
        max_participants: 10,
        church_id: churches?.[0]?.id || null,
      },
      {
        name: 'Prayer Journal Week',
        description: 'Keep a daily prayer journal for one week and share your experience',
        points: 40,
        is_time_sensitive: true,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
        requires_participation_approval: false,
        requires_completion_approval: true,
        status: 'active',
      },
      {
        name: 'Visit Elderly Church Member',
        description: 'Visit an elderly church member and spend time with them',
        points: 60,
        requires_participation_approval: true,
        requires_completion_approval: true,
        is_time_sensitive: false,
        status: 'active',
        max_participants: 5,
        church_id: churches?.[1]?.id || null,
      },
      {
        name: 'Read Gospel of Matthew',
        description: 'Read the entire Gospel of Matthew and write a summary',
        points: 100,
        is_time_sensitive: true,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month from now
        full_points_window_start: new Date().toISOString(),
        full_points_window_end: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks for full points
        reduced_points_percentage: 80, // 80% points after window
        requires_participation_approval: false,
        requires_completion_approval: true,
        status: 'active',
      },
      {
        name: 'Sunday School Assistant',
        description: 'Help teacher with Sunday school class preparation and activities',
        points: 35,
        requires_participation_approval: true,
        requires_completion_approval: true,
        is_time_sensitive: false,
        status: 'active',
        max_participants: 3,
        class_id: classes?.[0]?.id || null,
      },
      {
        name: 'Charity Food Drive',
        description: 'Collect and donate food items for local charity',
        points: 80,
        is_time_sensitive: true,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        requires_participation_approval: true,
        requires_completion_approval: true,
        status: 'active',
        max_participants: 20,
        church_id: churches?.[2]?.id || null,
      },
      {
        name: 'Learn New Hymn',
        description: 'Learn and perform a new hymn during service',
        points: 45,
        requires_participation_approval: true,
        requires_completion_approval: true,
        is_time_sensitive: false,
        status: 'active',
        max_participants: 8,
        church_id: churches?.[0]?.id || null,
      },
      {
        name: 'Create Bible Art',
        description: 'Create an art piece inspired by a Bible story',
        points: 55,
        requires_participation_approval: false,
        requires_completion_approval: true,
        is_time_sensitive: false,
        status: 'active',
        class_id: classes?.[1]?.id || null,
      },
    ];

    console.log(`📝 Creating ${activities.length} activities...\n`);

    const { data: createdActivities, error } = await supabase
      .from('activities')
      .insert(activities)
      .select();

    if (error) {
      console.error('❌ Error creating activities:', error);
      throw error;
    }

    console.log(`✅ Successfully created ${createdActivities.length} activities\n`);

    // Display created activities
    console.log('Created Activities:');
    createdActivities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.name} (${activity.points} points)`);
      if (activity.church_id) console.log(`   - Church scoped`);
      if (activity.class_id) console.log(`   - Class scoped`);
      if (!activity.church_id && !activity.class_id && !activity.diocese_id) {
        console.log(`   - Available to all`);
      }
      if (activity.is_time_sensitive) console.log(`   - Time sensitive`);
      if (activity.max_participants) console.log(`   - Max participants: ${activity.max_participants}`);
    });

    console.log('\n✅ Activities seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding activities:', error);
    process.exit(1);
  }
}

seedActivities();
