/*
  # Add Automatic Email Processing

  1. Changes
    - Create function to trigger email processing via edge function
    - Add trigger to automatically process emails when they're created
    - Use pg_net extension to call the edge function asynchronously

  2. Notes
    - Emails are logged in email_logs table with status 'pending'
    - The process-emails edge function is called automatically
    - Edge function processes pending emails and updates their status
*/

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to trigger email processing via edge function
CREATE OR REPLACE FUNCTION trigger_email_processing()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url text;
  v_function_url text;
  v_anon_key text;
BEGIN
  -- Get Supabase URL from environment
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  
  -- Construct edge function URL
  -- Note: In production, this will use the actual Supabase URL
  v_function_url := COALESCE(v_supabase_url, 'http://localhost:54321') || '/functions/v1/process-emails';
  
  -- Call the edge function asynchronously using pg_net
  -- This ensures email processing happens in the background
  PERFORM net.http_post(
    url := v_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If pg_net fails, just log and continue
    -- Emails can still be processed manually or via scheduled job
    RAISE WARNING 'Failed to trigger email processing: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically process emails when they're logged
DROP TRIGGER IF EXISTS trigger_process_pending_emails ON email_logs;
CREATE TRIGGER trigger_process_pending_emails
  AFTER INSERT ON email_logs
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION trigger_email_processing();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA net TO postgres, anon, authenticated, service_role;
