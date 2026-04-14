/*
  # Fix Admin RLS Policies and Public Access
  
  ## Issues Fixed
  1. Admin checks were looking at `auth.users.raw_user_meta_data->>'role'` but the system uses `profiles.is_admin`
  2. Books table needs public read access for the dropdown in AddEbookModal
  3. Ebooks table needs public read access for viewing
  4. All write operations to ebooks must check `profiles.is_admin` instead of user metadata
  
  ## Changes Made
  1. Update all admin policies to check `profiles.is_admin = true`
  2. Add public SELECT policies for books and ebooks tables
  3. Fix ebook INSERT/UPDATE/DELETE policies to use correct admin check
  
  ## Security Notes
  - Read access is public (authenticated users can view books and ebooks)
  - Write access is restricted to admins only via profiles.is_admin check
  - All policies use optimized `(select auth.uid())` pattern
*/

-- =====================================================
-- 1. FIX EBOOKS RLS POLICIES FOR ADMIN
-- =====================================================

DROP POLICY IF EXISTS "Admins can insert ebooks" ON public.ebooks;
CREATE POLICY "Admins can insert ebooks"
  ON public.ebooks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
      AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can update ebooks" ON public.ebooks;
CREATE POLICY "Admins can update ebooks"
  ON public.ebooks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
      AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can delete ebooks" ON public.ebooks;
CREATE POLICY "Admins can delete ebooks"
  ON public.ebooks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
      AND is_admin = true
    )
  );

-- Add public read access for ebooks
DROP POLICY IF EXISTS "Anyone can view ebooks" ON public.ebooks;
CREATE POLICY "Anyone can view ebooks"
  ON public.ebooks
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 2. FIX BOOKS RLS POLICIES FOR PUBLIC ACCESS
-- =====================================================

-- Books already has "View and manage books" policy but we need to ensure it allows access
DROP POLICY IF EXISTS "View and manage books" ON public.books;
CREATE POLICY "View and manage books"
  ON public.books
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can modify books" ON public.books;
CREATE POLICY "Admins can modify books"
  ON public.books
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
      AND is_admin = true
    )
  );

-- =====================================================
-- 3. FIX OTHER ADMIN POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can modify authors" ON public.authors;
CREATE POLICY "Admins can modify authors"
  ON public.authors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
      AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can modify blog posts" ON public.blog_posts;
CREATE POLICY "Admins can modify blog posts"
  ON public.blog_posts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
      AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "View published blog posts" ON public.blog_posts;
CREATE POLICY "View published blog posts"
  ON public.blog_posts
  FOR SELECT
  TO authenticated
  USING (is_published = true OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
  ));

DROP POLICY IF EXISTS "Admins can modify book authors" ON public.book_authors;
CREATE POLICY "Admins can modify book authors"
  ON public.book_authors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
      AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can modify book quotes" ON public.book_quotes;
CREATE POLICY "Admins can modify book quotes"
  ON public.book_quotes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
      AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can modify categories" ON public.categories;
CREATE POLICY "Admins can modify categories"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
      AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Update reviews" ON public.reviews;
CREATE POLICY "Update reviews"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
  ))
  WITH CHECK (user_id = (select auth.uid()) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
  ));

DROP POLICY IF EXISTS "Delete reviews" ON public.reviews;
CREATE POLICY "Delete reviews"
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
  ));

DROP POLICY IF EXISTS "View approved reviews" ON public.reviews;
CREATE POLICY "View approved reviews"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (is_approved = true OR user_id = (select auth.uid()) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid())
    AND is_admin = true
  ));
