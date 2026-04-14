/*
  # eBook Ecosystem Database Schema

  ## Overview
  Creates a complete digital library system for HKEYET bookstore with eBooks,
  reading progress, highlights, bookmarks, and user library management.

  ## New Tables

  ### `ebooks`
  Digital book files and metadata
  - `id` (uuid, primary key)
  - `book_id` (uuid, references books) - Links to physical book if exists
  - `title` (text) - eBook title
  - `author` (text) - Author name
  - `description` (text) - Book description
  - `cover_image_url` (text) - Cover image
  - `file_url` (text) - Secure URL to EPUB/PDF file
  - `format` (text) - EPUB or PDF
  - `file_size` (bigint) - File size in bytes
  - `page_count` (integer) - Total pages
  - `preview_pages` (integer) - Number of preview pages allowed
  - `isbn` (text) - ISBN number
  - `price` (numeric) - eBook price
  - `category_id` (uuid, references categories)
  - `drm_enabled` (boolean) - DRM protection
  - `download_enabled` (boolean) - Allow downloads
  - `published_date` (date) - Release date
  - `rating` (numeric) - Average rating
  - `views` (integer) - View count
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `user_library`
  User's purchased eBooks collection
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `ebook_id` (uuid, references ebooks)
  - `purchase_date` (timestamptz)
  - `last_opened` (timestamptz)
  - `reading_progress` (numeric) - Percentage (0-100)
  - `current_page` (integer)
  - `total_reading_time` (integer) - Minutes spent reading
  - `created_at` (timestamptz)

  ### `bookmarks`
  User bookmarks within eBooks
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `ebook_id` (uuid, references ebooks)
  - `page_number` (integer)
  - `cfi_location` (text) - EPUB CFI location
  - `note` (text) - Optional note
  - `created_at` (timestamptz)

  ### `highlights`
  User text highlights and notes
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `ebook_id` (uuid, references ebooks)
  - `highlighted_text` (text)
  - `cfi_range` (text) - EPUB CFI range
  - `color` (text) - Highlight color
  - `note` (text) - User note
  - `page_number` (integer)
  - `created_at` (timestamptz)

  ### `reading_sessions`
  Track reading time and statistics
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `ebook_id` (uuid, references ebooks)
  - `started_at` (timestamptz)
  - `ended_at` (timestamptz)
  - `duration_minutes` (integer)
  - `pages_read` (integer)

  ### `ebook_reviews`
  User reviews for eBooks
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `ebook_id` (uuid, references ebooks)
  - `rating` (integer) - 1-5 stars
  - `review_text` (text)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own library, bookmarks, highlights
  - eBooks catalog is public for browsing
  - Admin can manage all eBooks

  ## Indexes
  - Fast lookups for user library and reading progress
  - Efficient querying of highlights and bookmarks
*/

-- Create ebooks table
CREATE TABLE IF NOT EXISTS ebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE SET NULL,
  title text NOT NULL,
  author text NOT NULL,
  description text DEFAULT '',
  cover_image_url text,
  file_url text NOT NULL,
  format text NOT NULL CHECK (format IN ('EPUB', 'PDF')),
  file_size bigint DEFAULT 0,
  page_count integer DEFAULT 0,
  preview_pages integer DEFAULT 20,
  isbn text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  drm_enabled boolean DEFAULT true,
  download_enabled boolean DEFAULT false,
  published_date date,
  rating numeric(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_library table
CREATE TABLE IF NOT EXISTS user_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ebook_id uuid NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  purchase_date timestamptz DEFAULT now(),
  last_opened timestamptz,
  reading_progress numeric(5,2) DEFAULT 0 CHECK (reading_progress >= 0 AND reading_progress <= 100),
  current_page integer DEFAULT 1,
  total_reading_time integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, ebook_id)
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ebook_id uuid NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  page_number integer DEFAULT 1,
  cfi_location text,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create highlights table
CREATE TABLE IF NOT EXISTS highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ebook_id uuid NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  highlighted_text text NOT NULL,
  cfi_range text,
  color text DEFAULT 'yellow',
  note text DEFAULT '',
  page_number integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Create reading_sessions table
CREATE TABLE IF NOT EXISTS reading_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ebook_id uuid NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_minutes integer DEFAULT 0,
  pages_read integer DEFAULT 0
);

-- Create ebook_reviews table
CREATE TABLE IF NOT EXISTS ebook_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ebook_id uuid NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, ebook_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ebooks_category ON ebooks(category_id);
CREATE INDEX IF NOT EXISTS idx_ebooks_rating ON ebooks(rating DESC);
CREATE INDEX IF NOT EXISTS idx_ebooks_created ON ebooks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_library_user ON user_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_ebook ON user_library(ebook_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_ebook ON bookmarks(user_id, ebook_id);
CREATE INDEX IF NOT EXISTS idx_highlights_user_ebook ON highlights(user_id, ebook_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user ON reading_sessions(user_id);

-- Enable Row Level Security
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebook_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ebooks (public read, admin write)
CREATE POLICY "Anyone can view ebooks"
  ON ebooks FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can insert ebooks"
  ON ebooks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update ebooks"
  ON ebooks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete ebooks"
  ON ebooks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- RLS Policies for user_library
CREATE POLICY "Users can view their own library"
  ON user_library FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their library"
  ON user_library FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their library"
  ON user_library FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their library"
  ON user_library FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks"
  ON bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks"
  ON bookmarks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for highlights
CREATE POLICY "Users can view their own highlights"
  ON highlights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own highlights"
  ON highlights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights"
  ON highlights FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights"
  ON highlights FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for reading_sessions
CREATE POLICY "Users can view their own reading sessions"
  ON reading_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reading sessions"
  ON reading_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading sessions"
  ON reading_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ebook_reviews
CREATE POLICY "Anyone can view ebook reviews"
  ON ebook_reviews FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create their own reviews"
  ON ebook_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON ebook_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON ebook_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update ebook rating
CREATE OR REPLACE FUNCTION update_ebook_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ebooks
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM ebook_reviews
    WHERE ebook_id = NEW.ebook_id
  )
  WHERE id = NEW.ebook_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update ebook ratings
DROP TRIGGER IF EXISTS trigger_update_ebook_rating ON ebook_reviews;
CREATE TRIGGER trigger_update_ebook_rating
  AFTER INSERT OR UPDATE OR DELETE ON ebook_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_ebook_rating();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ebooks updated_at
DROP TRIGGER IF EXISTS trigger_ebooks_updated_at ON ebooks;
CREATE TRIGGER trigger_ebooks_updated_at
  BEFORE UPDATE ON ebooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();