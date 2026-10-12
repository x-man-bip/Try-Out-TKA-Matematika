/*
# Tabel participants — Daftar 100 Peserta Ujian dengan Kode Unik

## Deskripsi
Menyimpan 100 peserta ujian yang sudah terdaftar, masing-masing memiliki kode unik.
Nama dan kode harus cocok agar peserta bisa masuk ke ujian.

## Tabel Baru: participants
- id           : SERIAL, primary key
- code         : TEXT unik, kode peserta (cth: PES001 - PES100)
- name         : TEXT, nama lengkap peserta
- school       : TEXT, asal sekolah
- created_at   : TIMESTAMPTZ

## Security
- RLS aktif
- Anon dapat SELECT (untuk verifikasi login peserta)
- Tidak ada INSERT/UPDATE/DELETE dari client (data peserta sudah pre-registered)
*/

CREATE TABLE IF NOT EXISTS participants (
  id         serial PRIMARY KEY,
  code       text NOT NULL UNIQUE,
  name       text NOT NULL,
  school     text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_participants" ON participants;
CREATE POLICY "anon_select_participants" ON participants FOR SELECT
  TO anon, authenticated USING (true);

-- Insert 100 peserta contoh
INSERT INTO participants (code, name, school)
SELECT
  'PES' || lpad(i::text, 3, '0'),
  'Peserta ' || lpad(i::text, 3, '0'),
  CASE (i % 10)
    WHEN 0 THEN 'SMAN 1 Jakarta'
    WHEN 1 THEN 'SMAN 2 Jakarta'
    WHEN 2 THEN 'SMAN 3 Bandung'
    WHEN 3 THEN 'SMAN 4 Surabaya'
    WHEN 4 THEN 'SMAN 5 Semarang'
    WHEN 5 THEN 'SMAN 6 Yogyakarta'
    WHEN 6 THEN 'SMAN 7 Medan'
    WHEN 7 THEN 'SMAN 8 Makassar'
    WHEN 8 THEN 'SMAN 9 Denpasar'
    WHEN 9 THEN 'SMAN 10 Palembang'
  END
FROM generate_series(1, 100) AS t(i)
ON CONFLICT (code) DO NOTHING;
