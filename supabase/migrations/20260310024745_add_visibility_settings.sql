/*
  # Add Visibility Settings for Ebooks and Payment Methods

  1. New Settings
    - `show_ebooks_section` (boolean) - Show/hide ebooks navigation and section
    - `show_visa_logo` (boolean) - Show/hide Visa logo in payment methods
    - `show_paypal_logo` (boolean) - Show/hide PayPal logo in payment methods

  2. Changes
    - Adds new visibility settings to site_settings table
    - Default values: all set to true (visible)
*/

-- Add visibility settings
INSERT INTO site_settings (key, value, type, description) VALUES
  ('show_ebooks_section', 'true', 'boolean', 'Show or hide the ebooks section in navigation and homepage'),
  ('show_visa_logo', 'true', 'boolean', 'Show or hide Visa payment logo'),
  ('show_paypal_logo', 'true', 'boolean', 'Show or hide PayPal payment logo')
ON CONFLICT (key) DO NOTHING;