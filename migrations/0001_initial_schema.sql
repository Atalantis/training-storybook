-- Training Storybook - Initial Database Schema
-- Version: 1.0.0
-- Description: Complete table structure for documents management

-- Drop existing table if exists (for fresh install)
DROP TABLE IF EXISTS documents;

-- Create documents table with all required columns
CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,           -- UUID v4 for public sharing
  filename TEXT NOT NULL,               -- Original filename
  description TEXT,                     -- User-editable description
  r2_key TEXT NOT NULL,                 -- R2 storage key (pdfs/uuid.pdf)
  size INTEGER NOT NULL,                -- File size in bytes
  views INTEGER DEFAULT 0,              -- View counter
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- Creation timestamp
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP   -- Last update timestamp
);

-- Create indexes for better performance
CREATE INDEX idx_documents_token ON documents(token);
CREATE INDEX idx_documents_created ON documents(created_at DESC);
CREATE INDEX idx_documents_updated ON documents(updated_at DESC);
