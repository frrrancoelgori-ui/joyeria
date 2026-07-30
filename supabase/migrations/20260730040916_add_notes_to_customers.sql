/*
# Add notes column to existing customers table

## Summary
The customers table already existed from a prior migration but was missing
the `notes` column. This adds it idempotently.

## Modified Tables
- `customers` — adds `notes` (text, nullable)
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'notes'
  ) THEN
    ALTER TABLE customers ADD COLUMN notes text;
  END IF;
END $$;
