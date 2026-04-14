/*
  # Create Audiobook Storage Buckets

  1. Storage Buckets
    - `audiobook-covers` - For audiobook cover images
    - `audiobook-files` - For audio chapter files and samples
  
  2. Security Policies
    - Covers are publicly accessible for reading
    - Audio files require authentication and library ownership for access
    - Only admins can upload/update/delete files
*/

-- Create audiobook-covers storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audiobook-covers', 'audiobook-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Create audiobook-files storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('audiobook-files', 'audiobook-files', false)
ON CONFLICT (id) DO NOTHING;

-- Audiobook covers policies
CREATE POLICY "Public can view audiobook covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audiobook-covers');

CREATE POLICY "Admins can upload audiobook covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'audiobook-covers'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update audiobook covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'audiobook-covers'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'audiobook-covers'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete audiobook covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'audiobook-covers'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Audiobook files policies (protected audio files)
CREATE POLICY "Users can access audiobook files they own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'audiobook-files'
    AND (
      -- Sample files are accessible to all authenticated users
      (name LIKE '%/samples/%')
      OR
      -- Full chapter files require library ownership
      EXISTS (
        SELECT 1 FROM user_audiobook_library ual
        JOIN audiobook_chapters ac ON ual.audiobook_id = ac.audiobook_id
        WHERE ual.user_id = auth.uid()
        AND storage.objects.name LIKE '%' || ac.audiobook_id::text || '%'
      )
      OR
      -- Admins can access all files
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );

CREATE POLICY "Admins can upload audiobook files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'audiobook-files'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update audiobook files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'audiobook-files'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'audiobook-files'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete audiobook files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'audiobook-files'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );