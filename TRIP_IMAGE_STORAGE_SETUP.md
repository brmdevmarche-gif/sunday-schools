# Trip Image Storage Setup

This guide explains how to set up the database and storage for trip images with multiple upload methods.

## Overview

The trip image system supports **3 methods**:
1. **Upload** - Direct file upload to Supabase Storage
2. **URL** - Paste any public image URL
3. **Google Drive** - Use Google Drive file ID

All methods store the final URL in the `image_url` column in the `trips` table.

---

## Step 1: Apply Database Migration

Run the SQL migration to add the `image_url` column to trips table:

```sql
-- Add image_url column to trips table
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS trips_image_url_idx
ON public.trips(image_url)
WHERE image_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.trips.image_url IS 'URL of the trip image. Supports Supabase Storage URLs, external URLs, and Google Drive links';
```

**Where to run this:**
- Supabase Dashboard → SQL Editor
- OR via command line: `supabase db push` (if migrations are synced)

---

## Step 2: Set Up Storage Bucket (For Upload Method)

1. **Go to Supabase Dashboard**
   - Navigate to your project: https://supabase.com/dashboard
   - Click on "Storage" in the left sidebar

2. **Create New Bucket**
   - Click "New bucket"
   - Name: `trip-images`
   - Public bucket: ✅ **YES** (check this box)
   - Click "Create bucket"

3. **Configure Bucket Policies** (Optional - for security)

   You can add RLS policies to control who can upload:

   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Authenticated users can upload trip images"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'trip-images');

   -- Allow public read access
   CREATE POLICY "Public can view trip images"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'trip-images');

   -- Allow authenticated users to update their uploads
   CREATE POLICY "Users can update trip images"
   ON storage.objects FOR UPDATE
   TO authenticated
   USING (bucket_id = 'trip-images');

   -- Allow authenticated users to delete
   CREATE POLICY "Authenticated users can delete trip images"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'trip-images');
   ```

4. **Verify Setup**
   - Try uploading an image through the dashboard
   - Make sure you can access the public URL

---

## How Each Method Works

### Method 1: Upload 📤

**Database Storage:**
- File uploaded to Supabase Storage bucket: `trip-images`
- Stored in subfolder: `trips/`
- Filename format: `{random}-{timestamp}.{ext}`
- Public URL saved to `trips.image_url`

**Example stored URL:**
```
https://yourproject.supabase.co/storage/v1/object/public/trip-images/trips/abc123-1234567890.jpg
```

**Advantages:**
- ✅ Full control over images
- ✅ Fast CDN delivery
- ✅ No external dependencies
- ✅ Automatic file management

**Requirements:**
- Supabase Storage bucket must be created
- Bucket must be public (for viewing)

---

### Method 2: URL 🔗

**Database Storage:**
- URL pasted directly into form
- Saved as-is to `trips.image_url`
- No file upload needed

**Example stored URL:**
```
https://picsum.photos/800/600
https://example.com/my-trip-image.jpg
```

**Advantages:**
- ✅ Works immediately (no setup)
- ✅ Can use any image hosting service
- ✅ Good for existing images

**Requirements:**
- Image must be publicly accessible
- Direct image URL required (not a page containing an image)

**Recommended Services:**
- Imgur, Cloudinary, AWS S3, etc.
- picsum.photos (for placeholder images)

---

### Method 3: Google Drive 💾

**Database Storage:**
- Google Drive file ID or full link entered
- Converted to viewable URL format
- Saved to `trips.image_url` as:
  ```
  https://drive.google.com/uc?export=view&id={FILE_ID}
  ```

**Setup Process:**
1. Upload image to Google Drive
2. Right-click → "Share"
3. Change to "Anyone with the link can view"
4. Copy the file ID from URL or paste full link
5. Paste in trip form

**Examples:**
- Input: `1a2b3c4d5e6f7g8h9i0j` (just the ID)
- Input: `https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view` (full link)
- Stored: `https://drive.google.com/uc?export=view&id=1a2b3c4d5e6f7g8h9i0j`

**Advantages:**
- ✅ Easy to use
- ✅ Familiar for many users
- ✅ Free Google storage

**Important Notes:**
- ⚠️ **Must set sharing to "Anyone with link can view"**
- ⚠️ Image won't display if permissions aren't set correctly
- ⚠️ Google Drive has rate limits for public viewing

---

## Alternative: Disable Upload Method

If you don't want to set up Supabase Storage:

1. Users can still use URL and Google Drive methods
2. The `image_url` column works the same way
3. Simply don't create the storage bucket
4. Upload tab will show errors (or can be removed from code)

---

## Testing

After setup, test each method:

1. **Upload**: Upload a small image file, verify it appears in Storage
2. **URL**: Paste `https://picsum.photos/800/600`, verify preview shows
3. **Google Drive**: Use a shared Drive image ID, verify it displays

All methods should show live preview and save correctly to the database.
