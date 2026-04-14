/*
  # Create Site Settings System

  1. New Tables
    - `site_settings`
      - `id` (uuid, primary key)
      - `key` (text, unique) - Setting identifier (e.g., 'hero_image_1', 'delivery_price')
      - `value` (text) - Setting value
      - `type` (text) - Data type (text, number, image, json)
      - `description` (text) - Human-readable description
      - `updated_at` (timestamptz)
      - `updated_by` (uuid) - References auth.users

    - `featured_books`
      - `id` (uuid, primary key)
      - `book_id` (uuid) - References books table
      - `position` (integer) - Display order
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Public read access for site_settings and featured_books
    - Only admins can modify these tables

  3. Initial Data
    - Default hero settings
    - Default delivery price
*/

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create featured_books table
CREATE TABLE IF NOT EXISTS featured_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(book_id)
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_books ENABLE ROW LEVEL SECURITY;

-- Site settings policies
CREATE POLICY "Anyone can view site settings"
  ON site_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can insert site settings"
  ON site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update site settings"
  ON site_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete site settings"
  ON site_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Featured books policies
CREATE POLICY "Anyone can view featured books"
  ON featured_books
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can insert featured books"
  ON featured_books
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update featured books"
  ON featured_books
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete featured books"
  ON featured_books
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default settings
INSERT INTO site_settings (key, value, type, description) VALUES
  ('hero_title', 'Discover Your Next Great Read', 'text', 'Main hero section title'),
  ('hero_subtitle', 'Explore our curated collection of books across all genres', 'text', 'Hero section subtitle'),
  ('hero_image_1', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570', 'image', 'First hero background image'),
  ('hero_image_2', 'https://images.unsplash.com/photo-1512820790803-83ca734da794', 'image', 'Second hero background image'),
  ('hero_image_3', 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f', 'image', 'Third hero background image'),
  ('delivery_price', '5.99', 'number', 'Standard delivery price in TND')
ON CONFLICT (key) DO NOTHING;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_featured_books_position ON featured_books(position);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);