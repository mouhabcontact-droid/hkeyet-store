/*
  # Create eBooks Storage Bucket

  ## Overview
  Creates a dedicated storage bucket for eBook files (EPUB and PDF).

  ## Storage Bucket Created

  ### ebooks
  - Stores eBook files (EPUB and PDF formats)
  - Public access for reading (required for purchased ebooks)
  - Authenticated users can upload
  - Larger file size limit (100MB) to accommodate eBook files

  ## Security
  - RLS policies allow public read access
  - Only authenticated users can upload
  - Supports EPUB and PDF mime types
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('ebooks', 'ebooks', true, 104857600, ARRAY['application/epub+zip', 'application/pdf', 'application/octet-stream'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view ebooks"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'ebooks');

CREATE POLICY "Authenticated users can upload ebooks"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ebooks');

CREATE POLICY "Authenticated users can update ebooks"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ebooks');

CREATE POLICY "Authenticated users can delete ebooks"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ebooks');