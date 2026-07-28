-- Tabel relasi many-to-many implisit untuk fitur "tag multi-pilih".
-- Genre dipakai ulang sebagai kumpulan tag (lihat catatan di schema.prisma),
-- jadi tabel ini menghubungkan Post <-> Genre, bukan model baru.
--
-- Field "kategori" lama di tabel Post SENGAJA TIDAK dihapus/diubah di sini —
-- datanya tetap ada sebagai arsip, dan dipakai sebagai sumber saat migrasi
-- data lewat scripts/migrateKategoriToTags.js (dijalankan terpisah setelah
-- migration ini, lihat PANDUAN_FITUR_BARU.md).

-- CreateTable
CREATE TABLE "_PostTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PostTags_AB_unique" ON "_PostTags"("A", "B");

-- CreateIndex
CREATE INDEX "_PostTags_B_index" ON "_PostTags"("B");

-- AddForeignKey
ALTER TABLE "_PostTags" ADD CONSTRAINT "_PostTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostTags" ADD CONSTRAINT "_PostTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
