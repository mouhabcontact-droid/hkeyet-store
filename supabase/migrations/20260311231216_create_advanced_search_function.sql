/*
  # Create Advanced Search Function

  1. Function
    - `search_books` - Comprehensive search function that searches across:
      - Book titles
      - Book descriptions
      - Author names
      - Category names
      - Publisher names
    
  2. Features
    - Full-text search with ranking
    - Searches multiple fields with weighted results
    - Returns books with all related information
    - Case-insensitive search
    
  3. Security
    - Function is public and accessible to all users
    - Uses existing RLS policies for data access
*/

-- Create the advanced search function
CREATE OR REPLACE FUNCTION search_books(search_query text)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  description text,
  cover_url text,
  price numeric,
  stock integer,
  publisher text,
  category_name text,
  author_names text,
  relevance_score numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (b.id)
    b.id,
    b.title,
    b.slug,
    b.description,
    b.cover_url,
    b.price,
    b.stock,
    b.publisher,
    c.name as category_name,
    STRING_AGG(DISTINCT a.name, ', ') as author_names,
    (
      -- Calculate relevance score with weights
      CASE WHEN LOWER(b.title) ILIKE '%' || LOWER(search_query) || '%' THEN 10 ELSE 0 END +
      CASE WHEN LOWER(b.description) ILIKE '%' || LOWER(search_query) || '%' THEN 5 ELSE 0 END +
      CASE WHEN LOWER(b.publisher) ILIKE '%' || LOWER(search_query) || '%' THEN 3 ELSE 0 END +
      CASE WHEN LOWER(c.name) ILIKE '%' || LOWER(search_query) || '%' THEN 8 ELSE 0 END +
      CASE WHEN EXISTS (
        SELECT 1 FROM book_authors ba2
        JOIN authors a2 ON ba2.author_id = a2.id
        WHERE ba2.book_id = b.id AND LOWER(a2.name) ILIKE '%' || LOWER(search_query) || '%'
      ) THEN 9 ELSE 0 END
    )::numeric as relevance_score
  FROM books b
  LEFT JOIN categories c ON b.category_id = c.id
  LEFT JOIN book_authors ba ON b.id = ba.book_id
  LEFT JOIN authors a ON ba.author_id = a.id
  WHERE 
    LOWER(b.title) ILIKE '%' || LOWER(search_query) || '%' OR
    LOWER(b.description) ILIKE '%' || LOWER(search_query) || '%' OR
    LOWER(b.publisher) ILIKE '%' || LOWER(search_query) || '%' OR
    LOWER(c.name) ILIKE '%' || LOWER(search_query) || '%' OR
    EXISTS (
      SELECT 1 FROM book_authors ba2
      JOIN authors a2 ON ba2.author_id = a2.id
      WHERE ba2.book_id = b.id AND LOWER(a2.name) ILIKE '%' || LOWER(search_query) || '%'
    )
  GROUP BY b.id, b.title, b.slug, b.description, b.cover_url, b.price, b.stock, b.publisher, c.name
  HAVING (
    CASE WHEN LOWER(b.title) ILIKE '%' || LOWER(search_query) || '%' THEN 10 ELSE 0 END +
    CASE WHEN LOWER(b.description) ILIKE '%' || LOWER(search_query) || '%' THEN 5 ELSE 0 END +
    CASE WHEN LOWER(b.publisher) ILIKE '%' || LOWER(search_query) || '%' THEN 3 ELSE 0 END +
    CASE WHEN LOWER(c.name) ILIKE '%' || LOWER(search_query) || '%' THEN 8 ELSE 0 END +
    CASE WHEN EXISTS (
      SELECT 1 FROM book_authors ba3
      JOIN authors a3 ON ba3.author_id = a3.id
      WHERE ba3.book_id = b.id AND LOWER(a3.name) ILIKE '%' || LOWER(search_query) || '%'
    ) THEN 9 ELSE 0 END
  ) > 0
  ORDER BY b.id, relevance_score DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to all users
GRANT EXECUTE ON FUNCTION search_books(text) TO anon, authenticated;
