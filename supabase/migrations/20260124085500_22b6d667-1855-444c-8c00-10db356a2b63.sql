-- Add status and redemption tracking to vouchers table
ALTER TABLE public.vouchers 
ADD COLUMN status text NOT NULL DEFAULT 'active',
ADD COLUMN redeemed_by uuid REFERENCES auth.users(id),
ADD COLUMN redeemed_at timestamp with time zone;

-- Create table to track failed voucher redemption attempts
CREATE TABLE public.voucher_redemption_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  attempted_code text NOT NULL,
  attempted_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voucher_redemption_attempts ENABLE ROW LEVEL SECURITY;

-- Users can insert their own attempts
CREATE POLICY "Users can log their own attempts"
ON public.voucher_redemption_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own attempts (to check if locked)
CREATE POLICY "Users can view their own attempts"
ON public.voucher_redemption_attempts
FOR SELECT
USING (auth.uid() = user_id);

-- Create function to check if user is locked out from voucher redemption
CREATE OR REPLACE FUNCTION public.is_voucher_redemption_locked(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*) >= 3
  FROM public.voucher_redemption_attempts
  WHERE user_id = check_user_id
  AND attempted_at > (now() - interval '1 hour')
$$;

-- Create function to get lock remaining time in minutes
CREATE OR REPLACE FUNCTION public.get_voucher_lock_remaining_minutes(check_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT GREATEST(0, 
    EXTRACT(EPOCH FROM (
      (SELECT MIN(attempted_at) FROM (
        SELECT attempted_at 
        FROM public.voucher_redemption_attempts
        WHERE user_id = check_user_id
        AND attempted_at > (now() - interval '1 hour')
        ORDER BY attempted_at DESC
        LIMIT 3
      ) sub) + interval '1 hour' - now()
    )) / 60
  )::integer
$$;