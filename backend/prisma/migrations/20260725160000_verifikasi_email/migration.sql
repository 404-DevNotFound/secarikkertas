-- AlterTable
-- Kolom "nama" dihapus — sudah tidak dipakai lagi (diganti alur verifikasi
-- email). Nama pena (namaPena) sekarang diisi otomatis dari username saat
-- registrasi, jadi tidak butuh kolom "nama" terpisah lagi.
ALTER TABLE "User" DROP COLUMN "nama";

-- Kolom verifikasi email.
-- Default TRUE supaya akun yang sudah ada sebelum migrasi ini (mis. lewat
-- createSuperadmin.js) tidak ikut terkunci butuh verifikasi.
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN     "kodeVerifikasi" TEXT;
ALTER TABLE "User" ADD COLUMN     "kodeVerifikasiExpiry" TIMESTAMP(3);
