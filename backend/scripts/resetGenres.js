// Memangkas tabel Genre supaya cuma berisi 5 kategori yang dipakai di
// dropdown editor & sidebar beranda: Coming of Age, Slice of Life, Horor,
// Romansa, Umum. Genre lain yang sudah ada di database akan dihapus.
//
// Aman dijalankan kapan saja: field `kategori` di tabel Post cuma teks
// biasa (bukan relasi ke tabel Genre), jadi naskah yang sudah terlanjur
// dikasih genre lama tetap tersimpan apa adanya — cuma pilihannya saja
// yang tidak akan muncul lagi di dropdown.
//
// Cara pakai (di terminal folder backend):
//   node scripts/resetGenres.js

import 'dotenv/config'
import prisma from '../data/prisma.js'

const GENRE_DIPERTAHANKAN = ['Coming of Age', 'Slice of Life', 'Horor', 'Romansa', 'Umum']

async function main() {
  const dihapus = await prisma.genre.deleteMany({
    where: { nama: { notIn: GENRE_DIPERTAHANKAN } },
  })
  console.log(`${dihapus.count} genre lama dihapus.`)

  for (const nama of GENRE_DIPERTAHANKAN) {
    await prisma.genre.upsert({
      where: { nama },
      update: {},
      create: { nama },
    })
  }
  console.log(`Genre sekarang: ${GENRE_DIPERTAHANKAN.join(', ')}`)

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
