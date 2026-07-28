// Migrasi data: pindahkan kategori lama (field "kategori", satu nilai teks
// per tulisan) ke sistem tag baru (relasi many-to-many Post <-> Genre).
//
// Aman dijalankan berkali-kali (idempoten) — tulisan yang sudah punya tag
// dilewati begitu saja, tidak akan ditambah tag dobel.
//
// Yang dilakukan untuk tiap tulisan:
//   1. Kalau tulisan itu SUDAH punya minimal satu tag → lewati.
//   2. Kalau field "kategori"-nya kosong → lewati (tidak ada yang bisa
//      dimigrasikan).
//   3. Kalau belum ada Genre dengan nama yang sama persis dengan
//      "kategori"-nya → buat Genre baru dengan nama itu (jarang terjadi,
//      cuma kalau dulu ada kategori "liar" yang tidak lewat dropdown Genre).
//   4. Sambungkan tulisan itu ke Genre tersebut sebagai tag pertamanya.
//
// Field "kategori" lama TIDAK dihapus/dikosongkan — tetap tersimpan sebagai
// arsip, cuma tidak dipakai lagi oleh kode baru.
//
// Cara pakai (di terminal folder backend, setelah migration Prisma
// "20260728120000_tag_multi_kategori" berhasil dijalankan):
//   node scripts/migrateKategoriToTags.js

import 'dotenv/config'
import prisma from '../data/prisma.js'

async function main() {
  const posts = await prisma.post.findMany({
    select: { id: true, judul: true, kategori: true, tags: { select: { id: true } } },
  })

  let dimigrasikan = 0
  let dilewati = 0

  for (const post of posts) {
    if (post.tags.length > 0) {
      dilewati++
      continue
    }
    const namaKategori = (post.kategori || '').trim()
    if (!namaKategori) {
      dilewati++
      continue
    }

    await prisma.post.update({
      where: { id: post.id },
      data: {
        tags: {
          connectOrCreate: {
            where: { nama: namaKategori },
            create: { nama: namaKategori },
          },
        },
      },
    })
    dimigrasikan++
  }

  console.log(`Selesai. ${dimigrasikan} tulisan dimigrasikan ke sistem tag, ${dilewati} dilewati (sudah bertag/kategori kosong).`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
