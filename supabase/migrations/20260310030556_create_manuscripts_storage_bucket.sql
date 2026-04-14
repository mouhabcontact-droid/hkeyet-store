/*
  # Create Manuscripts Storage Bucket

  1. New Storage Bucket
    - `manuscripts` bucket for storing manuscript files
    - 20MB file size limit
    - Allowed file types: PDF, TXT, DOC, DOCX

  2. Security
    - Authenticated users can upload files
    - Users can only access their own files
    - Admins can access all files
*/

-- Create manuscripts storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'manuscripts',
  'manuscripts',
  false,
  20971520, -- 20MB in bytes
  ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- Allow authenticated users to upload manuscripts
CREATE POLICY "Users can upload own manuscripts"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'manuscripts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view their own manuscripts
CREATE POLICY "Users can view own manuscripts"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'manuscripts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can view all manuscripts
CREATE POLICY "Admins can view all manuscripts"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'manuscripts'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete manuscripts
CREATE POLICY "Admins can delete manuscripts"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'manuscripts'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );