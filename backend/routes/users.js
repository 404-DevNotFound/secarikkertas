import express from 'express'
import prisma from '../data/prisma.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// Profil publik seorang penulis — bio, jumlah pengikut/mengikuti, dan
// daftar naskahnya yang sudah terbit. optionalAuth dipakai supaya
// "mengikuti" bisa ditentukan untuk pengunjung yang sedang login, tapi
// halaman tetap bisa diakses tanpa login.
router.get('/:username', optionalAuth, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username } })
  if (!target) return res.status(404).json({ message: 'Pengguna tidak ditemukan' })

  const [tulisan, jumlahPengikut, jumlahMengikuti, mengikuti] = await Promise.all([
    prisma.post.findMany({
      where: { penulisId: target.id, status: 'terbit' },
      include: { likes: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.follow.count({ where: { followingId: target.id } }),
    prisma.follow.count({ where: { followerId: target.id } }),
    req.userId
      ? prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: req.userId, followingId: target.id } },
        })
      : null,
  ])

  res.json({
    username: target.username,
    namaPena: target.namaPena,
    bio: target.bio,
    bergabung: target.createdAt,
    jumlahPengikut,
    jumlahMengikuti,
    mengikuti: !!mengikuti,
    tulisan: tulisan.map((p) => ({
      id: p.id,
      judul: p.judul,
      tipe: p.tipe,
      kategori: p.kategori,
      gambarSampul: p.gambarSampul,
      ringkasan: p.isi.slice(0, 120),
      likes: p.likes.length,
      viewCount: p.viewCount,
      tanggalTerbit: p.updatedAt,
    })),
  })
})

// Ikuti / berhenti mengikuti penulis lain.
router.post('/:username/ikuti', requireAuth, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username } })
  if (!target) return res.status(404).json({ message: 'Pengguna tidak ditemukan' })
  if (target.id === req.userId) {
    return res.status(400).json({ message: 'Tidak bisa mengikuti diri sendiri' })
  }

  const { ikuti } = req.body
  if (ikuti) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: req.userId, followingId: target.id } },
      update: {},
      create: { followerId: req.userId, followingId: target.id },
    })
  } else {
    await prisma.follow.deleteMany({ where: { followerId: req.userId, followingId: target.id } })
  }

  const jumlahPengikut = await prisma.follow.count({ where: { followingId: target.id } })
  res.json({ mengikuti: !!ikuti, jumlahPengikut })
})

router.put('/me', requireAuth, async (req, res) => {
  const { namaPena, bio } = req.body

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      ...(namaPena !== undefined && { namaPena }),
      ...(bio !== undefined && { bio }),
    },
  })

  const { password: _, ...userTanpaPassword } = user
  res.json({ user: userTanpaPassword })
})

export default router
