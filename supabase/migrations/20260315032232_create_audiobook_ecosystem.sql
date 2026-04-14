/*
  # Create Audiobook Ecosystem

  1. New Tables
    - `audiobooks`
      - Core audiobook metadata (title, slug, description, cover, author, narrator, duration, price, etc.)
      - SEO fields for search optimization
      - Publishing status and featured flags
      - Foreign key to categories
    
    - `audiobook_chapters`
      - Individual chapter information
      - Links to audiobook parent
      - Audio file URL, title, duration, order
    
    - `user_audiobook_library`
      - Tracks user audiobook ownership/access
      - Stores listening progress (current chapter, timestamp, percentage)
      - Last listened date and completion status
    
    - `listening_sessions`
      - Detailed listening history
      - Tracks individual listening sessions per user/audiobook/chapter
    
    - `audiobook_reviews`
      - User reviews and ratings for audiobooks
      - Links to users and audiobooks

  2. Security
    - Enable RLS on all audiobook tables
    - Public can read published audiobook metadata
    - Only authenticated users can access their library and progress
    - Only admins can create/edit/delete audiobooks
    - Reviews require authentication

  3. Performance
    - Indexes on frequently queried fields (slug, user_id, audiobook_id)
    - Optimized for library lookups and progress tracking
*/

-- Create audiobooks table
CREATE TABLE IF NOT EXISTS audiobooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  short_description text,
  cover_url text,
  author text NOT NULL,
  narrator text,
  duration_seconds integer DEFAULT 0,
  language text DEFAULT 'fr',
  isbn text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  is_featured boolean DEFAULT false,
  is_new_release boolean DEFAULT false,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  sample_audio_url text,
  seo_title text,
  seo_description text,
  seo_keywords text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audiobook chapters table
CREATE TABLE IF NOT EXISTS audiobook_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audiobook_id uuid NOT NULL REFERENCES audiobooks(id) ON DELETE CASCADE,
  title text NOT NULL,
  chapter_number integer NOT NULL,
  audio_url text NOT NULL,
  duration_seconds integer DEFAULT 0,
  display_order integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(audiobook_id, chapter_number),
  UNIQUE(audiobook_id, display_order)
);

-- Create user audiobook library table
CREATE TABLE IF NOT EXISTS user_audiobook_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audiobook_id uuid NOT NULL REFERENCES audiobooks(id) ON DELETE CASCADE,
  purchase_date timestamptz DEFAULT now(),
  last_listened_at timestamptz,
  progress_seconds integer DEFAULT 0,
  progress_percentage numeric(5,2) DEFAULT 0,
  current_chapter_id uuid REFERENCES audiobook_chapters(id) ON DELETE SET NULL,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, audiobook_id)
);

-- Create listening sessions table
CREATE TABLE IF NOT EXISTS listening_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audiobook_id uuid NOT NULL REFERENCES audiobooks(id) ON DELETE CASCADE,
  chapter_id uuid REFERENCES audiobook_chapters(id) ON DELETE SET NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  listened_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create audiobook reviews table
CREATE TABLE IF NOT EXISTS audiobook_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audiobook_id uuid NOT NULL REFERENCES audiobooks(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, audiobook_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audiobooks_slug ON audiobooks(slug);
CREATE INDEX IF NOT EXISTS idx_audiobooks_published ON audiobooks(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_audiobooks_featured ON audiobooks(is_featured, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_audiobooks_category ON audiobooks(category_id);

CREATE INDEX IF NOT EXISTS idx_audiobook_chapters_audiobook ON audiobook_chapters(audiobook_id, display_order);

CREATE INDEX IF NOT EXISTS idx_user_audiobook_library_user ON user_audiobook_library(user_id, last_listened_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_audiobook_library_audiobook ON user_audiobook_library(audiobook_id);

CREATE INDEX IF NOT EXISTS idx_listening_sessions_user ON listening_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_listening_sessions_audiobook ON listening_sessions(audiobook_id);

CREATE INDEX IF NOT EXISTS idx_audiobook_reviews_audiobook ON audiobook_reviews(audiobook_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE audiobooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audiobook_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_audiobook_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audiobook_reviews ENABLE ROW LEVEL SECURITY;

-- Audiobooks policies
CREATE POLICY "Public can view published audiobooks"
  ON audiobooks FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can insert audiobooks"
  ON audiobooks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update audiobooks"
  ON audiobooks FOR UPDATE
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

CREATE POLICY "Admins can delete audiobooks"
  ON audiobooks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Audiobook chapters policies
CREATE POLICY "Public can view chapters of published audiobooks"
  ON audiobook_chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM audiobooks
      WHERE audiobooks.id = audiobook_chapters.audiobook_id
      AND audiobooks.is_published = true
    )
  );

CREATE POLICY "Admins can manage audiobook chapters"
  ON audiobook_chapters FOR ALL
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

-- User audiobook library policies
CREATE POLICY "Users can view their own audiobook library"
  ON user_audiobook_library FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own audiobook library"
  ON user_audiobook_library FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audiobook library"
  ON user_audiobook_library FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all audiobook libraries"
  ON user_audiobook_library FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Listening sessions policies
CREATE POLICY "Users can view their own listening sessions"
  ON listening_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own listening sessions"
  ON listening_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listening sessions"
  ON listening_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Audiobook reviews policies
CREATE POLICY "Anyone can view audiobook reviews"
  ON audiobook_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON audiobook_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON audiobook_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON audiobook_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_audiobook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_audiobooks_updated_at
  BEFORE UPDATE ON audiobooks
  FOR EACH ROW
  EXECUTE FUNCTION update_audiobook_updated_at();

CREATE TRIGGER update_audiobook_chapters_updated_at
  BEFORE UPDATE ON audiobook_chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_audiobook_updated_at();

CREATE TRIGGER update_user_audiobook_library_updated_at
  BEFORE UPDATE ON user_audiobook_library
  FOR EACH ROW
  EXECUTE FUNCTION update_audiobook_updated_at();

CREATE TRIGGER update_audiobook_reviews_updated_at
  BEFORE UPDATE ON audiobook_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_audiobook_updated_at();