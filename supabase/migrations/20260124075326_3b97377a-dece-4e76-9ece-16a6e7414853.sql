-- Create vouchers table
CREATE TABLE public.vouchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- Admin can manage vouchers
CREATE POLICY "Admins can manage vouchers"
ON public.vouchers
FOR ALL
USING (is_admin());

-- Users can view voucher by code (for redemption check)
CREATE POLICY "Users can check voucher by code"
ON public.vouchers
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create index for faster code lookup
CREATE INDEX idx_vouchers_code ON public.vouchers(code);