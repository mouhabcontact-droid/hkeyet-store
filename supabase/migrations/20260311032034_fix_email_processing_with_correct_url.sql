/*
  # Fix Email Processing with Correct Supabase URL

  1. Changes
    - Update invoke_process_emails function to use the correct Supabase project URL
    - Use the actual project URL from the environment

  2. Notes
    - Uses the correct Supabase project URL for HTTP requests
    - Enables automatic email processing via cron job
*/

-- Drop and recreate the function with the correct URL
DROP FUNCTION IF EXISTS invoke_process_emails();

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
  -- Use the actual Supabase project URL
  v_function_url := 'https://jeauxmdkeyvfgrwurudz.supabase.co/functions/v1/process-emails';
  
  -- Make async HTTP POST request using pg_net
  SELECT INTO v_request_id net.http_post(
    url := v_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  
  RAISE LOG 'Email processing triggered with request_id: %', v_request_id;
  
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error triggering email processing: %', SQLERRM;
END;
$$;