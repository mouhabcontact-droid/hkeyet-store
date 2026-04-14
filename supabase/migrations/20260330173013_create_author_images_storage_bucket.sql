/*
  # Create Author Images Storage Bucket

  1. Storage
    - Creates `author-images` bucket for storing author photos
    - Public bucket for easy access to author images
  
  2. Security
    - Admins can upload, update, and delete author images
    - Public read access for displaying author photos on the website
    - Authenticated users can read author images
*/

-- Create the author-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('author-images', 'author-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public can view author images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can view author images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can upload author images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can update author images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can delete author images" ON storage.objects;
END $$;

-- Allow public read access to author images
CREATE POLICY "Public can view author images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'author-images');

-- Allow authenticated users to view author images
CREATE POLICY "Authenticated users can view author images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'author-images');

-- Allow admins to upload author images
CREATE POLICY "Admins can upload author images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'author-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Allow admins to update author images
CREATE POLICY "Admins can update author images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'author-images'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Allow admins to delete author images
CREATE POLICY "Admins can delete author images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'author-images'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);
