-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'premium', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create profiles table for user info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_credits table
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create api_keys table (admin manages these)
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('fal_ai', 'gmicloud')),
  name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  credits DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create video_models table
CREATE TABLE public.video_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server TEXT NOT NULL CHECK (server IN ('server1', 'server2')),
  provider TEXT NOT NULL CHECK (provider IN ('fal_ai', 'gmicloud')),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  supports_text_to_video BOOLEAN NOT NULL DEFAULT true,
  supports_image_to_video BOOLEAN NOT NULL DEFAULT false,
  supports_audio BOOLEAN NOT NULL DEFAULT false,
  supports_negative_prompt BOOLEAN NOT NULL DEFAULT false,
  max_images INTEGER NOT NULL DEFAULT 0,
  enabled_for_admin BOOLEAN NOT NULL DEFAULT true,
  enabled_for_premium BOOLEAN NOT NULL DEFAULT true,
  enabled_for_user BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create model_pricing table (dynamic pricing based on options)
CREATE TABLE public.model_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES public.video_models(id) ON DELETE CASCADE NOT NULL,
  duration_seconds INTEGER,
  audio_on BOOLEAN DEFAULT false,
  mode TEXT DEFAULT 'standard',
  resolution TEXT DEFAULT '720p',
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(model_id, duration_seconds, audio_on, mode, resolution)
);

-- Create media uploads table
CREATE TABLE public.media_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create video_generations table (history)
CREATE TABLE public.video_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  model_id UUID REFERENCES public.video_models(id) NOT NULL,
  api_key_id UUID REFERENCES public.api_keys(id),
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  input_media_ids UUID[],
  aspect_ratio TEXT,
  duration_seconds INTEGER,
  resolution TEXT,
  audio_enabled BOOLEAN DEFAULT false,
  mode TEXT DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  output_url TEXT,
  credits_used DECIMAL(10,2) NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create credit_transactions table (audit log)
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  api_key_id UUID REFERENCES public.api_keys(id),
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('debit', 'credit', 'refund')),
  description TEXT,
  video_generation_id UUID REFERENCES public.video_generations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid()),
    'user'::app_role
  )
$$;

-- Security definer function to check if user has model access
CREATE OR REPLACE FUNCTION public.has_model_access(model_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.video_models m
    WHERE m.id = model_id
    AND (
      (public.get_user_role() = 'admin' AND m.enabled_for_admin = true)
      OR (public.get_user_role() = 'premium' AND m.enabled_for_premium = true)
      OR (public.get_user_role() = 'user' AND m.enabled_for_user = true)
    )
  )
$$;

-- Function to handle new user signup (creates profile, credits, and role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE USING (public.is_admin());

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_credits
CREATE POLICY "Users can view their own credits" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all credits" ON public.user_credits
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update credits" ON public.user_credits
  FOR UPDATE USING (public.is_admin());

-- RLS Policies for api_keys (admin only - no SELECT of actual key via RLS)
CREATE POLICY "Admins can manage api_keys" ON public.api_keys
  FOR ALL USING (public.is_admin());

-- RLS Policies for video_models
CREATE POLICY "Anyone authenticated can view enabled models" ON public.video_models
  FOR SELECT USING (
    auth.role() = 'authenticated' AND public.has_model_access(id)
  );
CREATE POLICY "Admins can manage models" ON public.video_models
  FOR ALL USING (public.is_admin());

-- RLS Policies for model_pricing
CREATE POLICY "Anyone authenticated can view pricing" ON public.model_pricing
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage pricing" ON public.model_pricing
  FOR ALL USING (public.is_admin());

-- RLS Policies for media_uploads
CREATE POLICY "Users can view their own media" ON public.media_uploads
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload media" ON public.media_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own media" ON public.media_uploads
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for video_generations
CREATE POLICY "Users can view their own generations" ON public.video_generations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create generations" ON public.video_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all generations" ON public.video_generations
  FOR SELECT USING (public.is_admin());

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.credit_transactions
  FOR SELECT USING (public.is_admin());

-- Create storage bucket for media
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', false);

-- Storage policies for media bucket
CREATE POLICY "Users can upload their own media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own media" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'media' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'media' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_models_updated_at
  BEFORE UPDATE ON public.video_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_generations_updated_at
  BEFORE UPDATE ON public.video_generations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();