/*
  # Add Sample eBooks

  ## Overview
  Adds sample eBooks to demonstrate the digital library functionality.
  These samples represent various genres and formats (EPUB and PDF).

  ## Changes
  - Inserts 10 sample eBooks with different categories
  - Sets realistic pricing, ratings, and metadata
*/

-- Insert sample eBooks only if they don't exist
DO $$
DECLARE
  v_category_id uuid;
BEGIN
  -- Get category ID for Technology
  SELECT id INTO v_category_id FROM categories WHERE name = 'Technology' LIMIT 1;
  IF v_category_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ebooks WHERE title = 'The Digital Age of Reading') THEN
    INSERT INTO ebooks (title, author, description, cover_image_url, file_url, format, page_count, preview_pages, isbn, price, category_id, published_date, rating)
    VALUES (
      'The Digital Age of Reading',
      'Sarah Mitchell',
      'Explore how digital technology has transformed the way we read and engage with literature in the 21st century.',
      'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://example.com/ebooks/digital-age.epub',
      'EPUB',
      320,
      25,
      '978-1234567890',
      12.99,
      v_category_id,
      '2024-01-15',
      4.5
    );
  END IF;

  -- Get category ID for Fiction
  SELECT id INTO v_category_id FROM categories WHERE name = 'Fiction' LIMIT 1;
  IF v_category_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ebooks WHERE title = 'Journey Through Stars') THEN
    INSERT INTO ebooks (title, author, description, cover_image_url, file_url, format, page_count, preview_pages, isbn, price, category_id, published_date, rating)
    VALUES (
      'Journey Through Stars',
      'Emily Carter',
      'A thrilling science fiction adventure that takes readers across galaxies and through time.',
      'https://images.pexels.com/photos/816608/pexels-photo-816608.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://example.com/ebooks/journey-stars.epub',
      'EPUB',
      380,
      20,
      '978-1234567892',
      13.99,
      v_category_id,
      '2024-01-20',
      4.3
    );
  END IF;

  -- Add more sample ebook
  SELECT id INTO v_category_id FROM categories LIMIT 1;
  IF v_category_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM ebooks WHERE title = 'Mindfulness for Busy Lives') THEN
      INSERT INTO ebooks (title, author, description, cover_image_url, file_url, format, page_count, preview_pages, isbn, price, category_id, published_date, rating)
      VALUES (
        'Mindfulness for Busy Lives',
        'Dr. Lisa Thompson',
        'Practical techniques for incorporating mindfulness and meditation into your daily routine.',
        'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=600',
        'https://example.com/ebooks/mindfulness.epub',
        'EPUB',
        220,
        20,
        '978-1234567894',
        11.99,
        v_category_id,
        '2024-02-15',
        4.6
      );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM ebooks WHERE title = 'Programming for Everyone') THEN
      INSERT INTO ebooks (title, author, description, cover_image_url, file_url, format, page_count, preview_pages, isbn, price, category_id, published_date, rating)
      VALUES (
        'Programming for Everyone',
        'Alex Johnson',
        'Learn the fundamentals of programming with this beginner-friendly guide to coding.',
        'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=600',
        'https://example.com/ebooks/programming.pdf',
        'PDF',
        520,
        40,
        '978-1234567895',
        24.99,
        v_category_id,
        '2024-01-10',
        4.4
      );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM ebooks WHERE title = 'Tales from the Forest') THEN
      INSERT INTO ebooks (title, author, description, cover_image_url, file_url, format, page_count, preview_pages, isbn, price, category_id, published_date, rating)
      VALUES (
        'Tales from the Forest',
        'Rebecca Green',
        'Enchanting short stories that bring the magic of nature to life for readers of all ages.',
        'https://images.pexels.com/photos/572897/pexels-photo-572897.jpeg?auto=compress&cs=tinysrgb&w=600',
        'https://example.com/ebooks/forest-tales.epub',
        'EPUB',
        190,
        15,
        '978-1234567896',
        9.99,
        v_category_id,
        '2024-02-20',
        4.2
      );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM ebooks WHERE title = 'Business Strategy Essentials') THEN
      INSERT INTO ebooks (title, author, description, cover_image_url, file_url, format, page_count, preview_pages, isbn, price, category_id, published_date, rating)
      VALUES (
        'Business Strategy Essentials',
        'Michael Chen',
        'Essential strategies and frameworks for building and scaling successful businesses.',
        'https://images.pexels.com/photos/590041/pexels-photo-590041.jpeg?auto=compress&cs=tinysrgb&w=600',
        'https://example.com/ebooks/business-strategy.pdf',
        'PDF',
        340,
        30,
        '978-1234567897',
        19.99,
        v_category_id,
        '2024-03-10',
        4.5
      );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM ebooks WHERE title = 'A Journey of Love') THEN
      INSERT INTO ebooks (title, author, description, cover_image_url, file_url, format, page_count, preview_pages, isbn, price, category_id, published_date, rating)
      VALUES (
        'A Journey of Love',
        'Amanda Rose',
        'A heartwarming contemporary romance about finding love in unexpected places.',
        'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=600',
        'https://example.com/ebooks/journey-love.epub',
        'EPUB',
        310,
        25,
        '978-1234567898',
        10.99,
        v_category_id,
        '2024-02-05',
        4.7
      );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM ebooks WHERE title = 'The Climate Crisis') THEN
      INSERT INTO ebooks (title, author, description, cover_image_url, file_url, format, page_count, preview_pages, isbn, price, category_id, published_date, rating)
      VALUES (
        'The Climate Crisis',
        'Dr. Emma Wilson',
        'A comprehensive examination of climate change, its causes, and potential solutions.',
        'https://images.pexels.com/photos/3588796/pexels-photo-3588796.jpeg?auto=compress&cs=tinysrgb&w=600',
        'https://example.com/ebooks/climate-crisis.epub',
        'EPUB',
        420,
        35,
        '978-1234567899',
        16.99,
        v_category_id,
        '2024-01-25',
        4.6
      );
    END IF;
  END IF;
END $$;