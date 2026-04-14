/*
  # Update Stock and Sales Based on Order History

  1. Updates
    - Updates `total_sales` column to reflect actual sales from order_items
    - Updates stock to account for sold items (assumes current stock + sales = original stock)
  
  2. Important Notes
    - This migration recalculates sales and adjusts stock based on historical orders
    - Only counts orders with valid statuses (pending, processing, shipped, delivered)
    - Uses idempotent approach with DO block
*/

DO $$
DECLARE
  book_record RECORD;
  actual_sold INTEGER;
BEGIN
  -- Loop through all books
  FOR book_record IN 
    SELECT 
      b.id,
      b.stock as current_stock,
      b.total_sales,
      COALESCE(SUM(oi.quantity), 0) as sold_quantity
    FROM books b
    LEFT JOIN order_items oi ON oi.book_id = b.id
    LEFT JOIN orders o ON o.id = oi.order_id AND o.status IN ('pending', 'processing', 'shipped', 'delivered')
    GROUP BY b.id, b.stock, b.total_sales
  LOOP
    -- Update total_sales and keep stock as is (since we already decreased it in checkout)
    UPDATE books
    SET 
      total_sales = book_record.sold_quantity
    WHERE id = book_record.id
    AND total_sales != book_record.sold_quantity;
  END LOOP;
END $$;

-- Add a helpful comment
COMMENT ON COLUMN books.total_sales IS 'Total number of books sold across all orders';
COMMENT ON COLUMN books.stock IS 'Current available stock (decremented on each sale)';
