/*
  # Create Email System with Automated Notifications

  1. New Tables
    - `email_templates`
      - `id` (uuid, primary key)
      - `template_key` (text, unique) - identifier like 'order_confirmation'
      - `subject` (text) - email subject line
      - `html_body` (text) - HTML email template with placeholders
      - `text_body` (text) - plain text version
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `email_logs`
      - `id` (uuid, primary key)
      - `to_email` (text) - recipient email
      - `subject` (text) - email subject
      - `template_key` (text) - which template was used
      - `status` (text) - 'sent', 'failed', 'pending'
      - `error_message` (text) - if failed
      - `related_id` (uuid) - ID of related order/manuscript
      - `created_at` (timestamptz)

  2. Functions
    - `send_order_confirmation_email()` - trigger function for new orders
    - `send_manuscript_submission_email()` - trigger function for new manuscripts

  3. Triggers
    - Automatic order confirmation emails
    - Automatic manuscript submission emails

  4. Security
    - Enable RLS on all tables
    - Admin can view all email logs
    - Users can only view their own email logs
*/

-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  subject text NOT NULL,
  html_body text NOT NULL,
  text_body text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can read email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (true);

-- Create email logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text NOT NULL,
  template_key text,
  status text DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message text,
  related_id uuid,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Insert default email templates
INSERT INTO email_templates (template_key, subject, html_body, text_body)
VALUES 
  (
    'order_confirmation',
    'Order Confirmation - Hkeyet Store',
    '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 30px; }
    .order-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Thank You for Your Order!</h1>
    </div>
    <div class="content">
      <p>Dear {{customer_name}},</p>
      <p>We have received your order and it is being processed. Here are your order details:</p>
      
      <div class="order-details">
        <h2>Order #{{order_id}}</h2>
        <table>
          <tr>
            <td><strong>Order Date:</strong></td>
            <td>{{order_date}}</td>
          </tr>
          <tr>
            <td><strong>Total Amount:</strong></td>
            <td>{{total_amount}}</td>
          </tr>
          <tr>
            <td><strong>Payment Status:</strong></td>
            <td>{{payment_status}}</td>
          </tr>
          <tr>
            <td><strong>Delivery Address:</strong></td>
            <td>{{delivery_address}}</td>
          </tr>
        </table>
        
        <h3>Items Ordered:</h3>
        {{items_list}}
      </div>
      
      <p>You can track your order status by visiting your account dashboard.</p>
      <center>
        <a href="{{dashboard_url}}" class="button">View Order Status</a>
      </center>
    </div>
    <div class="footer">
      <p>Hkeyet Store - Your Literary Destination</p>
      <p>contact@hkeyet.store</p>
    </div>
  </div>
</body>
</html>',
    'Thank you for your order!

Order #{{order_id}}
Order Date: {{order_date}}
Total Amount: {{total_amount}}
Payment Status: {{payment_status}}

Delivery Address:
{{delivery_address}}

Items Ordered:
{{items_list}}

You can track your order at: {{dashboard_url}}

Best regards,
Hkeyet Store Team'
  ),
  (
    'manuscript_submission',
    'Manuscript Submission Received - Hkeyet Store',
    '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 30px; }
    .submission-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Manuscript Submission Received</h1>
    </div>
    <div class="content">
      <p>Dear {{author_name}},</p>
      <p>Thank you for submitting your manuscript to Hkeyet Store. We have successfully received your submission and our editorial team will review it.</p>
      
      <div class="submission-details">
        <h2>Submission Details</h2>
        <table>
          <tr>
            <td><strong>Title:</strong></td>
            <td>{{manuscript_title}}</td>
          </tr>
          <tr>
            <td><strong>Genre:</strong></td>
            <td>{{manuscript_genre}}</td>
          </tr>
          <tr>
            <td><strong>Submission Date:</strong></td>
            <td>{{submission_date}}</td>
          </tr>
          <tr>
            <td><strong>Status:</strong></td>
            <td>Under Review</td>
          </tr>
        </table>
      </div>
      
      <p><strong>What happens next?</strong></p>
      <ul>
        <li>Our editorial team will review your manuscript within 2-4 weeks</li>
        <li>You will receive updates via email as the review progresses</li>
        <li>You can check the status anytime in your dashboard</li>
      </ul>
      
      <p>We appreciate your patience and look forward to reading your work!</p>
    </div>
    <div class="footer">
      <p>Hkeyet Store - Supporting Authors Worldwide</p>
      <p>contact@hkeyet.store</p>
    </div>
  </div>
</body>
</html>',
    'Dear {{author_name}},

Thank you for submitting your manuscript to Hkeyet Store.

Submission Details:
Title: {{manuscript_title}}
Genre: {{manuscript_genre}}
Submission Date: {{submission_date}}
Status: Under Review

What happens next?
- Our editorial team will review your manuscript within 2-4 weeks
- You will receive updates via email
- You can check the status in your dashboard

Best regards,
Hkeyet Store Editorial Team'
  )
ON CONFLICT (template_key) DO UPDATE
SET 
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  updated_at = now();

-- Function to send order confirmation email
CREATE OR REPLACE FUNCTION send_order_confirmation_email()
RETURNS TRIGGER AS $$
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
  
  -- Build items list (simplified - you can enhance this)
  v_items_html := '<p>Order items will be listed here</p>';
  v_items_text := 'Order items will be listed here';
  
  -- Replace placeholders in HTML
  v_html_body := v_template.html_body;
  v_html_body := replace(v_html_body, '{{customer_name}}', COALESCE(v_user_name, 'Valued Customer'));
  v_html_body := replace(v_html_body, '{{order_id}}', NEW.id::text);
  v_html_body := replace(v_html_body, '{{order_date}}', to_char(NEW.created_at, 'YYYY-MM-DD HH24:MI'));
  v_html_body := replace(v_html_body, '{{total_amount}}', NEW.total_amount::text || ' ' || NEW.currency);
  v_html_body := replace(v_html_body, '{{payment_status}}', NEW.status);
  v_html_body := replace(v_html_body, '{{delivery_address}}', NEW.address);
  v_html_body := replace(v_html_body, '{{items_list}}', v_items_html);
  v_html_body := replace(v_html_body, '{{dashboard_url}}', 'https://hkeyet.store/orders');
  
  -- Replace placeholders in text
  v_text_body := v_template.text_body;
  v_text_body := replace(v_text_body, '{{customer_name}}', COALESCE(v_user_name, 'Valued Customer'));
  v_text_body := replace(v_text_body, '{{order_id}}', NEW.id::text);
  v_text_body := replace(v_text_body, '{{order_date}}', to_char(NEW.created_at, 'YYYY-MM-DD HH24:MI'));
  v_text_body := replace(v_text_body, '{{total_amount}}', NEW.total_amount::text || ' ' || NEW.currency);
  v_text_body := replace(v_text_body, '{{payment_status}}', NEW.status);
  v_text_body := replace(v_text_body, '{{delivery_address}}', NEW.address);
  v_text_body := replace(v_text_body, '{{items_list}}', v_items_text);
  v_text_body := replace(v_text_body, '{{dashboard_url}}', 'https://hkeyet.store/orders');
  
  -- Call the edge function to send email (using pg_net or store for later processing)
  INSERT INTO email_logs (to_email, subject, template_key, status, related_id, user_id)
  VALUES (v_user_email, v_template.subject, 'order_confirmation', 'pending', NEW.id, NEW.user_id);
  
  -- Note: Actual email sending will be handled by a separate process that reads from email_logs
  -- For now, we'll use Supabase's pg_net extension or a scheduled function
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send manuscript submission email
CREATE OR REPLACE FUNCTION send_manuscript_submission_email()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email text;
  v_author_name text;
  v_template record;
BEGIN
  -- Get user email and name
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = NEW.author_id;
  
  SELECT full_name INTO v_author_name
  FROM profiles
  WHERE id = NEW.author_id;
  
  -- Get email template
  SELECT * INTO v_template
  FROM email_templates
  WHERE template_key = 'manuscript_submission';
  
  -- Log email for sending
  INSERT INTO email_logs (to_email, subject, template_key, status, related_id, user_id)
  VALUES (v_user_email, v_template.subject, 'manuscript_submission', 'pending', NEW.id, NEW.author_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_order_confirmation_email ON orders;
CREATE TRIGGER trigger_order_confirmation_email
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION send_order_confirmation_email();

DROP TRIGGER IF EXISTS trigger_manuscript_submission_email ON manuscripts;
CREATE TRIGGER trigger_manuscript_submission_email
  AFTER INSERT ON manuscripts
  FOR EACH ROW
  EXECUTE FUNCTION send_manuscript_submission_email();

-- Create index for faster email log queries
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id, created_at DESC);
