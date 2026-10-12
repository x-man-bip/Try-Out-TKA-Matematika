-- Change score column from integer to numeric(5,2) for 2 decimal places
ALTER TABLE exam_sessions
  ALTER COLUMN score TYPE numeric(5,2) USING score::numeric(5,2);
