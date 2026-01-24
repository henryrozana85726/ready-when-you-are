-- Create image_generations table for history
CREATE TABLE public.image_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  api_key_id UUID,
  prompt TEXT NOT NULL,
  aspect_ratio TEXT,
  resolution TEXT,
  output_format TEXT DEFAULT 'png',
  model_id TEXT,
  model_name TEXT,
  server TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  output_url TEXT,
  credits_used NUMERIC NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.image_generations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own image generations" 
ON public.image_generations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create image generations" 
ON public.image_generations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all image generations" 
ON public.image_generations 
FOR SELECT 
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_image_generations_updated_at
BEFORE UPDATE ON public.image_generations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();