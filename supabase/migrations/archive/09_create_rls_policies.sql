-- =====================================================
-- SUNDAY SCHOOL MANAGEMENT SYSTEM - RLS POLICIES
-- =====================================================

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is diocese admin for a specific diocese
CREATE OR REPLACE FUNCTION public.is_diocese_admin(diocese_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'diocese_admin'
    AND diocese_id = diocese_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is church admin for a specific church
CREATE OR REPLACE FUNCTION public.is_church_admin(church_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'church_admin'
    AND church_id = church_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is teacher for a specific class
CREATE OR REPLACE FUNCTION public.is_class_teacher(class_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.class_assignments
    WHERE user_id = auth.uid()
    AND class_id = class_uuid
    AND assignment_type = 'teacher'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is student in a specific class
CREATE OR REPLACE FUNCTION public.is_class_student(class_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.class_assignments
    WHERE user_id = auth.uid()
    AND class_id = class_uuid
    AND assignment_type = 'student'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is parent of a specific student
CREATE OR REPLACE FUNCTION public.is_parent_of(student_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_relationships
    WHERE parent_id = auth.uid() AND student_id = student_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DIOCESES POLICIES
-- =====================================================

CREATE POLICY "Super admins can do everything on dioceses"
ON public.dioceses FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Diocese admins can view their diocese"
ON public.dioceses FOR SELECT
TO authenticated
USING (is_diocese_admin(id) OR is_super_admin());

CREATE POLICY "Everyone can view dioceses"
ON public.dioceses FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- CHURCHES POLICIES
-- =====================================================

CREATE POLICY "Super admins can do everything on churches"
ON public.churches FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Diocese admins can manage churches in their diocese"
ON public.churches FOR ALL
TO authenticated
USING (is_diocese_admin(diocese_id) OR is_super_admin())
WITH CHECK (is_diocese_admin(diocese_id) OR is_super_admin());

CREATE POLICY "Church admins can view and update their church"
ON public.churches FOR SELECT
TO authenticated
USING (is_church_admin(id) OR is_diocese_admin(diocese_id) OR is_super_admin());

CREATE POLICY "Church admins can update their church"
ON public.churches FOR UPDATE
TO authenticated
USING (is_church_admin(id) OR is_diocese_admin(diocese_id) OR is_super_admin())
WITH CHECK (is_church_admin(id) OR is_diocese_admin(diocese_id) OR is_super_admin());

CREATE POLICY "Users can view churches in their organization"
ON public.churches FOR SELECT
TO authenticated
USING (
  church_id = id OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND diocese_id = churches.diocese_id)
);

-- =====================================================
-- CLASSES POLICIES
-- =====================================================

CREATE POLICY "Admins can manage classes"
ON public.classes FOR ALL
TO authenticated
USING (
  is_super_admin() OR
  is_diocese_admin((SELECT diocese_id FROM public.churches WHERE id = classes.church_id)) OR
  is_church_admin(church_id)
)
WITH CHECK (
  is_super_admin() OR
  is_diocese_admin((SELECT diocese_id FROM public.churches WHERE id = classes.church_id)) OR
  is_church_admin(church_id)
);

CREATE POLICY "Teachers can view and update their classes"
ON public.classes FOR SELECT
TO authenticated
USING (is_class_teacher(id) OR is_church_admin(church_id));

CREATE POLICY "Students can view their classes"
ON public.classes FOR SELECT
TO authenticated
USING (is_class_student(id));

-- =====================================================
-- CLASS ASSIGNMENTS POLICIES
-- =====================================================

CREATE POLICY "Admins can manage class assignments"
ON public.class_assignments FOR ALL
TO authenticated
USING (
  is_super_admin() OR
  is_church_admin((SELECT church_id FROM public.classes WHERE id = class_assignments.class_id))
)
WITH CHECK (
  is_super_admin() OR
  is_church_admin((SELECT church_id FROM public.classes WHERE id = class_assignments.class_id))
);

CREATE POLICY "Users can view their own assignments"
ON public.class_assignments FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_class_teacher(class_id));

-- =====================================================
-- LESSONS POLICIES
-- =====================================================

CREATE POLICY "Teachers can manage lessons for their classes"
ON public.lessons FOR ALL
TO authenticated
USING (is_class_teacher(class_id) OR is_church_admin((SELECT church_id FROM public.classes WHERE id = lessons.class_id)))
WITH CHECK (is_class_teacher(class_id) OR is_church_admin((SELECT church_id FROM public.classes WHERE id = lessons.class_id)));

CREATE POLICY "Students can view published lessons in their classes"
ON public.lessons FOR SELECT
TO authenticated
USING (is_class_student(class_id) AND is_published = true);

-- =====================================================
-- ACTIVITIES & TRIPS POLICIES
-- =====================================================

CREATE POLICY "Church admins can manage activities"
ON public.activities FOR ALL
TO authenticated
USING (is_church_admin(church_id) OR is_super_admin())
WITH CHECK (is_church_admin(church_id) OR is_super_admin());

CREATE POLICY "Users can view published activities in their church"
ON public.activities FOR SELECT
TO authenticated
USING (
  (SELECT church_id FROM public.users WHERE id = auth.uid()) = church_id
  AND is_published = true
);

CREATE POLICY "Church admins can manage trips"
ON public.trips FOR ALL
TO authenticated
USING (is_church_admin(church_id) OR is_super_admin())
WITH CHECK (is_church_admin(church_id) OR is_super_admin());

CREATE POLICY "Users can view published trips in their church"
ON public.trips FOR SELECT
TO authenticated
USING (
  (SELECT church_id FROM public.users WHERE id = auth.uid()) = church_id
  AND is_published = true
);

-- =====================================================
-- STORE ITEMS POLICIES
-- =====================================================

CREATE POLICY "Church admins can manage store items"
ON public.store_items FOR ALL
TO authenticated
USING (is_church_admin(church_id) OR is_super_admin())
WITH CHECK (is_church_admin(church_id) OR is_super_admin());

CREATE POLICY "Users can view available items in their church store"
ON public.store_items FOR SELECT
TO authenticated
USING (
  (SELECT church_id FROM public.users WHERE id = auth.uid()) = church_id
  AND is_available = true
);

-- =====================================================
-- REQUESTS POLICIES
-- =====================================================

CREATE POLICY "Students can create and view their own requests"
ON public.requests FOR SELECT
TO authenticated
USING (student_id = auth.uid() OR parent_id = auth.uid());

CREATE POLICY "Students can create requests"
ON public.requests FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Parents can view and respond to their students' requests"
ON public.requests FOR ALL
TO authenticated
USING (parent_id = auth.uid())
WITH CHECK (parent_id = auth.uid());

-- =====================================================
-- TASKS POLICIES
-- =====================================================

CREATE POLICY "Teachers can view and update their assigned tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Teachers can update their tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Church admins can manage tasks"
ON public.tasks FOR ALL
TO authenticated
USING (is_church_admin((SELECT church_id FROM public.classes WHERE id = tasks.class_id)) OR is_super_admin())
WITH CHECK (is_church_admin((SELECT church_id FROM public.classes WHERE id = tasks.class_id)) OR is_super_admin());

-- =====================================================
-- PARTICIPATION & ORDERS POLICIES
-- =====================================================

CREATE POLICY "Users can view and manage their own participation"
ON public.activity_participants FOR ALL
TO authenticated
USING (user_id = auth.uid() OR is_parent_of(user_id))
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view and manage their own trip participation"
ON public.trip_participants FOR ALL
TO authenticated
USING (user_id = auth.uid() OR is_parent_of(user_id))
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their own orders"
ON public.store_orders FOR ALL
TO authenticated
USING (user_id = auth.uid() OR is_parent_of(user_id))
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view order items for their orders"
ON public.store_order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.store_orders
    WHERE id = store_order_items.order_id AND user_id = auth.uid()
  )
);

-- =====================================================
-- ATTENDANCE POLICIES
-- =====================================================

CREATE POLICY "Teachers can manage attendance for their classes"
ON public.attendance FOR ALL
TO authenticated
USING (is_class_teacher(class_id))
WITH CHECK (is_class_teacher(class_id));

CREATE POLICY "Students can view their own attendance"
ON public.attendance FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_parent_of(user_id));

-- =====================================================
-- USER RELATIONSHIPS POLICIES
-- =====================================================

CREATE POLICY "Parents can view their relationships"
ON public.user_relationships FOR SELECT
TO authenticated
USING (parent_id = auth.uid() OR student_id = auth.uid());

CREATE POLICY "Admins can manage relationships"
ON public.user_relationships FOR ALL
TO authenticated
USING (is_super_admin() OR is_church_admin((SELECT church_id FROM public.users WHERE id = auth.uid())))
WITH CHECK (is_super_admin() OR is_church_admin((SELECT church_id FROM public.users WHERE id = auth.uid())));
