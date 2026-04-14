/*
  # Setup Automatic Email Processing with pg_net

  1. Changes
    - Create a function to invoke the process-emails edge function using pg_net
    - Update the cron job to use pg_net for HTTP requests
    - This enables automatic email processing every minute

  2. Notes
    - Uses pg_net extension for HTTP calls from database
    - Calls the process-emails edge function automatically
    - Runs every minute via pg_cron
*/

-- Drop the old function if exists
DROP FUNCTION IF EXISTS invoke_process_emails();

-- Create a function to call the process-emails edge function using pg_net
CREATE OR REPLACE FUNCTION invoke_process_emails()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_function_url text;
  v_request_id bigint;
BEGIN
  -- Construct the edge function URL
  -- Note: In production, this will use the actual Supabase project URL
  v_function_url := current_setting('app.settings.api_url', true) || '/functions/v1/process-emails';
  
  -- Make async HTTP POST request using pg_net
  SELECT INTO v_request_id net.http_post(
    url := v_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  
  -- Log the attempt
  RAISE LOG 'Email processing triggered with request_id: %', v_request_id;
  
EXCEPTION WHEN OTHERS THEN
  -- Log errors but don't fail
  RAISE LOG 'Error triggering email processing: %', SQLERRM;
END;
$$;

-- Update or create the cron schedule
-- First, try to unschedule if it exists
SELECT cron.unschedule('process-pending-emails') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-pending-emails'
);

-- Schedule the job to run every minute
SELECT cron.schedule(
  'process-pending-emails',
  '* * * * *',
  'SELECT invoke_process_emails();'
);