-- Add client information fields for comprehensive client management
-- These fields are used by AI to generate Discovery, Strategy, Content, and Ads

ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS goals TEXT,
  ADD COLUMN IF NOT EXISTS challenges TEXT;

-- Note: competitor_names already exists as TEXT[] in the types
-- Note: monthly_budget already exists as DECIMAL(10, 2)

-- Add index for common searches
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_website ON clients(website) WHERE website IS NOT NULL;
