/*
  # Add Phone Number and Order Status to Orders Table
  
  ## Overview
  Enhances the orders table to support phone numbers and order status tracking.
  
  ## Changes Made
  
  ### Modified Tables
  - `orders`
    - Added `phone` column (text, required) - Customer phone number for order contact
    - Added `status` column (text, default 'pending') - Order status tracking
    - Added `notes` column (text, optional) - Admin notes for orders
  
  ## Status Values
  - pending: Order placed, awaiting processing
  - processing: Order is being prepared
  - shipped: Order has been shipped
  - delivered: Order delivered to customer
  - cancelled: Order cancelled
  
  ## Important Notes
  - Phone number is mandatory for all new orders
  - Status defaults to 'pending' for new orders
  - Existing orders without phone will need to be updated
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'phone'
  ) THEN
    ALTER TABLE orders ADD COLUMN phone text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'status'
  ) THEN
    ALTER TABLE orders ADD COLUMN status text NOT NULL DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'notes'
  ) THEN
    ALTER TABLE orders ADD COLUMN notes text;
  END IF;
END $$;