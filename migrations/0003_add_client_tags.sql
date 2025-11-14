-- Training Storybook - Add Client Tags
-- Version: 1.2.0
-- Description: Add independent client_tags column for client-specific tagging

-- Add client_tags column (JSON array stored as TEXT, independent from content tags)
ALTER TABLE documents ADD COLUMN client_tags TEXT DEFAULT '[]';

-- Create index for client tag searches
CREATE INDEX IF NOT EXISTS idx_documents_client_tags ON documents(client_tags);

-- Note: 
-- - tags: Content-based tags (Formation, DDA, etc.) - from AI or manual
-- - client_tags: Client-specific tags (Client A, Urgent, Q4 2024, etc.) - manual only
