/*
  # Fix Security and Performance Issues

  ## Changes
  
  1. **Add Missing Foreign Key Indexes**
     - Add indexes on all foreign key columns for optimal query performance:
       - blog_posts.author_id
       - book_authors.author_id
       - book_quotes.book_id
       - cart_items.book_id
       - order_items.book_id, order_id
       - reviews.user_id
       - wishlists.book_id

  2. **Optimize RLS Policies**
     - Replace auth.uid() with (select auth.uid()) to prevent re-evaluation per row
     - Fix all RLS policies across tables for better performance at scale

  3. **Remove Unused Indexes**
     - Drop indexes that are not being used by queries

  4. **Fix Function Search Paths**
     - Set immutable search paths for database functions
     
  5. **Fix Newsletter RLS Policy**
     - Restrict newsletter subscription policy to prevent unrestricted access
*/

-- =============================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS blog_posts_author_id_idx ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS book_authors_author_id_idx ON public.book_authors(author_id);
CREATE INDEX IF NOT EXISTS book_quotes_book_id_idx ON public.book_quotes(book_id);
CREATE INDEX IF NOT EXISTS cart_items_book_id_idx ON public.cart_items(book_id);
CREATE INDEX IF NOT EXISTS order_items_book_id_idx ON public.order_items(book_id);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS wishlists_book_id_idx ON public.wishlists(book_id);

-- =============================================
-- 2. OPTIMIZE RLS POLICIES WITH SELECT SUBQUERIES
-- =============================================

-- PROFILES TABLE
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- CATEGORIES TABLE
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- BOOKS TABLE
DROP POLICY IF EXISTS "Admins can manage books" ON public.books;
CREATE POLICY "Admins can manage books"
  ON public.books FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- AUTHORS TABLE
DROP POLICY IF EXISTS "Admins can manage authors" ON public.authors;
CREATE POLICY "Admins can manage authors"
  ON public.authors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- BOOK_AUTHORS TABLE
DROP POLICY IF EXISTS "Admins can manage book authors" ON public.book_authors;
CREATE POLICY "Admins can manage book authors"
  ON public.book_authors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- CART_ITEMS TABLE
DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;
CREATE POLICY "Users can view own cart items"
  ON public.cart_items FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own cart items" ON public.cart_items;
CREATE POLICY "Users can insert own cart items"
  ON public.cart_items FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;
CREATE POLICY "Users can update own cart items"
  ON public.cart_items FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;
CREATE POLICY "Users can delete own cart items"
  ON public.cart_items FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ORDERS TABLE
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- ORDER_ITEMS TABLE
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
CREATE POLICY "Users can insert order items"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (select auth.uid())
    )
  );

-- REVIEWS TABLE (using is_approved instead of status)
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
CREATE POLICY "Anyone can view approved reviews"
  ON public.reviews FOR SELECT
  TO public
  USING (is_approved = true);

DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
CREATE POLICY "Authenticated users can insert reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
CREATE POLICY "Admins can manage all reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- WISHLISTS TABLE
DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlists;
CREATE POLICY "Users can view own wishlist"
  ON public.wishlists FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own wishlist items" ON public.wishlists;
CREATE POLICY "Users can insert own wishlist items"
  ON public.wishlists FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own wishlist items" ON public.wishlists;
CREATE POLICY "Users can delete own wishlist items"
  ON public.wishlists FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- USER_ACTIVITY TABLE
DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity;
CREATE POLICY "Users can view own activity"
  ON public.user_activity FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own activity" ON public.user_activity;
CREATE POLICY "Users can insert own activity"
  ON public.user_activity FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- BLOG_POSTS TABLE (using is_published instead of status)
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON public.blog_posts;
CREATE POLICY "Anyone can view published blog posts"
  ON public.blog_posts FOR SELECT
  TO public
  USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage blog posts" ON public.blog_posts;
CREATE POLICY "Admins can manage blog posts"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- NEWSLETTER_SUBSCRIBERS TABLE
DROP POLICY IF EXISTS "Admins can view subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can view subscribers"
  ON public.newsletter_subscribers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers FOR INSERT
  TO public
  WITH CHECK (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- BOOK_QUOTES TABLE
DROP POLICY IF EXISTS "Admins can manage book quotes" ON public.book_quotes;
CREATE POLICY "Admins can manage book quotes"
  ON public.book_quotes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- =============================================
-- 3. REMOVE UNUSED INDEXES
-- =============================================

DROP INDEX IF EXISTS public.books_is_featured_idx;
DROP INDEX IF EXISTS public.books_is_bestseller_idx;
DROP INDEX IF EXISTS public.books_is_new_release_idx;
DROP INDEX IF EXISTS public.orders_user_id_idx;
DROP INDEX IF EXISTS public.user_activity_book_id_idx;
DROP INDEX IF EXISTS public.blog_posts_published_at_idx;

-- =============================================
-- 4. FIX FUNCTION SEARCH PATHS
-- =============================================

-- Fix update_book_rating function
CREATE OR REPLACE FUNCTION public.update_book_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.books
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.reviews
      WHERE book_id = NEW.book_id
      AND is_approved = true
    ),
    reviews_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE book_id = NEW.book_id
      AND is_approved = true
    )
  WHERE id = NEW.book_id;
  RETURN NEW;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix generate_order_number function
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_order_number text;
  order_exists boolean;
BEGIN
  LOOP
    new_order_number := 'ORD-' || LPAD(floor(random() * 999999)::text, 6, '0');
    
    SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_number = new_order_number)
    INTO order_exists;
    
    EXIT WHEN NOT order_exists;
  END LOOP;
  
  RETURN new_order_number;
END;
$$;