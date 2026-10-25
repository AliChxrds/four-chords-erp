-- Initialize from existing generated codes without ever lowering the counter.
INSERT INTO public.customer_code_counter (id, last_number)
SELECT 1, COALESCE(MAX(SUBSTRING(customer_code FROM 5)::integer), 0)
FROM public.customers
WHERE customer_code ~ '^CUS-[0-9]+$'
ON CONFLICT (id) DO UPDATE
SET last_number = GREATEST(customer_code_counter.last_number, EXCLUDED.last_number);
