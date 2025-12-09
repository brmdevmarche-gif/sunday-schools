const { createClient } = require('@supabase/supabase-js');
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

async function seedStoreItems() {
  console.log('🌱 Seeding store items...');

  const storeItems = [
    {
      name: 'Bible',
      description: 'Holy Bible - New International Version',
      image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      stock_quantity: 50,
      price_normal: 100,
      price_mastor: 75,
      price_botl: 50,
      is_active: true,
    },
    {
      name: 'Prayer Book',
      description: 'Orthodox Prayer Book',
      image_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
      stock_quantity: 30,
      price_normal: 50,
      price_mastor: 40,
      price_botl: 25,
      is_active: true,
    },
    {
      name: 'Cross Necklace',
      description: 'Silver cross necklace',
      image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
      stock_quantity: 20,
      price_normal: 150,
      price_mastor: 120,
      price_botl: 80,
      is_active: true,
    },
    {
      name: 'Icon Card',
      description: 'Religious icon card - Various saints',
      image_url: 'https://images.unsplash.com/photo-1513569771920-c9e1d31714af?w=400',
      stock_quantity: 100,
      price_normal: 25,
      price_mastor: 20,
      price_botl: 15,
      is_active: true,
    },
    {
      name: 'Rosary',
      description: 'Wooden rosary beads',
      image_url: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400',
      stock_quantity: 40,
      price_normal: 75,
      price_mastor: 60,
      price_botl: 40,
      is_active: true,
    },
    {
      name: 'Sunday School Notebook',
      description: 'Notebook for Sunday School lessons',
      image_url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400',
      stock_quantity: 80,
      price_normal: 30,
      price_mastor: 25,
      price_botl: 15,
      is_active: true,
    },
    {
      name: 'Coloring Book - Bible Stories',
      description: 'Bible stories coloring book for children',
      image_url: 'https://images.unsplash.com/photo-1513477967668-2aaf11838bd6?w=400',
      stock_quantity: 60,
      price_normal: 40,
      price_mastor: 30,
      price_botl: 20,
      is_active: true,
    },
    {
      name: 'Christian Music CD',
      description: 'Collection of Christian hymns and songs',
      image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
      stock_quantity: 25,
      price_normal: 80,
      price_mastor: 65,
      price_botl: 45,
      is_active: true,
    },
  ];

  const { data, error } = await supabase
    .from('store_items')
    .insert(storeItems)
    .select();

  if (error) {
    console.error('❌ Error seeding store items:', error.message);
    return [];
  }

  console.log(`✅ Created ${data.length} store items`);
  return data;
}

async function seedStudentClassAssignments() {
  console.log('🌱 Seeding student class assignments...');

  // Get all students
  const { data: students, error: studentsError } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('role', 'student');

  if (studentsError) {
    console.error('❌ Error fetching students:', studentsError.message);
    return;
  }

  if (!students || students.length === 0) {
    console.log('⚠️  No students found. Please create some students first.');
    return;
  }

  // Get all classes
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, name');

  if (classesError) {
    console.error('❌ Error fetching classes:', classesError.message);
    return;
  }

  if (!classes || classes.length === 0) {
    console.log('⚠️  No classes found. Please create some classes first.');
    return;
  }

  // Assign each student to a random class
  const assignments = students.map((student) => {
    const randomClass = classes[Math.floor(Math.random() * classes.length)];
    return {
      class_id: randomClass.id,
      user_id: student.id,
      assignment_type: 'student',
      is_active: true,
    };
  });

  const { data, error } = await supabase
    .from('class_assignments')
    .insert(assignments)
    .select();

  if (error) {
    console.error('❌ Error seeding class assignments:', error.message);
    return;
  }

  console.log(`✅ Created ${data.length} student class assignments`);
}

async function seedOrders() {
  console.log('🌱 Seeding sample orders...');

  // Get all students with their class assignments
  const { data: students, error: studentsError } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      class_assignments (
        class_id
      )
    `)
    .eq('role', 'student')
    .limit(10);

  if (studentsError || !students || students.length === 0) {
    console.error('❌ No students found for orders');
    return;
  }

  // Get store items
  const { data: items, error: itemsError } = await supabase
    .from('store_items')
    .select('*')
    .eq('is_active', true);

  if (itemsError || !items || items.length === 0) {
    console.error('❌ No store items found');
    return;
  }

  const orderStatuses = ['pending', 'approved', 'fulfilled', 'cancelled', 'rejected'];
  const priceTiers = ['normal', 'mastor', 'botl'];

  // Create 15 sample orders
  for (let i = 0; i < 15; i++) {
    const student = students[Math.floor(Math.random() * students.length)];
    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    const classId = student.class_assignments?.[0]?.class_id || null;

    // Pick 1-4 random items
    const numItems = Math.floor(Math.random() * 4) + 1;
    const orderItems = [];
    let totalPoints = 0;

    for (let j = 0; j < numItems; j++) {
      const item = items[Math.floor(Math.random() * items.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const priceTier = priceTiers[Math.floor(Math.random() * priceTiers.length)];

      let unitPrice;
      switch (priceTier) {
        case 'mastor':
          unitPrice = item.price_mastor;
          break;
        case 'botl':
          unitPrice = item.price_botl;
          break;
        default:
          unitPrice = item.price_normal;
      }

      const totalPrice = unitPrice * quantity;
      totalPoints += totalPrice;

      orderItems.push({
        store_item_id: item.id,
        item_name: item.name,
        item_description: item.description,
        item_image_url: item.image_url,
        quantity,
        price_tier: priceTier,
        unit_price: unitPrice,
        total_price: totalPrice,
      });
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: student.id,
        class_id: classId,
        status,
        total_points: totalPoints,
        notes: i % 3 === 0 ? 'Please deliver to the classroom' : null,
        admin_notes: status !== 'pending' ? 'Processed successfully' : null,
      })
      .select()
      .single();

    if (orderError) {
      console.error(`❌ Error creating order ${i + 1}:`, orderError.message);
      continue;
    }

    // Add order items
    const orderItemsWithOrderId = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsInsertError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsInsertError) {
      console.error(`❌ Error adding items to order ${i + 1}:`, itemsInsertError.message);
      continue;
    }

    console.log(`✅ Created order ${i + 1} with ${orderItems.length} items (${status})`);
  }
}

async function main() {
  console.log('🚀 Starting database seeding...\n');

  await seedStoreItems();
  console.log('');

  await seedStudentClassAssignments();
  console.log('');

  await seedOrders();
  console.log('');

  console.log('✅ Seeding complete!');
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
