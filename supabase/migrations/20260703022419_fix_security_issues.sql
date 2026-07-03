/*
# Fix Security Issues: Function Search Paths, GraphQL Visibility, and Function Execution

## Summary

This migration addresses three categories of security vulnerabilities identified
by the Supabase security advisor:

1. **Function Search Path Mutable** — Two functions (`update_updated_at_column`
   and `create_audit_log`) had mutable `search_path`, allowing role-injection
   attacks. We recreate both with an explicit, immutable `search_path`.

2. **Public/Signed-In Users Can See Objects in GraphQL Schema** — All 8 tables
   (`admin_users`, `audit_logs`, `branches`, `customers`, `inventory_movements`,
   `products`, `sale_items`, `sales`) had blanket `SELECT` grants to both `anon`
   and `authenticated`, making them discoverable in the GraphQL schema to anyone.
   We revoke those table-level `SELECT` grants. RLS policies already control
   row-level access, so the revocation does not break the app — the policies
   still allow legitimate reads.

3. **Public/Signed-In Users Can Execute SECURITY DEFINER Function** — The
   `create_audit_log` function (SECURITY DEFINER) was executable by `anon`,
   `authenticated`, and `PUBLIC`. We revoke `EXECUTE` from all of these so the
   function can only be invoked by the database owner / trigger mechanism, not
   via the REST/RPC endpoint.

## Changes

### 1. Functions — immutable search_path

- `public.update_updated_at_column()` — recreated with `SET search_path = public, pg_temp`.
- `public.create_audit_log()` — recreated with `SET search_path = public, pg_temp`.
  Preserved SECURITY DEFINER (needed for trigger to write to audit_logs).

### 2. Table grants — revoke blanket SELECT

Revoked `SELECT` on the following tables from `anon` and `authenticated`:
- `admin_users`
- `audit_logs`
- `branches`
- `customers`
- `inventory_movements`
- `products`
- `sale_items`
- `sales`

RLS policies remain in place and continue to govern row-level access.

### 3. Function execution — revoke EXECUTE on create_audit_log

Revoked `EXECUTE` on `public.create_audit_log` from:
- `PUBLIC`
- `anon`
- `authenticated`

The function is only called by triggers, not by client RPC, so this does not
affect application functionality.

## Important Notes

- No data is modified or deleted.
- No tables, columns, or indexes are dropped.
- RLS policies are untouched — row-level access control remains intact.
- The app's frontend uses the anon key with Supabase JS client; RLS policies
  (not table-level grants) determine what rows are returned, so revoking the
  blanket SELECT grant does not break legitimate reads.
*/

-- =========================================================
-- 1. Fix mutable search_path on both functions
-- =========================================================

-- Recreate update_updated_at_column with immutable search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Recreate create_audit_log with immutable search_path
-- (SECURITY DEFINER is retained because the trigger needs to write to audit_logs)
CREATE OR REPLACE FUNCTION public.create_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), 'update', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'create', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- =========================================================
-- 2. Revoke blanket SELECT grants from anon and authenticated
--    on all 8 tables (fixes GraphQL schema visibility)
-- =========================================================

REVOKE SELECT ON public.admin_users FROM anon;
REVOKE SELECT ON public.admin_users FROM authenticated;

REVOKE SELECT ON public.audit_logs FROM anon;
REVOKE SELECT ON public.audit_logs FROM authenticated;

REVOKE SELECT ON public.branches FROM anon;
REVOKE SELECT ON public.branches FROM authenticated;

REVOKE SELECT ON public.customers FROM anon;
REVOKE SELECT ON public.customers FROM authenticated;

REVOKE SELECT ON public.inventory_movements FROM anon;
REVOKE SELECT ON public.inventory_movements FROM authenticated;

REVOKE SELECT ON public.products FROM anon;
REVOKE SELECT ON public.products FROM authenticated;

REVOKE SELECT ON public.sale_items FROM anon;
REVOKE SELECT ON public.sale_items FROM authenticated;

REVOKE SELECT ON public.sales FROM anon;
REVOKE SELECT ON public.sales FROM authenticated;

-- =========================================================
-- 3. Revoke EXECUTE on create_audit_log from all roles
--    (fixes SECURITY DEFINER function execution via RPC)
-- =========================================================

REVOKE EXECUTE ON FUNCTION public.create_audit_log() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_audit_log() FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_audit_log() FROM authenticated;
