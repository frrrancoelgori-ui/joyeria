/*
# Customers table + sales/product enhancements

## Summary
1. Creates a `customers` table for the client portfolio (cartera de clientes).
2. Adds `sale_number` (auto-incrementing) and `status` to the `sales` table.
3. Adds `status` column to `products` so jewels can be marked as
   available/sold/reserved.
4. Adds `additional_images` (text[]) to `products` so multiple photos can be
   pasted from Drive, Pexels, Google, Terabox, etc.

## New Tables
- `customers`
  - id (uuid PK)
  - full_name (text, not null)
  - phone (text)
  - email (text)
  - address (text)
  - city (text)
  - notes (text)
  - total_purchases (int, default 0)
  - total_spent (numeric, default 0)
  - created_at, updated_at (timestamptz)

## Modified Tables
- `sales` — adds `sale_number` (serial, unique) and `status` (text, default 'completed')
- `products` — adds `status` (text, default 'available') and `additional_images` (text[])

## Security
- RLS enabled on `customers`. anon + authenticated can SELECT (storefront reads).
- Only the service-role edge function can INSERT/UPDATE/DELETE (admin writes).
- No anon INSERT/UPDATE/DELETE policies on customers.

## Important Notes
- Idempotent: uses DO $$ blocks for conditional column additions.
- sale_number starts at 1000 for a professional look.
- product status values: 'available', 'sold', 'reserved'.
- sale status values: 'completed', 'pending', 'cancelled', 'refunded'.
*/

-- ============================================================
-- 1. CUSTOMERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text,
  email text,
  address text,
  city text,
  notes text,
  total_purchases integer NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_customers" ON customers;
CREATE POLICY "anon_read_customers" ON customers FOR SELECT
  TO anon, authenticated USING (true);

GRANT SELECT ON public.customers TO anon, authenticated;

-- ============================================================
-- 2. SALES ENHANCEMENTS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'sale_number'
  ) THEN
    CREATE SEQUENCE IF NOT EXISTS sale_number_seq START 1000;
    ALTER TABLE sales ADD COLUMN sale_number integer DEFAULT nextval('sale_number_seq') UNIQUE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'status'
  ) THEN
    ALTER TABLE sales ADD COLUMN status text NOT NULL DEFAULT 'completed'
      CHECK (status IN ('completed', 'pending', 'cancelled', 'refunded'));
  END IF;
END $$;

-- Add customer_id FK if not already present (column exists but may lack FK)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sales_customer_id_fkey'
  ) THEN
    ALTER TABLE sales ADD CONSTRAINT sales_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 3. PRODUCTS ENHANCEMENTS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'status'
  ) THEN
    ALTER TABLE products ADD COLUMN status text NOT NULL DEFAULT 'available'
      CHECK (status IN ('available', 'sold', 'reserved'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'additional_images'
  ) THEN
    ALTER TABLE products ADD COLUMN additional_images text[] DEFAULT '{}';
  END IF;
END $$;

-- Grant anon SELECT on the new product columns (already has table-level SELECT)
-- No additional grants needed; column-level SELECT is covered by table-level.
