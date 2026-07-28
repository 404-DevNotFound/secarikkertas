import express from 'express'
import prisma from '../data/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()
router.use(requireAuth)

// 20 notifikasi terbaru milik akun yang sedang login, plus hitungan yang
// belum dibaca (dipakai untuk badge angka merah di ikon bel navbar).
router.get('/', async (req, res) => {
  const [notifikasi, belumDibaca] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.notification.count({ where: { userId: req.userId, dibaca: false } }),
  ])
  res.json({ notifikasi, belumDibaca })
})

router.put('/:id/baca', async (req, res) => {
  const notif = await prisma.notification.findUnique({ where: { id: req.params.id } })
  if (!notif || notif.userId !== req.userId) {
    return res.status(404).json({ message: 'Notifikasi tidak ditemukan' })
  }
  const updated = await prisma.notification.update({ where: { id: req.params.id }, data: { dibaca: true } })
  res.json(updated)
})

router.put('/baca-semua', async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.userId, dibaca: false }, data: { dibaca: true } })
  res.json({ message: 'Semua notifikasi ditandai sudah dibaca' })
})

export default router
