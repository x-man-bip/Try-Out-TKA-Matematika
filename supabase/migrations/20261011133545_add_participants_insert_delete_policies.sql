/*
# Tambah kebijakan INSERT dan DELETE untuk participants

## Deskripsi
Mengizinkan anon/authenticated untuk menambah peserta baru dan menghapus peserta
melalui admin panel. Policy UPDATE sudah ada dari migration sebelumnya.

## Security
- INSERT: anon, authenticated (untuk admin panel)
- DELETE: anon, authenticated (untuk admin panel)
*/

DROP POLICY IF EXISTS "anon_insert_participants" ON participants;
CREATE POLICY "anon_insert_participants" ON participants FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_participants" ON participants;
CREATE POLICY "anon_delete_participants" ON participants FOR DELETE
  TO anon, authenticated USING (true);
