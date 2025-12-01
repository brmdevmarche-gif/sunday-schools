-- =====================================================
-- SETUP SUPABASE STORAGE FOR IMAGES
-- =====================================================
-- This script sets up storage buckets and policies
-- for uploading images (diocese logos/covers, church images)
-- =====================================================

-- Create 'images' storage bucket (if not exists)
-- Note: This needs to be done via Supabase Dashboard or API
-- Dashboard: Storage > Create a new bucket > name: 'images', public: true

-- Storage policies for the 'images' bucket
-- These allow authenticated users to upload and manage images

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  (auth.uid() IS NOT NULL)
);

-- Policy: Allow public read access to images
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Policy: Allow users to update their own uploads
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow admins to delete any image
CREATE POLICY "Admins can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  (
    get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin')
  )
);

-- =====================================================
-- MANUAL SETUP STEPS (Do in Supabase Dashboard)
-- =====================================================
--
-- 1. Go to Storage in your Supabase Dashboard
-- 2. Click "Create a new bucket"
-- 3. Bucket name: images
-- 4. Public bucket: YES (check the box)
-- 5. Click "Create bucket"
-- 6. Then run this SQL in the SQL Editor
--
-- =====================================================
