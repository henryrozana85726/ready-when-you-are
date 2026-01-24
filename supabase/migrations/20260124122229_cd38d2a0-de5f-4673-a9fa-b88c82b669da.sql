-- Make model_id nullable to allow saving generations without model lookup
ALTER TABLE public.video_generations ALTER COLUMN model_id DROP NOT NULL;

-- Add model_name column to store the model identifier string
ALTER TABLE public.video_generations ADD COLUMN IF NOT EXISTS model_name text;