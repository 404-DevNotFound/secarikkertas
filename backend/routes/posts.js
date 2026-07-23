import express from 'express'
import sanitizeHtml from 'sanitize-html'
import prisma from '../data/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// GET /api/posts?tipe=cerpen&q=kata-kunci&kategori=Horor
router.get('/', async (req, res) => {
  const { tipe, q, kategori } = req.query

  const posts = await prisma.post.findMany({
    where: {
      status: 'terbit', // hanya yang sudah disetujui admin yang tampil publik
      ...(tipe && { tipe }),
      ...(kategori && { kategori }),
      ...(q && { judul: { contains: q, mode: 'insensitive' } }),
    },
    include: { penulis: true, likes: true },
    orderBy: { createdAt: 'desc' },
  })

  const hasil = posts.map((p) => ({
    id: p.id,
    judul: p.judul,
    penulis: p.penulis.namaPena,
    ringkasan: p.isi.slice(0, 120),
    likes: p.likes.length,
    kategori: p.kategori,
  }))

  res.json(hasil)
})

// GET /api/posts/saya - semua naskah milik penulis, apapun statusnya
router.get('/saya', requireAuth, async (req, res) => {
  const posts = await prisma.post.findMany({
    where: { penulisId: req.userId },
    orderBy: { updatedAt: 'desc' },
  })
  res.json(posts)
})

// GET /api/posts/:id
router.get('/:id', async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: { penulis: true },
  })
  if (!post) return res.status(404).json({ message: 'Tidak ditemukan' })

  res.json({ ...post, penulis: post.penulis.namaPena })
})

// POST /api/posts - buat draft baru
router.post('/', requireAuth, async (req, res) => {
  const { judul, tipe, kategori } = req.body
  const post = await prisma.post.create({
    data: {
      judul: judul || 'Tanpa judul',
      tipe: tipe || 'cerpen',
      kategori: kategori || 'Umum',
      penulisId: req.userId,
    },
  })
  res.json(post)
})

// PUT /api/posts/:id/draft - auto-save, HANYA boleh kalau masih status draft/ditolak
router.put('/:id/draft', requireAuth, async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post || post.penulisId !== req.userId) {
    return res.status(403).json({ message: 'Tidak diizinkan' })
  }
  if (!['draft', 'ditolak'].includes(post.status)) {
    return res.status(400).json({ message: 'Naskah sedang ditinjau/terbit, tidak bisa diedit' })
  }

  const { judul, isi, kategori } = req.body
  const isiHtml = isi !== undefined ? sanitizeHtml(isi, {
    allowedTags: ['p', 'b', 'i', 'em', 'strong', 'br', 'blockquote', 'ul', 'ol', 'li'],
    allowedAttributes: {},
  }) : undefined

  const updated = await prisma.post.update({
    where: { id: req.params.id },
    data: {
      ...(judul !== undefined && { judul }),
      ...(kategori !== undefined && { kategori }),
      ...(isi !== undefined && { isi, isiHtml }),
    },
  })
  res.json(updated)
})

// PUT /api/posts/:id/ajukan - penulis mengajukan naskah untuk ditinjau admin
router.put('/:id/ajukan', requireAuth, async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post || post.penulisId !== req.userId) {
    return res.status(403).json({ message: 'Tidak diizinkan' })
  }
  if (!post.judul || post.judul === 'Tanpa judul' || post.isi.length < 50) {
    return res.status(400).json({ message: 'Lengkapi judul dan isi (minimal 50 karakter) sebelum mengajukan' })
  }

  const updated = await prisma.post.update({
    where: { id: req.params.id },
    data: { status: 'diajukan' },
  })
  res.json(updated)
})

// POST /api/posts/:id/like
router.post('/:id/like', requireAuth, async (req, res) => {
  const { liked } = req.body
  const postId = req.params.id

  if (liked) {
    await prisma.like.upsert({
      where: { postId_userId: { postId, userId: req.userId } },
      update: {},
      create: { postId, userId: req.userId },
    })
  } else {
    await prisma.like.deleteMany({ where: { postId, userId: req.userId } })
  }

  const jumlah = await prisma.like.count({ where: { postId } })
  res.json({ likes: jumlah })
})

// GET /api/posts/:id/comments
router.get('/:id/comments', async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { postId: req.params.id },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  })

  const hasil = comments.map((c) => ({
    id: c.id, isi: c.isi, nama: c.user.namaPena, waktu: c.createdAt,
  }))
  res.json(hasil)
})

// POST /api/posts/:id/comments
router.post('/:id/comments', requireAuth, async (req, res) => {
  const { isi } = req.body
  if (!isi || !isi.trim()) {
    return res.status(400).json({ message: 'Komentar tidak boleh kosong' })
  }

  const isiBersih = sanitizeHtml(isi.trim(), { allowedTags: [], allowedAttributes: {} })

  const comment = await prisma.comment.create({
    data: { isi: isiBersih, postId: req.params.id, userId: req.userId },
    include: { user: true },
  })

  res.json({
    id: comment.id, isi: comment.isi, nama: comment.user.namaPena, waktu: comment.createdAt,
  })
})

export default router
