import express from 'express'
import prisma from '../data/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Semua route di bawah ini wajib login — koleksi murni data pribadi,
// tidak ada versi publiknya.
router.use(requireAuth)

// Daftar koleksi milik pengguna yang sedang login, beserta berapa banyak
// tulisan tersimpan di masing-masing (dipakai buat badge angka di UI).
router.get('/', async (req, res) => {
  const koleksi = await prisma.collection.findMany({
    where: { userId: req.userId },
    include: { _count: { select: { bookmarks: true } } },
    orderBy: { createdAt: 'asc' },
  })
  res.json(koleksi.map((k) => ({ id: k.id, nama: k.nama, jumlah: k._count.bookmarks, createdAt: k.createdAt })))
})

router.post('/', async (req, res) => {
  const nama = (req.body?.nama || '').trim()
  if (!nama) return res.status(400).json({ message: 'Nama koleksi tidak boleh kosong' })
  if (nama.length > 50) return res.status(400).json({ message: 'Nama koleksi maksimal 50 karakter' })

  try {
    const koleksi = await prisma.collection.create({ data: { nama, userId: req.userId } })
    res.json({ id: koleksi.id, nama: koleksi.nama, jumlah: 0, createdAt: koleksi.createdAt })
  } catch (err) {
    // Konflik @@unique([userId, nama]) — nama koleksi ini sudah dipakai
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'Kamu sudah punya koleksi dengan nama itu' })
    }
    throw err
  }
})

router.put('/:id', async (req, res) => {
  const nama = (req.body?.nama || '').trim()
  if (!nama) return res.status(400).json({ message: 'Nama koleksi tidak boleh kosong' })

  const milik = await prisma.collection.findUnique({ where: { id: req.params.id } })
  if (!milik || milik.userId !== req.userId) {
    return res.status(404).json({ message: 'Koleksi tidak ditemukan' })
  }

  try {
    const updated = await prisma.collection.update({ where: { id: req.params.id }, data: { nama } })
    res.json({ id: updated.id, nama: updated.nama })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'Kamu sudah punya koleksi dengan nama itu' })
    }
    throw err
  }
})

// Hapus koleksi — bookmark di dalamnya TIDAK ikut terhapus, cuma balik
// jadi "Tanpa Koleksi" (lihat onDelete: SetNull di schema.prisma).
router.delete('/:id', async (req, res) => {
  const milik = await prisma.collection.findUnique({ where: { id: req.params.id } })
  if (!milik || milik.userId !== req.userId) {
    return res.status(404).json({ message: 'Koleksi tidak ditemukan' })
  }
  await prisma.collection.delete({ where: { id: req.params.id } })
  res.json({ message: `Koleksi "${milik.nama}" dihapus. Tulisan di dalamnya tetap tersimpan.` })
})

// Pindahkan sebuah tulisan yang SUDAH di-bookmark ke koleksi tertentu
// (atau lepas dari koleksi manapun kalau collectionId dikirim null/kosong).
// Tulisan itu sendiri harus sudah tersimpan lebih dulu lewat
// POST /api/posts/:id/bookmark — endpoint ini cuma mengatur pengelompokannya.
router.put('/tandai/:postId', async (req, res) => {
  const { collectionId } = req.body
  const bookmark = await prisma.bookmark.findUnique({
    where: { postId_userId: { postId: req.params.postId, userId: req.userId } },
  })
  if (!bookmark) {
    return res.status(404).json({ message: 'Simpan tulisan ini dulu sebelum memasukkannya ke koleksi' })
  }

  if (collectionId) {
    const koleksi = await prisma.collection.findUnique({ where: { id: collectionId } })
    if (!koleksi || koleksi.userId !== req.userId) {
      return res.status(404).json({ message: 'Koleksi tidak ditemukan' })
    }
  }

  const updated = await prisma.bookmark.update({
    where: { id: bookmark.id },
    data: { collectionId: collectionId || null },
  })
  res.json({ postId: updated.postId, collectionId: updated.collectionId })
})

export default router
