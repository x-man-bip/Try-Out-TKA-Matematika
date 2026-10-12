/*
# Tambah kolom answers ke exam_sessions

## Deskripsi
Menyimpan jawaban peserta per soal dalam format JSONB agar admin dapat
melihat jawaban mana yang benar dan mana yang salah untuk setiap peserta.

Format: { "1": "A", "2": "C", "3": "B", ... }
Key = question id, Value = pilihan jawaban peserta (A-E)

## Tabel yang Dimodifikasi: exam_sessions
- answers : JSONB, nullable, daftar jawaban peserta
*/

ALTER TABLE exam_sessions
  ADD COLUMN IF NOT EXISTS answers jsonb;
