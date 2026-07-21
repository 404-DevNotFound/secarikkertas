import express from 'express'
import prisma from '../data/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// GET /api/posts?tipe=cerpen&q=kata-kunci
router.get('/', async (req, res) => {
  const { tipe, q } = req.query

  const posts = await prisma.post.findMany({
    where: {
      status: 'terbit',
      ...(tipe && { tipe }),
      ...(q && { judul: { contains: q, mode: 'insensitive' } }),
    },
    include: { penulis: true, likes: true },
    orderBy: { createdAt: 'desc' },
  })

  // rapikan bentuk data supaya cocok dengan CardPost di front-end
  const hasil = posts.map((p) => ({
    id: p.id,
    judul: p.judul,
    penulis: p.penulis.namaPena,
    ringkasan: p.isi.slice(0, 120),
    likes: p.likes.length,
  }))

  res.json(hasil)
})

// GET /api/posts/saya
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
  const { judul, tipe } = req.body
  const post = await prisma.post.create({
    data: {
      judul: judul || 'Tanpa judul',
      tipe: tipe || 'cerpen',
      penulisId: req.userId,
    },
  })
  res.json(post)
})

// PUT /api/posts/:id/draft - auto-save (FR-03.2)
router.put('/:id/draft', requireAuth, async (req, res) => {
  const { judul, isi } = req.body

  // NFR-03: WAJIB sanitize sebelum simpan sebagai HTML.
  // npm install sanitize-html, lalu:
  // import sanitizeHtml from 'sanitize-html'
  // const isiHtml = sanitizeHtml(isi)
  const isiHtml = isi // sementara, ganti dengan sanitizeHtml(isi) sebelum production!

  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: {
      ...(judul !== undefined && { judul }),
      ...(isi !== undefined && { isi, isiHtml }),
    },
  })
  res.json(post)
})

// POST /api/posts/:id/like (FR-04.2)
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

// GET /api/posts/:id/comments (FR-04.1)
router.get('/:id/comments', async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { postId: req.params.id },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  })

  const hasil = comments.map((c) => ({
    id: c.id,
    isi: c.isi,
    nama: c.user.namaPena,
    waktu: c.createdAt,
  }))
  res.json(hasil)
})

// POST /api/posts/:id/comments
router.post('/:id/comments', requireAuth, async (req, res) => {
  const { isi } = req.body
  const comment = await prisma.comment.create({
    data: { isi, postId: req.params.id, userId: req.userId },
    include: { user: true },
  })

  res.json({
    id: comment.id,
    isi: comment.isi,
    nama: comment.user.namaPena,
    waktu: comment.createdAt,
  })
})

export default router
