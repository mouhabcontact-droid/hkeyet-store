/*
  # Fix Manuscript Email Function to Use user_id

  1. Changes
    - Update send_manuscript_submission_email function to use NEW.user_id instead of NEW.author_id
    - The manuscripts table uses user_id column, not author_id

  2. Notes
    - This fixes the "record 'new' has no field 'author_id'" error
*/

CREATE OR REPLACE FUNCTION send_manuscript_submission_email()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_email text;
  v_author_name text;
  v_template record;
BEGIN
  -- Get user email and name
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  SELECT full_name INTO v_author_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Get email template
  SELECT * INTO v_template
  FROM email_templates
  WHERE template_key = 'manuscript_submission';

  -- Log email for sending
  INSERT INTO email_logs (to_email, subject, template_key, status, related_id, user_id)
  VALUES (v_user_email, v_template.subject, 'manuscript_submission', 'pending', NEW.id, NEW.user_id);

  RETURN NEW;
END;
$$;