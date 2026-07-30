/*
# Store settings table

## Summary
Single-row configuration table for store-wide settings: store name, WhatsApp
number, and logo/photo URL. The admin edits these from the Settings page;
the storefront reads them to display the store name and WhatsApp links
dynamically instead of hardcoding "Diamante Real" and a phone number.

## New Tables
- `store_settings` — one row (enforced), keyed by id=1.
  - `store_name` text — display name shown in header, footer, login, etc.
  - `whatsapp_number` text — phone number for WhatsApp links (digits only or +prefix).
  - `logo_url` text — optional logo/store photo URL.
  - `updated_at` timestamptz.

## Security
- RLS enabled. anon + authenticated can SELECT (storefront needs to read).
- Only the service-role edge function can UPDATE (admin writes via /settings).
- No anon INSERT/UPDATE/DELETE policies.

## Important Notes
- Idempotent: seeds the default row only if it doesn't exist.
- Default values match the current hardcoded values so nothing changes
  visually until the admin edits them.
*/

CREATE TABLE IF NOT EXISTS store_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name text NOT NULL DEFAULT 'Diamante Real',
  whatsapp_number text NOT NULL DEFAULT '56941228089',
  logo_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_store_settings" ON store_settings;
CREATE POLICY "anon_read_store_settings" ON store_settings FOR SELECT
  TO anon, authenticated USING (true);

GRANT SELECT ON public.store_settings TO anon, authenticated;

-- Seed default row if not present
INSERT INTO store_settings (id, store_name, whatsapp_number, logo_url)
VALUES (1, 'Diamante Real', '56941228089', NULL)
ON CONFLICT (id) DO NOTHING;
