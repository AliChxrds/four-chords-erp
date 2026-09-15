BEGIN;

-- Allow customers to be created without an email address
ALTER TABLE customers
ALTER COLUMN email DROP NOT NULL;

-- Correct the default customer type
ALTER TABLE customers
ALTER COLUMN customer_type
SET DEFAULT 'individual';

COMMIT;