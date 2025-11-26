-- Row Level Security (RLS) Policies for Sunday School Management System
-- This script sets up appropriate RLS policies for Supabase

-- Enable RLS on all public schema tables
ALTER TABLE diocese ENABLE ROW LEVEL SECURITY;
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE servants ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE servant_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_activity_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE servant_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Store system tables
ALTER TABLE store_items_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_item_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_order_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_order_state_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to reference data
CREATE POLICY "Public read access for diocese" ON diocese FOR SELECT USING (true);
CREATE POLICY "Public read access for churches" ON churches FOR SELECT USING (true);
CREATE POLICY "Public read access for areas" ON areas FOR SELECT USING (true);
CREATE POLICY "Public read access for area_churches" ON area_churches FOR SELECT USING (true);

-- Create policies for authenticated users
-- Diocese policies
CREATE POLICY "Authenticated users can insert diocese" ON diocese FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update diocese" ON diocese FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Churches policies
CREATE POLICY "Authenticated users can insert churches" ON churches FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update churches" ON churches FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Servants policies
CREATE POLICY "Public read access for servants" ON servants FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert servants" ON servants FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update servants" ON servants FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Students policies (more restrictive - only church members can access)
CREATE POLICY "Church members can read students" ON students FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM servants 
    WHERE servants.church_id = students.church_id 
    AND servants.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can insert students" ON students FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM servants 
    WHERE servants.church_id = students.church_id 
    AND servants.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can update students" ON students FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM servants 
    WHERE servants.church_id = students.church_id 
    AND servants.email = auth.jwt() ->> 'email'
  )
);

-- Class groups policies
CREATE POLICY "Church members can read class_groups" ON class_groups FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM servants 
    WHERE servants.church_id = class_groups.church_id 
    AND servants.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can insert class_groups" ON class_groups FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM servants 
    WHERE servants.church_id = class_groups.church_id 
    AND servants.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can update class_groups" ON class_groups FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM servants 
    WHERE servants.church_id = class_groups.church_id 
    AND servants.email = auth.jwt() ->> 'email'
  )
);

-- Student class assignments policies
CREATE POLICY "Church members can read student_class_assignments" ON student_class_assignments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE s.id = student_class_assignments.student_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can insert student_class_assignments" ON student_class_assignments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM students s
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE s.id = student_class_assignments.student_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can update student_class_assignments" ON student_class_assignments FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE s.id = student_class_assignments.student_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

-- Servant class assignments policies
CREATE POLICY "Church members can read servant_class_assignments" ON servant_class_assignments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM servants s
    WHERE s.id = servant_class_assignments.servant_id 
    AND s.email = auth.jwt() ->> 'email'
  ) OR
  EXISTS (
    SELECT 1 FROM servants s1
    JOIN class_groups cg ON cg.church_id = s1.church_id
    WHERE cg.id = servant_class_assignments.class_group_id 
    AND s1.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can insert servant_class_assignments" ON servant_class_assignments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM servants s1
    JOIN class_groups cg ON cg.church_id = s1.church_id
    WHERE cg.id = servant_class_assignments.class_group_id 
    AND s1.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can update servant_class_assignments" ON servant_class_assignments FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM servants s1
    JOIN class_groups cg ON cg.church_id = s1.church_id
    WHERE cg.id = servant_class_assignments.class_group_id 
    AND s1.email = auth.jwt() ->> 'email'
  )
);

-- Church activities policies
CREATE POLICY "Public read access for church_activities" ON church_activities FOR SELECT USING (true);

CREATE POLICY "Church members can insert church_activities" ON church_activities FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM servants 
    WHERE servants.church_id = church_activities.church_id 
    AND servants.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can update church_activities" ON church_activities FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM servants 
    WHERE servants.church_id = church_activities.church_id 
    AND servants.email = auth.jwt() ->> 'email'
  )
);

-- Student activity participation policies
CREATE POLICY "Church members can read student_activity_participation" ON student_activity_participation FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE s.id = student_activity_participation.student_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can insert student_activity_participation" ON student_activity_participation FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM students s
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE s.id = student_activity_participation.student_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can update student_activity_participation" ON student_activity_participation FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE s.id = student_activity_participation.student_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

-- Attendance policies
CREATE POLICY "Church members can read student_attendance" ON student_attendance FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE s.id = student_attendance.student_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can insert student_attendance" ON student_attendance FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM students s
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE s.id = student_attendance.student_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can update student_attendance" ON student_attendance FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE s.id = student_attendance.student_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

-- Servant attendance policies
CREATE POLICY "Servants can read their own attendance" ON servant_attendance FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM servants 
    WHERE servants.id = servant_attendance.servant_id 
    AND servants.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can insert servant_attendance" ON servant_attendance FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM servants s1
    JOIN servants s2 ON s1.church_id = s2.church_id
    WHERE s2.id = servant_attendance.servant_id 
    AND s1.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can update servant_attendance" ON servant_attendance FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM servants s1
    JOIN servants s2 ON s1.church_id = s2.church_id
    WHERE s2.id = servant_attendance.servant_id 
    AND s1.email = auth.jwt() ->> 'email'
  )
);

-- Offers policies
CREATE POLICY "Church members can read offers" ON offers FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM servants 
    WHERE servants.church_id = offers.church_id 
    AND servants.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can insert offers" ON offers FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM servants 
    WHERE servants.church_id = offers.church_id 
    AND servants.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can update offers" ON offers FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM servants 
    WHERE servants.church_id = offers.church_id 
    AND servants.email = auth.jwt() ->> 'email'
  )
);

-- Lessons policies
CREATE POLICY "Church members can read lessons" ON lessons FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM servants 
    WHERE servants.church_id = lessons.church_id 
    AND servants.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can insert lessons" ON lessons FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM servants 
    WHERE servants.church_id = lessons.church_id 
    AND servants.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can update lessons" ON lessons FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM servants 
    WHERE servants.church_id = lessons.church_id 
    AND servants.email = auth.jwt() ->> 'email'
  )
);

-- Class sessions policies
CREATE POLICY "Church members can read class_sessions" ON class_sessions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM class_groups cg
    JOIN servants srv ON srv.church_id = cg.church_id
    WHERE cg.id = class_sessions.class_group_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can insert class_sessions" ON class_sessions FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM class_groups cg
    JOIN servants srv ON srv.church_id = cg.church_id
    WHERE cg.id = class_sessions.class_group_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can update class_sessions" ON class_sessions FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM class_groups cg
    JOIN servants srv ON srv.church_id = cg.church_id
    WHERE cg.id = class_sessions.class_group_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

-- Store system policies
-- Store items catalog - public read
CREATE POLICY "Public read access for store_items_catalog" ON store_items_catalog FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert store_items_catalog" ON store_items_catalog FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update store_items_catalog" ON store_items_catalog FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Stores policies
CREATE POLICY "Church members can read stores" ON stores FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM servants 
    WHERE servants.church_id = stores.church_id 
    AND servants.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can insert stores" ON stores FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM servants 
    WHERE servants.church_id = stores.church_id 
    AND servants.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can update stores" ON stores FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM servants 
    WHERE servants.church_id = stores.church_id 
    AND servants.email = auth.jwt() ->> 'email'
  )
);

-- Store item stock policies
CREATE POLICY "Store managers can read store_item_stock" ON store_item_stock FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM stores s
    JOIN servants srv ON srv.id = s.manager_id
    WHERE s.id = store_item_stock.store_id 
    AND srv.email = auth.jwt() ->> 'email'
  ) OR
  EXISTS (
    SELECT 1 FROM stores s
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE s.id = store_item_stock.store_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Store managers can insert store_item_stock" ON store_item_stock FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores s
    JOIN servants srv ON srv.id = s.manager_id
    WHERE s.id = store_item_stock.store_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Store managers can update store_item_stock" ON store_item_stock FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM stores s
    JOIN servants srv ON srv.id = s.manager_id
    WHERE s.id = store_item_stock.store_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

-- Store class assignments policies
CREATE POLICY "Church members can read store_class_assignments" ON store_class_assignments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM stores s
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE s.id = store_class_assignments.store_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can insert store_class_assignments" ON store_class_assignments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores s
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE s.id = store_class_assignments.store_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

-- Student wallets policies (very restrictive)
CREATE POLICY "Church members can read student_wallets" ON student_wallets FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE s.id = student_wallets.student_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can insert student_wallets" ON student_wallets FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM students s
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE s.id = student_wallets.student_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can update student_wallets" ON student_wallets FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE s.id = student_wallets.student_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

-- Store order requests policies
CREATE POLICY "Church members can read store_order_requests" ON store_order_requests FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE s.id = store_order_requests.student_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can insert store_order_requests" ON store_order_requests FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM students s
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE s.id = store_order_requests.student_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can update store_order_requests" ON store_order_requests FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE s.id = store_order_requests.student_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

-- Store order items policies
CREATE POLICY "Church members can read store_order_items" ON store_order_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM store_order_requests sor
    JOIN students s ON s.id = sor.student_id
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE sor.id = store_order_items.order_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can insert store_order_items" ON store_order_items FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM store_order_requests sor
    JOIN students s ON s.id = sor.student_id
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE sor.id = store_order_items.order_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

-- Store order state history policies
CREATE POLICY "Church members can read store_order_state_history" ON store_order_state_history FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM store_order_requests sor
    JOIN students s ON s.id = sor.student_id
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE sor.id = store_order_state_history.order_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Church members can insert store_order_state_history" ON store_order_state_history FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM store_order_requests sor
    JOIN students s ON s.id = sor.student_id
    JOIN servants srv ON srv.church_id = s.church_id
    WHERE sor.id = store_order_state_history.order_id 
    AND srv.email = auth.jwt() ->> 'email'
  )
);

-- Application user policies
CREATE POLICY "Users can read their own profile" ON users FOR SELECT 
USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can update their own profile" ON users FOR UPDATE 
USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Authenticated users can insert their profile" ON users FOR INSERT 
WITH CHECK (auth.jwt() ->> 'email' = email);

-- Posts policies
CREATE POLICY "Public read access for published posts" ON posts FOR SELECT 
USING (status = 'published');

CREATE POLICY "Authors can read their own posts" ON posts FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = posts.author_id 
    AND users.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Authors can insert their own posts" ON posts FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = posts.author_id 
    AND users.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Authors can update their own posts" ON posts FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = posts.author_id 
    AND users.email = auth.jwt() ->> 'email'
  )
);

-- Comments policies
CREATE POLICY "Public read access for public comments" ON comments FOR SELECT 
USING (is_public = true);

CREATE POLICY "Authors can read their own comments" ON comments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = comments.author_id 
    AND users.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Authors can insert their own comments" ON comments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = comments.author_id 
    AND users.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Authors can update their own comments" ON comments FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = comments.author_id 
    AND users.email = auth.jwt() ->> 'email'
  )
);