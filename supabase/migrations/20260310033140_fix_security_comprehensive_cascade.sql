/*
  # Fix Security and Performance Issues

  1. RLS Optimization - Use (select auth.uid())
  2. Remove Unused Indexes
  3. Consolidate Permissive Policies
  4. Fix Function Search Path with CASCADE
*/

-- =====================================================
-- 1. FIX MANUSCRIPTS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own manuscripts" ON manuscripts;
DROP POLICY IF EXISTS "Users can insert manuscript if no pending" ON manuscripts;
DROP POLICY IF EXISTS "Admins can view all manuscripts" ON manuscripts;
DROP POLICY IF EXISTS "Admins can update manuscripts" ON manuscripts;
DROP POLICY IF EXISTS "Admins can delete manuscripts" ON manuscripts;

CREATE POLICY "Users can view own manuscripts" ON manuscripts FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert manuscript if no pending" ON manuscripts FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()) AND NOT EXISTS (
    SELECT 1 FROM manuscripts WHERE user_id = (select auth.uid()) AND status = 'pending'
  ));

CREATE POLICY "Admins can view all manuscripts" ON manuscripts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));

CREATE POLICY "Admins can update manuscripts" ON manuscripts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));

CREATE POLICY "Admins can delete manuscripts" ON manuscripts FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));

-- =====================================================
-- 2. REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_bookmarks_ebook_id;
DROP INDEX IF EXISTS idx_ebook_reviews_ebook_id;
DROP INDEX IF EXISTS idx_ebooks_book_id;
DROP INDEX IF EXISTS idx_highlights_ebook_id;
DROP INDEX IF EXISTS idx_orders_user_id;
DROP INDEX IF EXISTS idx_reading_sessions_ebook_id;
DROP INDEX IF EXISTS idx_user_activity_book_id;
DROP INDEX IF EXISTS idx_promo_codes_active;
DROP INDEX IF EXISTS idx_promo_code_usage_code;
DROP INDEX IF EXISTS idx_orders_promo_code;
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_book_authors_author_id;
DROP INDEX IF EXISTS idx_book_quotes_book_id;
DROP INDEX IF EXISTS idx_cart_items_book_id;
DROP INDEX IF EXISTS idx_site_settings_key;
DROP INDEX IF EXISTS idx_blog_posts_author_id;
DROP INDEX IF EXISTS idx_ebooks_category_id;
DROP INDEX IF EXISTS idx_highlights_user_id;
DROP INDEX IF EXISTS idx_order_items_book_id;
DROP INDEX IF EXISTS idx_promo_code_usage_order_id;
DROP INDEX IF EXISTS idx_promo_codes_created_by;
DROP INDEX IF EXISTS idx_reading_sessions_user_id;
DROP INDEX IF EXISTS idx_reviews_user_id;
DROP INDEX IF EXISTS idx_site_settings_updated_by;
DROP INDEX IF EXISTS idx_user_library_ebook_id;
DROP INDEX IF EXISTS idx_wishlists_book_id;
DROP INDEX IF EXISTS idx_manuscripts_user_id;
DROP INDEX IF EXISTS idx_manuscripts_status;

-- =====================================================
-- 3. CONSOLIDATE PERMISSIVE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage authors" ON authors;
DROP POLICY IF EXISTS "Anyone can view authors" ON authors;
DROP POLICY IF EXISTS "Authenticated users can view authors" ON authors;
CREATE POLICY "Public can view authors" ON authors FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage authors" ON authors FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can manage blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Users can view published blog posts" ON blog_posts;
CREATE POLICY "View published blog posts" ON blog_posts FOR SELECT TO public USING (is_published = true);
CREATE POLICY "Admins can manage blog posts" ON blog_posts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can manage book authors" ON book_authors;
DROP POLICY IF EXISTS "Anyone can view book authors" ON book_authors;
DROP POLICY IF EXISTS "Authenticated users can view book authors" ON book_authors;
CREATE POLICY "Public can view book authors" ON book_authors FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage book authors" ON book_authors FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can manage book quotes" ON book_quotes;
DROP POLICY IF EXISTS "Authenticated users can view book quotes" ON book_quotes;
CREATE POLICY "Public can view book quotes" ON book_quotes FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage book quotes" ON book_quotes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can manage books" ON books;
DROP POLICY IF EXISTS "Anyone can view books" ON books;
DROP POLICY IF EXISTS "Authenticated users can view books" ON books;
CREATE POLICY "Public can view books" ON books FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage books" ON books FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can view categories" ON categories;
CREATE POLICY "Public can view categories" ON categories FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated
  USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));

DROP POLICY IF EXISTS "Admins can view all promo code usage" ON promo_code_usage;
DROP POLICY IF EXISTS "Users can view own promo code usage" ON promo_code_usage;
CREATE POLICY "Users can view own promo code usage" ON promo_code_usage FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));
CREATE POLICY "Admins can view all promo code usage" ON promo_code_usage FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can view all promo codes" ON promo_codes;
DROP POLICY IF EXISTS "Users can view active promo codes" ON promo_codes;
CREATE POLICY "Users can view active promo codes" ON promo_codes FOR SELECT TO authenticated
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()) 
    AND (usage_limit IS NULL OR usage_count < usage_limit));
CREATE POLICY "Admins can view all promo codes" ON promo_codes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));

-- =====================================================
-- 4. FIX FUNCTION SEARCH PATH
-- =====================================================

DROP FUNCTION IF EXISTS public.increment_promo_usage(uuid);
CREATE FUNCTION public.increment_promo_usage(p_promo_code_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE promo_codes SET usage_count = usage_count + 1 WHERE id = p_promo_code_id;
END;
$$;

DROP FUNCTION IF EXISTS public.validate_promo_code(text);
CREATE FUNCTION public.validate_promo_code(p_code text)
RETURNS TABLE (id uuid, code text, discount_percentage integer, is_valid boolean, message text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_promo promo_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_promo FROM promo_codes WHERE promo_codes.code = p_code;
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, p_code, NULL::integer, false, 'Code promo invalide';
    RETURN;
  END IF;
  IF NOT v_promo.is_active THEN
    RETURN QUERY SELECT v_promo.id, v_promo.code, v_promo.discount_percentage, false, 'Code inactif';
    RETURN;
  END IF;
  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < now() THEN
    RETURN QUERY SELECT v_promo.id, v_promo.code, v_promo.discount_percentage, false, 'Code expiré';
    RETURN;
  END IF;
  IF v_promo.usage_limit IS NOT NULL AND v_promo.usage_count >= v_promo.usage_limit THEN
    RETURN QUERY SELECT v_promo.id, v_promo.code, v_promo.discount_percentage, false, 'Limite atteinte';
    RETURN;
  END IF;
  RETURN QUERY SELECT v_promo.id, v_promo.code, v_promo.discount_percentage, true, 'Valide'::text;
END;
$$;

DROP FUNCTION IF EXISTS public.update_manuscripts_updated_at() CASCADE;
CREATE FUNCTION public.update_manuscripts_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'manuscripts_updated_at') THEN
    CREATE TRIGGER manuscripts_updated_at
    BEFORE UPDATE ON manuscripts
    FOR EACH ROW EXECUTE FUNCTION update_manuscripts_updated_at();
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.validate_promo_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_promo_usage(uuid) TO authenticated;
