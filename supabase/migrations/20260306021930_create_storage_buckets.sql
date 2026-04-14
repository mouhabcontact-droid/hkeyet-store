/*
  # Create Storage Buckets for Book Covers and Author Photos
  
  ## Overview
  Sets up Supabase Storage buckets for uploading and storing images.
  
  ## Storage Buckets Created
  
  ### book-covers
  - Stores book cover images
  - Public access for reading
  - Authenticated users can upload
  
  ### author-photos
  - Stores author profile photos
  - Public access for reading
  - Authenticated users can upload
  
  ## Security
  - RLS policies allow public read access
  - Only authenticated users can upload
  - File size limits and type restrictions applied
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('book-covers', 'book-covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
  ('author-photos', 'author-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view book covers"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'book-covers');

CREATE POLICY "Authenticated users can upload book covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'book-covers');

CREATE POLICY "Authenticated users can update book covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'book-covers');

CREATE POLICY "Public can view author photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'author-photos');

CREATE POLICY "Authenticated users can upload author photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'author-photos');

CREATE POLICY "Authenticated users can update author photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'author-photos');