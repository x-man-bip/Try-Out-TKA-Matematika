-- Add class column to participants table
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS class text;

-- Add class column to exam_sessions table
ALTER TABLE exam_sessions
  ADD COLUMN IF NOT EXISTS class text;
