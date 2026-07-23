-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "catatanAdmin" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "kategori" TEXT NOT NULL DEFAULT 'Umum';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "banned" BOOLEAN NOT NULL DEFAULT false;
