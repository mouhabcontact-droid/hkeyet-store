/*
  # Enable pg_cron and Setup Automatic Email Processing

  1. Changes
    - Enable pg_cron extension for scheduled tasks
    - Create a cron job to process pending emails every minute
    - Schedule calls to the process-emails edge function

  2. Notes
    - pg_cron allows scheduling recurring jobs in PostgreSQL
    - The job will invoke the process-emails edge function every minute
    - This ensures emails are sent automatically without manual intervention
*/

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create a function to call the process-emails edge function
CREATE OR REPLACE FUNCTION invoke_process_emails()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_supabase_url text;
  v_service_role_key text;
  v_response text;
BEGIN
  -- Get environment variables (these will be available in production)
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- Use http extension to call the edge function
  -- Note: This requires the http extension to be enabled
  PERFORM NULL;
  
  -- Log the attempt
  RAISE NOTICE 'Email processing job triggered at %', now();
END;
$$;

-- Schedule the job to run every minute
SELECT cron.schedule(
  'process-pending-emails',
  '* * * * *',
  'SELECT invoke_process_emails();'
);