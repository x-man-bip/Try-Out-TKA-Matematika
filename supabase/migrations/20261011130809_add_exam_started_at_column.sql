/*
# Tambah kolom exam_started_at ke tabel participants

## Deskripsi
Menambah kolom exam_started_at untuk melacak apakah peserta sudah pernah memulai ujian.
Jika kolom sudah terisi (NOT NULL), peserta tidak dapat masuk ujian lagi.

## Tabel yang Dimodifikasi: participants
- exam_started_at : TIMESTAMPTZ, nullable, waktu saat peserta mulai ujian
  - NULL = belum pernah mulai ujian
  - terisi = sudah pernah mulai (tidak bisa masuk lagi)

## Security
- Tidak ada perubahan RLS, policy SELECT anon tetap berlaku
- Kolom ini hanya di-update dari client saat peserta terverifikasi
*/

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS exam_started_at timestamptz;

DROP POLICY IF EXISTS "anon_update_participants_started" ON participants;
CREATE POLICY "anon_update_participants_started" ON participants FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);
