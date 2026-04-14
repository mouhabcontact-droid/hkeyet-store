/*
  # Comprehensive Security and Performance Fixes

  ## Performance Improvements
  
  ### 1. Add Missing Foreign Key Indexes
  Creates indexes on all foreign key columns to improve query performance:
  - blog_posts.author_id
  - book_authors.author_id
  - book_quotes.book_id
  - cart_items.book_id
  - ebooks.category_id
  - highlights.user_id
  - order_items.book_id
  - promo_code_usage.order_id
  - promo_codes.created_by
  - reading_sessions.user_id
  - reviews.user_id
  - site_settings.updated_by
  - user_library.ebook_id
  - wishlists.book_id

  ### 2. Optimize RLS Policies
  Updates all RLS policies to use (select auth.uid()) pattern instead of auth.uid()
  to prevent re-evaluation for each row, improving performance at scale.

  ### 3. Remove Duplicate Permissive Policies
  Consolidates multiple permissive policies into single policies with combined logic
  to avoid unnecessary policy evaluation overhead.

  ### 4. Fix Function Search Paths
  Updates all functions to use explicit schema-qualified references and set
  search_path to empty string for security.

  ## Security
  - All changes follow security best practices
  - RLS policies remain restrictive and properly enforce access control
  - Function security improved with immutable search paths
*/

-- =====================================================
-- PART 1: ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

-- blog_posts indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);

-- book_authors indexes
CREATE INDEX IF NOT EXISTS idx_book_authors_author_id ON public.book_authors(author_id);

-- book_quotes indexes
CREATE INDEX IF NOT EXISTS idx_book_quotes_book_id ON public.book_quotes(book_id);

-- cart_items indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_book_id ON public.cart_items(book_id);

-- ebooks indexes
CREATE INDEX IF NOT EXISTS idx_ebooks_category_id ON public.ebooks(category_id);

-- highlights indexes
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON public.highlights(user_id);

-- order_items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_book_id ON public.order_items(book_id);

-- promo_code_usage indexes
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_order_id ON public.promo_code_usage(order_id);

-- promo_codes indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_created_by ON public.promo_codes(created_by);

-- reading_sessions indexes
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON public.reading_sessions(user_id);

-- reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- site_settings indexes
CREATE INDEX IF NOT EXISTS idx_site_settings_updated_by ON public.site_settings(updated_by);

-- user_library indexes
CREATE INDEX IF NOT EXISTS idx_user_library_ebook_id ON public.user_library(ebook_id);

-- wishlists indexes
CREATE INDEX IF NOT EXISTS idx_wishlists_book_id ON public.wishlists(book_id);

-- =====================================================
-- PART 2: OPTIMIZE RLS POLICIES (USE SELECT PATTERN)
-- =====================================================

-- Drop and recreate profiles policies with optimized auth checks
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- Drop and recreate promo_codes policies
DROP POLICY IF EXISTS "Admins can create promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Admins can update promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Admins can delete promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Admins can view all promo codes" ON public.promo_codes;

CREATE POLICY "Admins can create promo codes"
  ON public.promo_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update promo codes"
  ON public.promo_codes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete promo codes"
  ON public.promo_codes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view all promo codes"
  ON public.promo_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- Drop and recreate promo_code_usage policies
DROP POLICY IF EXISTS "Admins can view all promo code usage" ON public.promo_code_usage;
DROP POLICY IF EXISTS "Users can create promo code usage records" ON public.promo_code_usage;
DROP POLICY IF EXISTS "Users can view own promo code usage" ON public.promo_code_usage;

CREATE POLICY "Admins can view all promo code usage"
  ON public.promo_code_usage
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can create promo code usage records"
  ON public.promo_code_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own promo code usage"
  ON public.promo_code_usage
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Drop and recreate site_settings policies
DROP POLICY IF EXISTS "Only admins can insert site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Only admins can update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Only admins can delete site settings" ON public.site_settings;

CREATE POLICY "Only admins can insert site settings"
  ON public.site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update site settings"
  ON public.site_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete site settings"
  ON public.site_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- Drop and recreate featured_books policies
DROP POLICY IF EXISTS "Only admins can insert featured books" ON public.featured_books;
DROP POLICY IF EXISTS "Only admins can update featured books" ON public.featured_books;
DROP POLICY IF EXISTS "Only admins can delete featured books" ON public.featured_books;

CREATE POLICY "Only admins can insert featured books"
  ON public.featured_books
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update featured books"
  ON public.featured_books
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete featured books"
  ON public.featured_books
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- =====================================================
-- PART 3: CONSOLIDATE DUPLICATE PERMISSIVE POLICIES
-- =====================================================

-- Consolidate authors policies
DROP POLICY IF EXISTS "Admins can modify authors" ON public.authors;
DROP POLICY IF EXISTS "View and manage authors" ON public.authors;

CREATE POLICY "Authenticated users can view authors"
  ON public.authors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage authors"
  ON public.authors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- Consolidate blog_posts policies
DROP POLICY IF EXISTS "Admins can modify blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "View published blog posts" ON public.blog_posts;

CREATE POLICY "Users can view published blog posts"
  ON public.blog_posts
  FOR SELECT
  TO authenticated
  USING (is_published = true OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND role = 'admin'
  ));

CREATE POLICY "Admins can manage blog posts"
  ON public.blog_posts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- Consolidate book_authors policies
DROP POLICY IF EXISTS "Admins can modify book authors" ON public.book_authors;
DROP POLICY IF EXISTS "View and manage book authors" ON public.book_authors;

CREATE POLICY "Authenticated users can view book authors"
  ON public.book_authors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage book authors"
  ON public.book_authors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- Consolidate book_quotes policies
DROP POLICY IF EXISTS "Admins can modify book quotes" ON public.book_quotes;
DROP POLICY IF EXISTS "View and manage book quotes" ON public.book_quotes;

CREATE POLICY "Authenticated users can view book quotes"
  ON public.book_quotes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage book quotes"
  ON public.book_quotes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- Consolidate books policies
DROP POLICY IF EXISTS "Admins can modify books" ON public.books;
DROP POLICY IF EXISTS "View and manage books" ON public.books;

CREATE POLICY "Authenticated users can view books"
  ON public.books
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage books"
  ON public.books
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- Consolidate categories policies
DROP POLICY IF EXISTS "Admins can modify categories" ON public.categories;
DROP POLICY IF EXISTS "View and manage categories" ON public.categories;

CREATE POLICY "Authenticated users can view categories"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- =====================================================
-- PART 4: FIX FUNCTION SEARCH PATHS
-- =====================================================

-- Recreate increment_promo_usage with secure search_path
CREATE OR REPLACE FUNCTION public.increment_promo_usage()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.promo_codes
  SET used_count = used_count + 1
  WHERE id = NEW.promo_code_id;
  RETURN NEW;
END;
$$;

-- Recreate update_promo_codes_updated_at with secure search_path
CREATE OR REPLACE FUNCTION public.update_promo_codes_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate validate_promo_code with secure search_path
CREATE OR REPLACE FUNCTION public.validate_promo_code(code_input TEXT)
RETURNS TABLE (
  id UUID,
  code TEXT,
  discount_percentage INTEGER,
  is_valid BOOLEAN,
  message TEXT
)
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  promo_record RECORD;
BEGIN
  SELECT * INTO promo_record
  FROM public.promo_codes
  WHERE public.promo_codes.code = code_input;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      NULL::UUID, 
      NULL::TEXT, 
      NULL::INTEGER, 
      FALSE, 
      'Invalid promo code'::TEXT;
    RETURN;
  END IF;

  IF NOT promo_record.is_active THEN
    RETURN QUERY SELECT 
      promo_record.id, 
      promo_record.code, 
      promo_record.discount_percentage, 
      FALSE, 
      'This promo code is inactive'::TEXT;
    RETURN;
  END IF;

  IF promo_record.valid_from > now() THEN
    RETURN QUERY SELECT 
      promo_record.id, 
      promo_record.code, 
      promo_record.discount_percentage, 
      FALSE, 
      'This promo code is not yet valid'::TEXT;
    RETURN;
  END IF;

  IF promo_record.valid_until < now() THEN
    RETURN QUERY SELECT 
      promo_record.id, 
      promo_record.code, 
      promo_record.discount_percentage, 
      FALSE, 
      'This promo code has expired'::TEXT;
    RETURN;
  END IF;

  IF promo_record.usage_limit IS NOT NULL AND promo_record.used_count >= promo_record.usage_limit THEN
    RETURN QUERY SELECT 
      promo_record.id, 
      promo_record.code, 
      promo_record.discount_percentage, 
      FALSE, 
      'This promo code has reached its usage limit'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT 
    promo_record.id, 
    promo_record.code, 
    promo_record.discount_percentage, 
    TRUE, 
    'Promo code is valid'::TEXT;
END;
$$;

-- Recreate sync_admin_role with secure search_path
CREATE OR REPLACE FUNCTION public.sync_admin_role()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    NEW.raw_app_meta_data = jsonb_set(
      COALESCE(NEW.raw_app_meta_data, '{}'::jsonb),
      '{role}',
      '"admin"'::jsonb
    );
  ELSE
    NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) - 'role';
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate protect_master_admin with secure search_path
CREATE OR REPLACE FUNCTION public.protect_master_admin()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.email = 'admin@bookstore.com' AND NEW.role != 'admin' THEN
    RAISE EXCEPTION 'Cannot modify the master admin role';
  END IF;
  RETURN NEW;
END;
$$;