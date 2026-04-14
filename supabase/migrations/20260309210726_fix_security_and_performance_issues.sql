/*
  # Fix Security and Performance Issues

  ## 1. Add Missing Indexes for Foreign Keys
  Adding indexes to foreign key columns to improve query performance:
  - bookmarks.ebook_id
  - ebook_reviews.ebook_id
  - ebooks.book_id
  - highlights.ebook_id
  - orders.user_id
  - reading_sessions.ebook_id
  - user_activity.book_id

  ## 2. Optimize RLS Policies (Auth Function Initialization)
  Replacing `auth.uid()` with `(select auth.uid())` in all RLS policies to prevent
  re-evaluation for each row, significantly improving performance at scale.
  
  Tables affected:
  - bookmarks (4 policies)
  - ebook_reviews (3 policies)
  - ebooks (3 policies)
  - user_library (4 policies)
  - highlights (4 policies)
  - reading_sessions (3 policies)

  ## 3. Consolidate Multiple Permissive Policies
  Combining multiple permissive policies into single policies where appropriate:
  - authors, blog_posts, book_authors, book_quotes, books, categories
  - reviews (consolidate admin and user policies)

  ## 4. Fix Function Search Paths
  Setting secure search paths for functions to prevent potential security issues

  ## 5. Remove Unused Indexes
  Dropping indexes that have not been used to reduce maintenance overhead

  ## Important Notes
  - Auth connection strategy and leaked password protection are settings that must be
    configured in Supabase Dashboard and cannot be changed via SQL migrations
*/

-- =====================================================
-- 1. ADD MISSING INDEXES FOR FOREIGN KEYS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bookmarks_ebook_id ON public.bookmarks(ebook_id);
CREATE INDEX IF NOT EXISTS idx_ebook_reviews_ebook_id ON public.ebook_reviews(ebook_id);
CREATE INDEX IF NOT EXISTS idx_ebooks_book_id ON public.ebooks(book_id);
CREATE INDEX IF NOT EXISTS idx_highlights_ebook_id ON public.highlights(ebook_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_ebook_id ON public.reading_sessions(ebook_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_book_id ON public.user_activity(book_id);

-- =====================================================
-- 2. OPTIMIZE RLS POLICIES - BOOKMARKS
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view their own bookmarks"
  ON public.bookmarks
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can create their own bookmarks"
  ON public.bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can update their own bookmarks"
  ON public.bookmarks
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarks
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 3. OPTIMIZE RLS POLICIES - EBOOK_REVIEWS
-- =====================================================

DROP POLICY IF EXISTS "Users can create their own reviews" ON public.ebook_reviews;
CREATE POLICY "Users can create their own reviews"
  ON public.ebook_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.ebook_reviews;
CREATE POLICY "Users can update their own reviews"
  ON public.ebook_reviews
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.ebook_reviews;
CREATE POLICY "Users can delete their own reviews"
  ON public.ebook_reviews
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 4. OPTIMIZE RLS POLICIES - EBOOKS (ADMIN)
-- =====================================================

DROP POLICY IF EXISTS "Admins can insert ebooks" ON public.ebooks;
CREATE POLICY "Admins can insert ebooks"
  ON public.ebooks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = (select auth.uid())
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update ebooks" ON public.ebooks;
CREATE POLICY "Admins can update ebooks"
  ON public.ebooks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = (select auth.uid())
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete ebooks" ON public.ebooks;
CREATE POLICY "Admins can delete ebooks"
  ON public.ebooks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = (select auth.uid())
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- 5. OPTIMIZE RLS POLICIES - USER_LIBRARY
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own library" ON public.user_library;
CREATE POLICY "Users can view their own library"
  ON public.user_library
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can add to their library" ON public.user_library;
CREATE POLICY "Users can add to their library"
  ON public.user_library
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their library" ON public.user_library;
CREATE POLICY "Users can update their library"
  ON public.user_library
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can remove from their library" ON public.user_library;
CREATE POLICY "Users can remove from their library"
  ON public.user_library
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 6. OPTIMIZE RLS POLICIES - HIGHLIGHTS
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own highlights" ON public.highlights;
CREATE POLICY "Users can view their own highlights"
  ON public.highlights
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create their own highlights" ON public.highlights;
CREATE POLICY "Users can create their own highlights"
  ON public.highlights
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own highlights" ON public.highlights;
CREATE POLICY "Users can update their own highlights"
  ON public.highlights
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own highlights" ON public.highlights;
CREATE POLICY "Users can delete their own highlights"
  ON public.highlights
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 7. OPTIMIZE RLS POLICIES - READING_SESSIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own reading sessions" ON public.reading_sessions;
CREATE POLICY "Users can view their own reading sessions"
  ON public.reading_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create their own reading sessions" ON public.reading_sessions;
CREATE POLICY "Users can create their own reading sessions"
  ON public.reading_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own reading sessions" ON public.reading_sessions;
CREATE POLICY "Users can update their own reading sessions"
  ON public.reading_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- 8. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES - AUTHORS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage authors" ON public.authors;
DROP POLICY IF EXISTS "Anyone can view authors" ON public.authors;

CREATE POLICY "View and manage authors"
  ON public.authors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can modify authors"
  ON public.authors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = (select auth.uid())
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- 9. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES - BLOG_POSTS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON public.blog_posts;

CREATE POLICY "View published blog posts"
  ON public.blog_posts
  FOR SELECT
  TO authenticated
  USING (is_published = true OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = (select auth.uid())
    AND raw_user_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "Admins can modify blog posts"
  ON public.blog_posts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = (select auth.uid())
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- 10. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES - BOOK_AUTHORS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage book authors" ON public.book_authors;
DROP POLICY IF EXISTS "Anyone can view book authors" ON public.book_authors;

CREATE POLICY "View and manage book authors"
  ON public.book_authors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can modify book authors"
  ON public.book_authors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = (select auth.uid())
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- 11. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES - BOOK_QUOTES
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage book quotes" ON public.book_quotes;
DROP POLICY IF EXISTS "Anyone can view book quotes" ON public.book_quotes;

CREATE POLICY "View and manage book quotes"
  ON public.book_quotes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can modify book quotes"
  ON public.book_quotes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = (select auth.uid())
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- 12. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES - BOOKS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage books" ON public.books;
DROP POLICY IF EXISTS "Anyone can view books" ON public.books;

CREATE POLICY "View and manage books"
  ON public.books
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can modify books"
  ON public.books
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = (select auth.uid())
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- 13. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES - CATEGORIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;

CREATE POLICY "View and manage categories"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can modify categories"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = (select auth.uid())
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- 14. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES - REVIEWS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;

CREATE POLICY "View approved reviews"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (is_approved = true OR user_id = (select auth.uid()) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = (select auth.uid())
    AND raw_user_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "Insert reviews"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Update reviews"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = (select auth.uid())
    AND raw_user_meta_data->>'role' = 'admin'
  ))
  WITH CHECK (user_id = (select auth.uid()) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = (select auth.uid())
    AND raw_user_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "Delete reviews"
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = (select auth.uid())
    AND raw_user_meta_data->>'role' = 'admin'
  ));

-- =====================================================
-- 15. FIX FUNCTION SEARCH PATHS
-- =====================================================

ALTER FUNCTION public.update_ebook_rating() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_updated_at() SET search_path = pg_catalog, public;

-- =====================================================
-- 16. REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS public.idx_ebooks_category;
DROP INDEX IF EXISTS public.idx_ebooks_rating;
DROP INDEX IF EXISTS public.idx_user_library_ebook;
DROP INDEX IF EXISTS public.idx_highlights_user_ebook;
DROP INDEX IF EXISTS public.idx_reading_sessions_user;
DROP INDEX IF EXISTS public.blog_posts_author_id_idx;
DROP INDEX IF EXISTS public.book_authors_author_id_idx;
DROP INDEX IF EXISTS public.book_quotes_book_id_idx;
DROP INDEX IF EXISTS public.cart_items_book_id_idx;
DROP INDEX IF EXISTS public.order_items_book_id_idx;
DROP INDEX IF EXISTS public.reviews_user_id_idx;
DROP INDEX IF EXISTS public.wishlists_book_id_idx;
