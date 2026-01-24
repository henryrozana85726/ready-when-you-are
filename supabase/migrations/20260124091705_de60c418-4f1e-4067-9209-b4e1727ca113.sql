-- Create a secure function to redeem voucher that handles both credit update and voucher status
CREATE OR REPLACE FUNCTION public.redeem_voucher(voucher_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_voucher RECORD;
  v_user_id UUID;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_is_locked BOOLEAN;
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
  
  -- Get current user balance
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = v_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    v_current_balance := 0;
    -- Create user_credits row if doesn't exist
    INSERT INTO user_credits (user_id, balance)
    VALUES (v_user_id, 0);
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_current_balance + v_voucher.credits;
  
  -- Update user credits
  UPDATE user_credits
  SET balance = v_new_balance, updated_at = NOW()
  WHERE user_id = v_user_id;
  
  -- Update voucher status
  UPDATE vouchers
  SET status = 'redeemed',
      redeemed_by = v_user_id,
      redeemed_at = NOW()
  WHERE id = v_voucher.id;
  
  RETURN json_build_object(
    'success', true,
    'credits_added', v_voucher.credits,
    'new_balance', v_new_balance
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.redeem_voucher(TEXT) TO authenticated;

-- Also need to allow users to update their own credits via this function
-- Add RLS policy for user_credits update by the user themselves
CREATE POLICY "Users can update their own credits"
ON public.user_credits
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);