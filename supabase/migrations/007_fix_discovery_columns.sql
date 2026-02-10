-- Fix client_discoveries table to match Discovery page data structure

-- Add missing columns
ALTER TABLE client_discoveries 
  ADD COLUMN IF NOT EXISTS tone TEXT,
  ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS website_analysis JSONB;

-- Change social_presence from JSONB to TEXT to match the data we're sending
ALTER TABLE client_discoveries 
  ALTER COLUMN social_presence TYPE TEXT USING social_presence::TEXT;

-- Rename website_analytics to website_analysis if it exists, or add it
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'client_discoveries' AND column_name = 'website_analytics') THEN
    ALTER TABLE client_discoveries RENAME COLUMN website_analytics TO website_analysis;
  END IF;
END $$;

-- Ensure competitor_analysis exists (it should, but just in case)
ALTER TABLE client_discoveries 
  ADD COLUMN IF NOT EXISTS competitor_analysis TEXT;
