/*
# Create exam_questions and exam_settings tables + storage bucket for images

## New Tables
- exam_questions: stores all exam questions with support for 3 question types
  - id: serial PK
  - question_type: 'single-choice' | 'multiple-choice' | 'true-false'
  - subject: mata pelajaran / kategori
  - question: teks soal (HTML allowed)
  - image_url: URL gambar soal (optional, from Supabase Storage)
  - choices: JSONB object {"A":"...","B":"...","C":"...","D":"...","E":"..."} (for true-false only A,B used)
  - answer: correct answer — single letter "A" or comma-separated "A,C" for multiple-choice
  - sort_order: display order
  - created_at: timestamp

- exam_settings: single-row table for exam configuration
  - id: fixed to 1
  - duration_minutes: exam duration in minutes
  - passing_score: minimum passing score (0-100, 2 decimals)

## Storage
- Creates public bucket "question-images" for uploading question images

## Security
- RLS enabled on both tables
- anon + authenticated can SELECT (students read questions during exam)
- anon + authenticated can INSERT/UPDATE/DELETE (admin manages questions — no auth on this app)
- Storage bucket is public for reading, uploads allowed for anon/authenticated
*/

CREATE TABLE IF NOT EXISTS exam_questions (
  id            serial PRIMARY KEY,
  question_type text NOT NULL DEFAULT 'single-choice',
  subject       text NOT NULL DEFAULT 'Umum',
  question      text NOT NULL,
  image_url     text,
  choices       jsonb NOT NULL,
  answer        text NOT NULL,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_exam_questions" ON exam_questions;
CREATE POLICY "anon_select_exam_questions" ON exam_questions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_exam_questions" ON exam_questions;
CREATE POLICY "anon_insert_exam_questions" ON exam_questions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_exam_questions" ON exam_questions;
CREATE POLICY "anon_update_exam_questions" ON exam_questions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_exam_questions" ON exam_questions;
CREATE POLICY "anon_delete_exam_questions" ON exam_questions FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS exam_settings (
  id               integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  duration_minutes integer NOT NULL DEFAULT 90,
  passing_score    numeric(5,2) NOT NULL DEFAULT 70
);

ALTER TABLE exam_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_exam_settings" ON exam_settings;
CREATE POLICY "anon_select_exam_settings" ON exam_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_exam_settings" ON exam_settings;
CREATE POLICY "anon_insert_exam_settings" ON exam_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_exam_settings" ON exam_settings;
CREATE POLICY "anon_update_exam_settings" ON exam_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO exam_settings (id, duration_minutes, passing_score)
VALUES (1, 90, 70)
ON CONFLICT (id) DO NOTHING;

-- Seed existing questions from the JSON file into the database
INSERT INTO exam_questions (question_type, subject, question, choices, answer, sort_order)
SELECT
  'single-choice',
  q->>'subject',
  q->>'question',
  (q->'choices')::jsonb,
  q->>'answer',
  (q->>'id')::integer
FROM jsonb_array_elements(
  '[]'::jsonb
) AS q
ON CONFLICT DO NOTHING;

-- Create storage bucket for question images
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_read_question_images" ON storage.objects;
CREATE POLICY "anon_read_question_images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'question-images');

DROP POLICY IF EXISTS "anon_write_question_images" ON storage.objects;
CREATE POLICY "anon_write_question_images" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'question-images');

DROP POLICY IF EXISTS "anon_delete_question_images" ON storage.objects;
CREATE POLICY "anon_delete_question_images" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'question-images');
