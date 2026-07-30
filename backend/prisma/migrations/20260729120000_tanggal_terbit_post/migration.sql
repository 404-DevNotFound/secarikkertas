-- Tambah kolom "publishedAt": kapan naskah PERTAMA KALI terbit, diisi sekali
-- di kode (routes/posts.js & routes/admin.js saat status berubah jadi
-- "terbit") dan tidak berubah lagi sesudahnya.
--
-- Sebelumnya tanggal terbit yang ditampilkan ke pembaca dibaca dari kolom
-- "updatedAt", padahal itu ikut ke-update Prisma tiap kali baris Post
-- disentuh dengan cara APA PUN — termasuk tiap kali viewCount bertambah
-- karena ada yang membaca naskahnya (lihat GET /api/posts/:id). Akibatnya
-- "tanggal terbit" yang tampil di kartu tulisan keliru ikut maju ke hari
-- ini setiap kali ada pembaca baru, bukan tanggal admin menyetujui naskah.

-- AlterTable
ALTER TABLE "Post" ADD COLUMN "publishedAt" TIMESTAMP(3);

-- Isi data lama: untuk naskah yang SUDAH terbit sebelum kolom ini ada,
-- tanggal terbit aslinya sudah tidak bisa dilacak persis lagi (tidak
-- dicatat di mana pun). "createdAt" dipakai sebagai perkiraan terbaik —
-- lebih stabil daripada "updatedAt" yang nilainya sudah bercampur dengan
-- aktivitas belakangan (like/dibaca) sebelum migration ini berjalan.
UPDATE "Post" SET "publishedAt" = "createdAt" WHERE "status" = 'terbit' AND "publishedAt" IS NULL;
