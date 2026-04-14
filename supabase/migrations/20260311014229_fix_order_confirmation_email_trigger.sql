/*
  # Fix Order Confirmation Email Trigger

  1. Changes
    - Update send_order_confirmation_email() function to remove reference to non-existent 'currency' field
    - Update send_order_confirmation_email() function to use 'shipping_address' instead of 'address'
    - Set default currency to 'TND' in email templates
  
  2. Security
    - Maintains existing SECURITY DEFINER for email sending
*/

-- Drop and recreate the function with correct field references
DROP FUNCTION IF EXISTS send_order_confirmation_email() CASCADE;

CREATE OR REPLACE FUNCTION send_order_confirmation_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email text;
  v_user_name text;
  v_template record;
  v_html_body text;
  v_text_body text;
  v_items_html text;
  v_items_text text;
BEGIN
  -- Get user email and name
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  SELECT full_name INTO v_user_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Get email template
  SELECT * INTO v_template
  FROM email_templates
  WHERE template_key = 'order_confirmation';

  -- Build items list (simplified)
  v_items_html := '<p>Order items will be listed here</p>';
  v_items_text := 'Order items will be listed here';

  -- Replace placeholders in HTML (using TND as default currency)
  v_html_body := v_template.html_body;
  v_html_body := replace(v_html_body, '{{customer_name}}', COALESCE(v_user_name, 'Valued Customer'));
  v_html_body := replace(v_html_body, '{{order_id}}', NEW.id::text);
  v_html_body := replace(v_html_body, '{{order_date}}', to_char(NEW.created_at, 'YYYY-MM-DD HH24:MI'));
  v_html_body := replace(v_html_body, '{{total_amount}}', NEW.total_amount::text || ' TND');
  v_html_body := replace(v_html_body, '{{payment_status}}', NEW.status);
  v_html_body := replace(v_html_body, '{{delivery_address}}', NEW.shipping_address);
  v_html_body := replace(v_html_body, '{{items_list}}', v_items_html);
  v_html_body := replace(v_html_body, '{{dashboard_url}}', 'https://hkeyet.store/orders');

  -- Replace placeholders in text (using TND as default currency)
  v_text_body := v_template.text_body;
  v_text_body := replace(v_text_body, '{{customer_name}}', COALESCE(v_user_name, 'Valued Customer'));
  v_text_body := replace(v_text_body, '{{order_id}}', NEW.id::text);
  v_text_body := replace(v_text_body, '{{order_date}}', to_char(NEW.created_at, 'YYYY-MM-DD HH24:MI'));
  v_text_body := replace(v_text_body, '{{total_amount}}', NEW.total_amount::text || ' TND');
  v_text_body := replace(v_text_body, '{{payment_status}}', NEW.status);
  v_text_body := replace(v_text_body, '{{delivery_address}}', NEW.shipping_address);
  v_text_body := replace(v_text_body, '{{items_list}}', v_items_text);
  v_text_body := replace(v_text_body, '{{dashboard_url}}', 'https://hkeyet.store/orders');

  -- Log email for later processing
  INSERT INTO email_logs (to_email, subject, template_key, status, related_id, user_id)
  VALUES (v_user_email, v_template.subject, 'order_confirmation', 'pending', NEW.id, NEW.user_id);

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_order_confirmation_email ON orders;

CREATE TRIGGER trigger_order_confirmation_email
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION send_order_confirmation_email();
