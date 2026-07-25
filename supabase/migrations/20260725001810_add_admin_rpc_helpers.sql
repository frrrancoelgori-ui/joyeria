/*
# Add helper RPC functions for the admin-api edge function

## Summary
Three server-side helpers for the admin-api edge function:
1. `hash_password_bcrypt(p_password)` — bcrypt hash via pgcrypto.
2. `verify_password_bcrypt(p_password, p_hash)` — verify password against hash.
3. `decrement_stock(p_product_id, p_qty)` — atomic stock decrement, floored at 0.

## Security
SECURITY INVOKER — runs with caller privileges. Edge function calls with the
service role key (bypasses RLS). Anon cannot use these to bypass RLS because
the underlying tables still have RLS enabled.

## Notes
- pgcrypto lives in the `extensions` schema in this project, so we reference
  `extensions.crypt` and `extensions.gen_salt` explicitly.
- Idempotent via CREATE OR REPLACE.
*/

CREATE OR REPLACE FUNCTION public.hash_password_bcrypt(p_password text)
RETURNS text
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT extensions.crypt(p_password, extensions.gen_salt('bf'::text));
$$;

CREATE OR REPLACE FUNCTION public.verify_password_bcrypt(p_password text, p_hash text)
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT p_hash = extensions.crypt(p_password, p_hash);
$$;

CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_qty integer)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE products
    SET stock = GREATEST(0, stock - p_qty)
    WHERE id = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hash_password_bcrypt(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_password_bcrypt(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO anon, authenticated;
