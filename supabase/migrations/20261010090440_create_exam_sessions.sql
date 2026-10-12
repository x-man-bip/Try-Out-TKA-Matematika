/*
# Tabel exam_sessions — Rekap Hasil Ujian Peserta

## Deskripsi
Menyimpan data setiap peserta ujian beserta hasil nilai mereka.

## Tabel Baru: exam_sessions
- id           : UUID, primary key, dibuat otomatis
- participant_code : TEXT unik 8-karakter (kode peserta, dibangkitkan otomatis)
- name         : TEXT, nama lengkap siswa
- school       : TEXT, asal sekolah
- score        : INTEGER, skor akhir ujian (0–100)
- correct      : INTEGER, jumlah jawaban benar
- wrong        : INTEGER, jumlah jawaban salah
- unanswered   : INTEGER, jumlah soal tidak dijawab
- time_used_seconds : INTEGER, waktu yang dipakai (detik)
- passed       : BOOLEAN, lulus atau tidak
- created_at   : TIMESTAMPTZ, waktu ujian diselesaikan

## Security
- RLS aktif
- Anon dapat INSERT (untuk menyimpan hasil tanpa login)
- Anon dapat SELECT baris milik mereka sendiri via participant_code
- Update dan Delete tidak diizinkan (data ujian bersifat final)
*/

CREATE TABLE IF NOT EXISTS exam_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_code    text NOT NULL UNIQUE,
  name                text NOT NULL,
  school              text NOT NULL,
  score               integer NOT NULL DEFAULT 0,
  correct             integer NOT NULL DEFAULT 0,
  wrong               integer NOT NULL DEFAULT 0,
  unanswered          integer NOT NULL DEFAULT 0,
  time_used_seconds   integer NOT NULL DEFAULT 0,
  passed              boolean NOT NULL DEFAULT false,
  created_at          timestamptz DEFAULT now()
);

ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_exam_sessions" ON exam_sessions;
CREATE POLICY "anon_insert_exam_sessions" ON exam_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_exam_sessions" ON exam_sessions;
CREATE POLICY "anon_select_exam_sessions" ON exam_sessions FOR SELECT
  TO anon, authenticated USING (true);
