-- Training Storybook - Add Tags and Folders
-- Version: 1.1.0

-- Add tags column (JSON array stored as TEXT)
ALTER TABLE documents ADD COLUMN tags TEXT DEFAULT '[]';

-- Add folder column (string for folder name/path)
ALTER TABLE documents ADD COLUMN folder TEXT DEFAULT '';

-- Create index for folder searches
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder);

-- Create index for tag searches (will use LIKE queries)
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents(tags);
