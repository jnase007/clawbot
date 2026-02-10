-- Tables for storing generated content and images

-- ============ GENERATED CONTENT TABLE ============
CREATE TABLE IF NOT EXISTS generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('blog', 'meta', 'google', 'linkedin')),
  topic TEXT NOT NULL,
  audience TEXT,
  tone TEXT,
  keywords TEXT[],
  content_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ GENERATED IMAGES TABLE ============
CREATE TABLE IF NOT EXISTS generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  size TEXT NOT NULL,
  platform TEXT NOT NULL,
  style TEXT,
  brand_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_generated_content_client_id ON generated_content(client_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_type ON generated_content(content_type);
CREATE INDEX IF NOT EXISTS idx_generated_content_created_at ON generated_content(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generated_images_client_id ON generated_images(client_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_platform ON generated_images(platform);
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON generated_images(created_at DESC);

-- ============ ROW LEVEL SECURITY ============
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Allow all for authenticated" ON generated_content FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON generated_images FOR ALL USING (true);
