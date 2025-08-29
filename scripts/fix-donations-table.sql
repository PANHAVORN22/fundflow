-- Fix donations table to support campaign comments and public viewing
-- Add missing fields to donations table
ALTER TABLE public.donations 
ADD COLUMN IF NOT EXISTS comment TEXT,
ADD COLUMN IF NOT EXISTS campaign_id UUID;

-- Update RLS policies to allow public viewing of donations
DROP POLICY IF EXISTS "Users can view own donations" ON public.donations;
DROP POLICY IF EXISTS "Anyone can view donations" ON public.donations;

-- Allow anyone to view donations (for public display on campaign pages)
CREATE POLICY "Anyone can view donations" ON public.donations
  FOR SELECT USING (true);

-- Keep existing policies for insert/update/delete
-- Users can still only modify their own donations
