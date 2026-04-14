/*
  # Create Manuscripts Submission System

  1. New Tables
    - `manuscripts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `title` (text, manuscript title)
      - `description` (text, manuscript description)
      - `file_url` (text, storage path to manuscript file)
      - `file_name` (text, original file name)
      - `file_size` (integer, file size in bytes)
      - `status` (text, one of: not_reviewed, reviewing, accepted, rejected)
      - `admin_notes` (text, optional notes from admin)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on manuscripts table
    - Users can view their own manuscripts
    - Users can insert one manuscript if they don't have a pending one
    - Admins can view, update, and manage all manuscripts
    - Public cannot access manuscripts

  3. Indexes
    - Index on user_id for faster lookups
    - Index on status for admin filtering
*/

-- Create manuscripts table
CREATE TABLE IF NOT EXISTS public.manuscripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  status text NOT NULL DEFAULT 'not_reviewed' CHECK (status IN ('not_reviewed', 'reviewing', 'accepted', 'rejected')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_manuscripts_user_id ON public.manuscripts(user_id);
CREATE INDEX IF NOT EXISTS idx_manuscripts_status ON public.manuscripts(status);

-- Enable RLS
ALTER TABLE public.manuscripts ENABLE ROW LEVEL SECURITY;

-- Users can view their own manuscripts
CREATE POLICY "Users can view own manuscripts"
  ON public.manuscripts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert a manuscript only if they don't have a pending one
CREATE POLICY "Users can insert manuscript if no pending"
  ON public.manuscripts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.manuscripts
      WHERE user_id = auth.uid()
      AND status IN ('not_reviewed', 'reviewing')
    )
  );

-- Admins can view all manuscripts
CREATE POLICY "Admins can view all manuscripts"
  ON public.manuscripts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update manuscripts
CREATE POLICY "Admins can update manuscripts"
  ON public.manuscripts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete manuscripts
CREATE POLICY "Admins can delete manuscripts"
  ON public.manuscripts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_manuscripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manuscripts_updated_at
  BEFORE UPDATE ON public.manuscripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_manuscripts_updated_at();