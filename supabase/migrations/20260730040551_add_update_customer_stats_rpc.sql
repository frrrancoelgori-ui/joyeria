/*
# Add update_customer_stats RPC function

## Summary
Creates a stored procedure that recalculates a customer's total_purchases
and total_spent from the sales table whenever a sale is recorded with that
customer assigned.

## New Functions
- `update_customer_stats(p_customer_id uuid)` — counts completed sales
  for the given customer and updates their stats columns.

## Security
- SECURITY DEFINER so the edge function (service role) can call it.
- No RLS needed on functions; granted to anon + authenticated for read access.
*/

CREATE OR REPLACE FUNCTION update_customer_stats(p_customer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION update_customer_stats TO anon, authenticated;
