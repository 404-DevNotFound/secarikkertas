-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Genre_nama_key" ON "Genre"("nama");

-- Seed data awal — daftar genre siap pakai untuk dropdown di editor.
-- Tambah/kurangi kapan saja langsung lewat tabel ini (Prisma Studio atau
-- query manual), tidak perlu ubah kode frontend/backend.
INSERT INTO "Genre" ("id", "nama") VALUES
  ('genre_umum', 'Umum'),
  ('genre_romansa', 'Romansa'),
  ('genre_horor', 'Horor'),
  ('genre_slice_of_life', 'Slice of Life'),
  ('genre_coming_of_age', 'Coming of Age'),
  ('genre_fantasi', 'Fantasi'),
  ('genre_fiksi_ilmiah', 'Fiksi Ilmiah'),
  ('genre_misteri', 'Misteri'),
  ('genre_drama', 'Drama'),
  ('genre_komedi', 'Komedi'),
  ('genre_petualangan', 'Petualangan'),
  ('genre_thriller', 'Thriller')
ON CONFLICT ("nama") DO NOTHING;
