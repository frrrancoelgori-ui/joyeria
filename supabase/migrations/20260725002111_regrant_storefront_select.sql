/*
# Re-grant SELECT on storefront tables to anon/authenticated

## Summary
The earlier security migration (fix_security_issues) revoked blanket SELECT
grants from anon/authenticated on all 8 tables to fix GraphQL schema
visibility. However, RLS policies require the underlying table-level GRANT
to function — a policy only filters rows the role already has permission to
see. Without the GRANT, the anon-key frontend gets "permission denied" even
though the RLS SELECT policy exists.

This migration re-grants SELECT on the four storefront-readable tables
(products, branches, sales, sale_items) to anon and authenticated. RLS
policies (added in the secure_admin_auth_and_persistence migration) still
control which rows are returned — the grant only allows the query to run.

## Security
- admin_users, audit_logs, inventory_movements, login_attempts remain
  WITHOUT anon SELECT grants — the storefront never reads them directly.
- RLS policies on products/branches/sales/sale_items still filter rows.
- Writes remain service-role-only (via the admin-api edge function).

## Important Notes
- Idempotent: GRANT is safe to re-run.
- No data is modified.
*/

GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.branches TO anon, authenticated;
GRANT SELECT ON public.sales TO anon, authenticated;
GRANT SELECT ON public.sale_items TO anon, authenticated;
