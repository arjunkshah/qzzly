-- Add uploadedAt column to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(); 