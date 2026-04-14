/*
  # Add Sample Data for HKEYET Bookstore

  ## Overview
  Populates the database with sample data for testing and demonstration purposes.

  ## Sample Data Added
  
  ### Categories
  - Novels, Fantasy, Philosophy, Poetry, History, Science, Children, Self Development, Mystery, Biography

  ### Authors
  - Multiple sample authors with bios

  ### Books
  - Variety of books across all categories
  - Mix of featured, new releases, and bestsellers
  - Complete book information including pricing, descriptions, and metadata

  ### Book Quotes
  - Inspirational quotes from featured books
*/

INSERT INTO categories (name, slug, description, display_order) VALUES
  ('Novels', 'novels', 'Timeless and contemporary fiction', 1),
  ('Fantasy', 'fantasy', 'Epic adventures and magical realms', 2),
  ('Philosophy', 'philosophy', 'Deep thoughts and wisdom', 3),
  ('Poetry', 'poetry', 'Verses that touch the soul', 4),
  ('History', 'history', 'Stories from our past', 5),
  ('Science', 'science', 'Discoveries and innovations', 6),
  ('Children', 'children', 'Books for young readers', 7),
  ('Self Development', 'self-development', 'Growth and personal transformation', 8),
  ('Mystery', 'mystery', 'Thrilling tales and suspense', 9),
  ('Biography', 'biography', 'Lives of remarkable people', 10)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO authors (name, slug, bio) VALUES
  ('Elena Martinez', 'elena-martinez', 'Award-winning author known for her powerful storytelling and deep character development.'),
  ('James Chen', 'james-chen', 'Bestselling fantasy author with over 20 novels published worldwide.'),
  ('Sarah Williams', 'sarah-williams', 'Philosopher and writer exploring the human condition through elegant prose.'),
  ('Michael Rivers', 'michael-rivers', 'Contemporary poet whose work has been featured in major literary magazines.'),
  ('Dr. Robert Hayes', 'robert-hayes', 'Historian and professor specializing in ancient civilizations.'),
  ('Lisa Anderson', 'lisa-anderson', 'Science writer making complex topics accessible to everyone.'),
  ('Thomas Wright', 'thomas-wright', 'Children author beloved by readers of all ages.'),
  ('Patricia Moore', 'patricia-moore', 'Life coach and motivational speaker helping millions transform their lives.'),
  ('David Foster', 'david-foster', 'Master of suspense with a talent for crafting unforgettable mysteries.'),
  ('Amanda Foster', 'amanda-foster', 'Biographer capturing the essence of extraordinary individuals.')
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
  cat_novels UUID;
  cat_fantasy UUID;
  cat_philosophy UUID;
  cat_poetry UUID;
  cat_history UUID;
  cat_science UUID;
  cat_children UUID;
  cat_selfdev UUID;
  cat_mystery UUID;
  cat_biography UUID;
  
  author_martinez UUID;
  author_chen UUID;
  author_williams UUID;
  author_rivers UUID;
  author_hayes UUID;
  author_anderson UUID;
  author_wright UUID;
  author_moore UUID;
  author_foster UUID;
  author_amanda UUID;
  
  book_id UUID;
BEGIN
  SELECT id INTO cat_novels FROM categories WHERE slug = 'novels';
  SELECT id INTO cat_fantasy FROM categories WHERE slug = 'fantasy';
  SELECT id INTO cat_philosophy FROM categories WHERE slug = 'philosophy';
  SELECT id INTO cat_poetry FROM categories WHERE slug = 'poetry';
  SELECT id INTO cat_history FROM categories WHERE slug = 'history';
  SELECT id INTO cat_science FROM categories WHERE slug = 'science';
  SELECT id INTO cat_children FROM categories WHERE slug = 'children';
  SELECT id INTO cat_selfdev FROM categories WHERE slug = 'self-development';
  SELECT id INTO cat_mystery FROM categories WHERE slug = 'mystery';
  SELECT id INTO cat_biography FROM categories WHERE slug = 'biography';
  
  SELECT id INTO author_martinez FROM authors WHERE slug = 'elena-martinez';
  SELECT id INTO author_chen FROM authors WHERE slug = 'james-chen';
  SELECT id INTO author_williams FROM authors WHERE slug = 'sarah-williams';
  SELECT id INTO author_rivers FROM authors WHERE slug = 'michael-rivers';
  SELECT id INTO author_hayes FROM authors WHERE slug = 'robert-hayes';
  SELECT id INTO author_anderson FROM authors WHERE slug = 'lisa-anderson';
  SELECT id INTO author_wright FROM authors WHERE slug = 'thomas-wright';
  SELECT id INTO author_moore FROM authors WHERE slug = 'patricia-moore';
  SELECT id INTO author_foster FROM authors WHERE slug = 'david-foster';
  SELECT id INTO author_amanda FROM authors WHERE slug = 'amanda-foster';
  
  INSERT INTO books (title, slug, category_id, description, price, stock, isbn, pages, is_featured, is_new_release, is_bestseller, rating, total_reviews, total_sales, cover_url) VALUES
    ('The Silent Echo', 'the-silent-echo', cat_novels, 'A haunting tale of love, loss, and redemption set against the backdrop of a changing world. Martinez weaves a story that will stay with you long after the final page.', 24.99, 100, '978-1-234567-89-0', 342, true, true, true, 4.8, 245, 1240, 'https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg'),
    ('Realm of Shadows', 'realm-of-shadows', cat_fantasy, 'An epic fantasy adventure spanning three kingdoms and countless lifetimes. The first book in the acclaimed Shadowlands series.', 29.99, 85, '978-1-234567-90-6', 512, true, false, true, 4.9, 892, 3450, 'https://images.pexels.com/photos/4350179/pexels-photo-4350179.jpeg'),
    ('Thoughts on Being', 'thoughts-on-being', cat_philosophy, 'A profound exploration of existence, consciousness, and what it means to be human in the modern age.', 19.99, 120, '978-1-234567-91-3', 256, true, true, false, 4.6, 156, 520, 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg'),
    ('Whispers of Wind', 'whispers-of-wind', cat_poetry, 'A collection of beautiful verses celebrating nature, love, and the human spirit.', 16.99, 95, '978-1-234567-92-0', 128, false, true, false, 4.7, 89, 340, 'https://images.pexels.com/photos/3747132/pexels-photo-3747132.jpeg'),
    ('Ancient Empires', 'ancient-empires', cat_history, 'A comprehensive look at the rise and fall of the greatest civilizations, told with vivid detail and scholarly precision.', 34.99, 65, '978-1-234567-93-7', 624, true, false, false, 4.8, 312, 890, 'https://images.pexels.com/photos/1925536/pexels-photo-1925536.jpeg'),
    ('The Quantum Mind', 'the-quantum-mind', cat_science, 'Exploring the fascinating intersection of quantum physics and human consciousness. Science made beautifully accessible.', 27.99, 78, '978-1-234567-94-4', 384, false, true, true, 4.9, 445, 1680, 'https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg'),
    ('Adventures of Luna', 'adventures-of-luna', cat_children, 'Join Luna the brave cat on her magical journey through enchanted forests and mystical lands. Perfect for ages 6-10.', 14.99, 150, '978-1-234567-95-1', 96, false, true, false, 4.9, 523, 2100, 'https://images.pexels.com/photos/4440885/pexels-photo-4440885.jpeg'),
    ('Unlock Your Potential', 'unlock-your-potential', cat_selfdev, 'Transform your life with proven strategies for personal growth, success, and fulfillment. A life-changing guide.', 22.99, 110, '978-1-234567-96-8', 288, true, false, true, 4.7, 678, 2890, 'https://images.pexels.com/photos/3882464/pexels-photo-3882464.jpeg'),
    ('The Last Witness', 'the-last-witness', cat_mystery, 'A gripping thriller that will keep you up all night. When a witness disappears, detective Sarah Cole must race against time.', 21.99, 92, '978-1-234567-97-5', 368, false, true, true, 4.8, 756, 3200, 'https://images.pexels.com/photos/7319071/pexels-photo-7319071.jpeg'),
    ('Lives That Changed History', 'lives-that-changed-history', cat_biography, 'Ten remarkable individuals whose courage and vision shaped our world. Inspiring stories of determination and impact.', 26.99, 88, '978-1-234567-98-2', 456, false, false, false, 4.6, 234, 780, 'https://images.pexels.com/photos/3747468/pexels-photo-3747468.jpeg'),
    ('Midnight Garden', 'midnight-garden', cat_novels, 'A lyrical exploration of family secrets and forgotten memories, set in a mysterious garden that blooms only at night.', 23.99, 105, '978-1-234567-99-9', 298, false, true, false, 4.5, 178, 456, 'https://images.pexels.com/photos/4132936/pexels-photo-4132936.jpeg'),
    ('Dragon Legacy', 'dragons-legacy', cat_fantasy, 'The epic conclusion to the Shadowlands trilogy. Heroes rise, kingdoms fall, and ancient magic awakens.', 31.99, 120, '978-1-234568-00-1', 598, true, true, true, 4.9, 1203, 4560, 'https://images.pexels.com/photos/4440001/pexels-photo-4440001.jpeg')
  ON CONFLICT (slug) DO NOTHING;
  
  INSERT INTO book_authors (book_id, author_id)
  SELECT b.id, a.id FROM books b, authors a
  WHERE (b.slug = 'the-silent-echo' AND a.slug = 'elena-martinez')
     OR (b.slug = 'realm-of-shadows' AND a.slug = 'james-chen')
     OR (b.slug = 'thoughts-on-being' AND a.slug = 'sarah-williams')
     OR (b.slug = 'whispers-of-wind' AND a.slug = 'michael-rivers')
     OR (b.slug = 'ancient-empires' AND a.slug = 'robert-hayes')
     OR (b.slug = 'the-quantum-mind' AND a.slug = 'lisa-anderson')
     OR (b.slug = 'adventures-of-luna' AND a.slug = 'thomas-wright')
     OR (b.slug = 'unlock-your-potential' AND a.slug = 'patricia-moore')
     OR (b.slug = 'the-last-witness' AND a.slug = 'david-foster')
     OR (b.slug = 'lives-that-changed-history' AND a.slug = 'amanda-foster')
     OR (b.slug = 'midnight-garden' AND a.slug = 'elena-martinez')
     OR (b.slug = 'dragons-legacy' AND a.slug = 'james-chen')
  ON CONFLICT DO NOTHING;
  
  INSERT INTO book_quotes (book_id, quote, is_featured)
  SELECT b.id, q.quote, q.is_featured
  FROM (VALUES
    ('the-silent-echo', 'In the silence between heartbeats, we find the echo of who we truly are.', true),
    ('realm-of-shadows', 'Magic is not found in spells, but in the courage to believe in the impossible.', true),
    ('thoughts-on-being', 'To exist is to question; to question is to truly live.', true),
    ('unlock-your-potential', 'Your potential is not a destination, but a journey of continuous growth.', true),
    ('dragons-legacy', 'Legends are not born from strength, but from the choices we make in our darkest hours.', true)
  ) AS q(slug, quote, is_featured)
  JOIN books b ON b.slug = q.slug
  ON CONFLICT DO NOTHING;
END $$;
