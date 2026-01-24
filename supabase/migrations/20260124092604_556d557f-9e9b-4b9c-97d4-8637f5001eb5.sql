-- Add columns for multi-redemption vouchers
ALTER TABLE public.vouchers
ADD COLUMN max_redemptions integer NOT NULL DEFAULT 1,
ADD COLUMN current_redemptions integer NOT NULL DEFAULT 0;

-- Create table to track individual redemptions
CREATE TABLE public.voucher_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voucher_id uuid NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  credits_received integer NOT NULL,
  redeemed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can view all redemptions"
ON public.voucher_redemptions
FOR SELECT
USING (is_admin());

CREATE POLICY "Users can view their own redemptions"
ON public.voucher_redemptions
FOR SELECT
USING (auth.uid() = user_id);

-- Update redeem_voucher function to support multi-redemption
CREATE OR REPLACE FUNCTION public.redeem_voucher(voucher_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_voucher RECORD;
  v_user_id UUID;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_is_locked BOOLEAN;
  v_already_redeemed BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Check if user is locked out
  SELECT is_voucher_redemption_locked(v_user_id) INTO v_is_locked;
  IF v_is_locked THEN
    RETURN json_build_object('success', false, 'error', 'Account locked due to too many failed attempts');
  END IF;
  
  -- Find the voucher
  SELECT * INTO v_voucher
  FROM vouchers
  WHERE code = UPPER(voucher_code)
  AND status = 'active'
  FOR UPDATE;
  
  -- If voucher not found or not active
  IF NOT FOUND THEN
    -- Log failed attempt
    INSERT INTO voucher_redemption_attempts (user_id, attempted_code)
    VALUES (v_user_id, UPPER(voucher_code));
    
    RETURN json_build_object('success', false, 'error', 'Voucher not found or not active');
  END IF;
  
  -- Check if voucher is expired
  IF v_voucher.expires_at IS NOT NULL AND v_voucher.expires_at < NOW() THEN
    -- Log failed attempt
    INSERT INTO voucher_redemption_attempts (user_id, attempted_code)
    VALUES (v_user_id, UPPER(voucher_code));
    
    RETURN json_build_object('success', false, 'error', 'Voucher expired');
  END IF;
  
  -- Check if max redemptions reached
  IF v_voucher.current_redemptions >= v_voucher.max_redemptions THEN
    INSERT INTO voucher_redemption_attempts (user_id, attempted_code)
    VALUES (v_user_id, UPPER(voucher_code));
    
    RETURN json_build_object('success', false, 'error', 'Voucher has reached maximum redemptions');
  END IF;
  
  -- Check if user already redeemed this voucher
  SELECT EXISTS(
    SELECT 1 FROM voucher_redemptions
    WHERE voucher_id = v_voucher.id AND user_id = v_user_id
  ) INTO v_already_redeemed;
  
  IF v_already_redeemed THEN
    INSERT INTO voucher_redemption_attempts (user_id, attempted_code)
    VALUES (v_user_id, UPPER(voucher_code));
    
    RETURN json_build_object('success', false, 'error', 'You have already redeemed this voucher');
  END IF;
  
  -- Get current user balance
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = v_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    v_current_balance := 0;
    INSERT INTO user_credits (user_id, balance)
    VALUES (v_user_id, 0);
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_current_balance + v_voucher.credits;
  
  -- Update user credits
  UPDATE user_credits
  SET balance = v_new_balance, updated_at = NOW()
  WHERE user_id = v_user_id;
  
  -- Record this redemption
  INSERT INTO voucher_redemptions (voucher_id, user_id, credits_received)
  VALUES (v_voucher.id, v_user_id, v_voucher.credits);
  
  -- Update voucher redemption count
  UPDATE vouchers
  SET current_redemptions = current_redemptions + 1,
      redeemed_at = NOW(),
      redeemed_by = v_user_id,
      status = CASE 
        WHEN current_redemptions + 1 >= max_redemptions THEN 'redeemed'
        ELSE 'active'
      END
  WHERE id = v_voucher.id;
  
  RETURN json_build_object(
    'success', true,
    'credits_added', v_voucher.credits,
    'new_balance', v_new_balance,
    'redemptions_remaining', v_voucher.max_redemptions - v_voucher.current_redemptions - 1
  );
END;
$function$;