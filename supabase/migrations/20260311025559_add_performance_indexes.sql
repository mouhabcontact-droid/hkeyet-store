/*
  # Add Performance Indexes

  1. New Indexes
    - Add indexes on frequently queried columns to improve performance
    - Includes foreign keys, lookup columns, and filter columns

  2. Performance Benefits
    - Faster book searches and filtering
    - Faster order lookups
    - Faster user activity tracking
    - Improved admin dashboard loading
*/

-- Books indexes
CREATE INDEX IF NOT EXISTS idx_books_category_id ON books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_slug ON books(slug);
CREATE INDEX IF NOT EXISTS idx_books_rating ON books(rating DESC);
CREATE INDEX IF NOT EXISTS idx_books_total_sales ON books(total_sales DESC);
CREATE INDEX IF NOT EXISTS idx_books_release_date ON books(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_books_price ON books(price);

-- Book authors indexes
CREATE INDEX IF NOT EXISTS idx_book_authors_author_id ON book_authors(author_id);
CREATE INDEX IF NOT EXISTS idx_book_authors_book_id ON book_authors(book_id);

-- Authors indexes
CREATE INDEX IF NOT EXISTS idx_authors_slug ON authors(slug);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_book_id ON order_items(book_id);

-- Cart items indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_book_id ON cart_items(book_id);

-- Wishlists indexes
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_book_id ON wishlists(book_id);

-- User activity indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_book_id ON user_activity(book_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);

-- Ebooks indexes
CREATE INDEX IF NOT EXISTS idx_ebooks_category_id ON ebooks(category_id);
CREATE INDEX IF NOT EXISTS idx_ebooks_book_id ON ebooks(book_id);
CREATE INDEX IF NOT EXISTS idx_ebooks_rating ON ebooks(rating DESC);
CREATE INDEX IF NOT EXISTS idx_ebooks_created_at ON ebooks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ebooks_views ON ebooks(views DESC);

-- User library indexes
CREATE INDEX IF NOT EXISTS idx_user_library_user_id ON user_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_ebook_id ON user_library(ebook_id);
CREATE INDEX IF NOT EXISTS idx_user_library_last_opened ON user_library(last_opened DESC NULLS LAST);

-- Promo codes indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON promo_codes(is_active) WHERE is_active = true;

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved) WHERE is_approved = true;

-- Ebook reviews indexes
CREATE INDEX IF NOT EXISTS idx_ebook_reviews_ebook_id ON ebook_reviews(ebook_id);
CREATE INDEX IF NOT EXISTS idx_ebook_reviews_user_id ON ebook_reviews(user_id);

-- Manuscripts indexes
CREATE INDEX IF NOT EXISTS idx_manuscripts_user_id ON manuscripts(user_id);
CREATE INDEX IF NOT EXISTS idx_manuscripts_status ON manuscripts(status);

-- Reading sessions indexes
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_ebook_id ON reading_sessions(ebook_id);

-- Bookmarks indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_ebook_id ON bookmarks(ebook_id);

-- Highlights indexes
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_ebook_id ON highlights(ebook_id);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);