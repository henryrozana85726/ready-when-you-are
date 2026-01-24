-- Add expires_at column to vouchers table
ALTER TABLE public.vouchers 
ADD COLUMN expires_at timestamp with time zone;