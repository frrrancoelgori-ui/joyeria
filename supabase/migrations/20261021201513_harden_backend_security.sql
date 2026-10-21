/*
# Harden Backend Security: Least-Privilege Grants, Function Fixes, Login Cleanup

## Summary

This migration tightens database access control to follow the principle of
least privilege, fixes two flagged database functions, and adds a retention
function for login attempt cleanup.

## Changes

### 1. Revoke excessive grants on all tables

Previously, every table granted INSERT, UPDATE, DELETE to both `anon` and
`authenticated` roles. The storefront only needs SELECT on public tables. All
writes go through the edge function using the service role key, which bypasses
RLS. Keeping write grants on anon/authenticated is unnecessary and dangerous.

We revoke ALL privileges from `anon` and `authenticated` on all tables, then
re-grant SELECT only on the storefront-readable tables.

### 2. Revoke SELECT on sensitive tables from anon (GraphQL exposure)

`admin_users`, `audit_logs`, `inventory_movements`, `login_attempts` should not
be visible in the GraphQL schema to anonymous users. After revoking ALL, we do
NOT re-grant SELECT on these to anon.

### 3. Fix `update_customer_stats` function

- Add `SET search_path = public, pg_temp` (advisor flagged mutable search_path).
- Revoke EXECUTE from `anon` and `authenticated` (SECURITY DEFINER, should only
  be called by the service-role edge function).

### 4. Replace `decrement_stock` with stock-checking version

The existing `decrement_stock` blindly floors stock at 0, allowing overselling.
We DROP and recreate it with a version that checks stock first and returns
boolean indicating success. The edge function uses this to reject sales when
stock is insufficient.

### 5. Add `cleanup_login_attempts` function

Deletes login attempts older than 24 hours. SECURITY DEFINER, EXECUTE revoked
from anon/authenticated.

## Security
- All write privileges removed from `anon` and `authenticated`.
- SELECT removed from `anon` on sensitive tables.
- `update_customer_stats` and `cleanup_login_attempts` not callable by
  anon/authenticated.
- `decrement_stock` now returns boolean and refuses to go negative.

## Important Notes
1. Idempotent: all statements use IF EXISTS / OR REPLACE.
2. No data is modified or deleted.
3. The service role (used by the edge function) is unaffected by grant changes.
*/

-- ============================================================
-- 1. Revoke ALL privileges from anon and authenticated on all tables
-- ============================================================

REVOKE ALL ON public.admin_users FROM anon;
REVOKE ALL ON public.audit_logs FROM anon;
REVOKE ALL ON public.branches FROM anon;
REVOKE ALL ON public.customers FROM anon;
REVOKE ALL ON public.inventory_movements FROM anon;
REVOKE ALL ON public.login_attempts FROM anon;
REVOKE ALL ON public.products FROM anon;
REVOKE ALL ON public.sale_items FROM anon;
REVOKE ALL ON public.sales FROM anon;
REVOKE ALL ON public.store_settings FROM anon;

REVOKE ALL ON public.admin_users FROM authenticated;
REVOKE ALL ON public.audit_logs FROM authenticated;
REVOKE ALL ON public.branches FROM authenticated;
REVOKE ALL ON public.customers FROM authenticated;
REVOKE ALL ON public.inventory_movements FROM authenticated;
REVOKE ALL ON public.login_attempts FROM authenticated;
REVOKE ALL ON public.products FROM authenticated;
REVOKE ALL ON public.sale_items FROM authenticated;
REVOKE ALL ON public.sales FROM authenticated;
REVOKE ALL ON public.store_settings FROM authenticated;

-- Re-grant SELECT only on storefront tables that need anon read access
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.branches TO anon, authenticated;
GRANT SELECT ON public.sales TO anon, authenticated;
GRANT SELECT ON public.sale_items TO anon, authenticated;
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT SELECT ON public.customers TO anon, authenticated;

-- admin_users: authenticated needs SELECT for the "view own profile" RLS policy
GRANT SELECT ON public.admin_users TO authenticated;

-- ============================================================
-- 2. Fix update_customer_stats: immutable search_path + revoke EXECUTE
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_customer_stats(p_customer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE customers SET
    total_purchases = (
      SELECT COUNT(*) FROM sales
      WHERE sales.customer_id = p_customer_id
        AND sales.status IN ('completed', 'pending')
    ),
    total_spent = COALESCE((
      SELECT SUM(total_amount) FROM sales
      WHERE sales.customer_id = p_customer_id
        AND sales.status IN ('completed', 'pending')
    ), 0),
    updated_at = now()
  WHERE id = p_customer_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_customer_stats(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_customer_stats(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_customer_stats(uuid) FROM authenticated;

-- ============================================================
-- 3. Replace decrement_stock with stock-checking version (return boolean)
-- ============================================================

DROP FUNCTION IF EXISTS public.decrement_stock(uuid, integer);

CREATE FUNCTION public.decrement_stock(p_product_id uuid, p_qty integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_stock integer;
BEGIN
  SELECT stock INTO current_stock FROM products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  IF current_stock < p_qty THEN
    RETURN false;
  END IF;
  UPDATE products SET stock = current_stock - p_qty WHERE id = p_product_id;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO anon, authenticated;

-- ============================================================
-- 4. Add cleanup_login_attempts function
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM login_attempts WHERE created_at < now() - interval '24 hours';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_login_attempts() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_login_attempts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_login_attempts() FROM authenticated;
