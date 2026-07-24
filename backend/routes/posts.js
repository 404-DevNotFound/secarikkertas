import express from 'express'
import multer from 'multer'
import sanitizeHtml from 'sanitize-html'
import mammoth from 'mammoth'
import pdfParse from 'pdf-parse'
import prisma from '../data/prisma.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

router.get('/', async (req, res) => {
  const { tipe, q, kategori } = req.query

  const posts = await prisma.post.findMany({
    where: {
      status: 'terbit',
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
    tipe: p.tipe,
  }))

  res.json(hasil)
})

router.get('/saya', requireAuth, async (req, res) => {
  const posts = await prisma.post.findMany({
    where: { penulisId: req.userId },
    orderBy: { updatedAt: 'desc' },
  })
  res.json(posts)
})

router.get('/:id', async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: { penulis: true },
  })
  if (!post) return res.status(404).json({ message: 'Tidak ditemukan' })

  res.json({ ...post, penulis: post.penulis.namaPena })
})

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

router.delete('/:id', requireAuth, async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post) return res.status(404).json({ message: 'Tidak ditemukan' })
  if (post.penulisId !== req.userId) {
    return res.status(403).json({ message: 'Tidak diizinkan' })
  }
  if (!['draft', 'ditolak'].includes(post.status)) {
    // Naskah yang sudah terbit HANYA bisa dihapus admin (lewat /api/admin/posts/:id)
    return res.status(400).json({ message: 'Naskah yang sudah terbit hanya bisa dihapus oleh admin' })
  }

  await prisma.post.delete({ where: { id: req.params.id } })
  res.json({ message: 'Draf dihapus' })
})

router.put('/:id/ajukan', requireAuth, async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post || post.penulisId !== req.userId) {
    return res.status(403).json({ message: 'Tidak diizinkan' })
  }
  if (!post.judul || post.judul === 'Tanpa judul' || post.isi.length < 50) {
    return res.status(400).json({ message: 'Lengkapi judul dan isi (minimal 50 karakter) sebelum mengajukan' })
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  const statusBaru = user?.role === 'admin' ? 'terbit' : 'diajukan'

  const updated = await prisma.post.update({
    where: { id: req.params.id },
    data: { status: statusBaru, catatanAdmin: '' },
  })
  res.json(updated)
})

router.post('/:id/import', requireAuth, upload.single('file'), async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post || post.penulisId !== req.userId) {
    return res.status(403).json({ message: 'Tidak diizinkan' })
  }
  if (!['draft', 'ditolak'].includes(post.status)) {
    return res.status(400).json({ message: 'Naskah sedang ditinjau/terbit, tidak bisa diedit' })
  }
  if (!req.file) {
    return res.status(400).json({ message: 'Tidak ada file yang diunggah' })
  }

  const namaFile = req.file.originalname.toLowerCase()
  let teksMentah = ''

  try {
    if (namaFile.endsWith('.docx')) {
      const hasil = await mammoth.extractRawText({ buffer: req.file.buffer })
      teksMentah = hasil.value
    } else if (namaFile.endsWith('.pdf')) {
      const hasil = await pdfParse(req.file.buffer)
      teksMentah = hasil.text
    } else {
      return res.status(400).json({ message: 'Format file harus .docx atau .pdf' })
    }
  } catch (err) {
    console.error('Gagal parsing file:', err)
    return res.status(400).json({ message: 'Gagal membaca isi file, pastikan file tidak rusak' })
  }

  if (!teksMentah || !teksMentah.trim()) {
    return res.status(400).json({ message: 'File tidak berisi teks yang bisa dibaca (mungkin hasil scan gambar)' })
  }

  const paragraf = teksMentah
    .split(/\n{1,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p}</p>`)
    .join('')

  const isiHtml = sanitizeHtml(paragraf, {
    allowedTags: ['p', 'b', 'i', 'em', 'strong', 'br', 'blockquote', 'ul', 'ol', 'li'],
    allowedAttributes: {},
  })

  const updated = await prisma.post.update({
    where: { id: req.params.id },
    data: { isi: teksMentah, isiHtml },
  })
  res.json(updated)
})

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

router.get('/:id/comments', async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { postId: req.params.id },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  })

  const hasil = comments.map((c) => ({
    id: c.id,
    isi: c.isi,
    nama: c.user ? c.user.namaPena : (c.namaTamu || 'Anonim'),
    waktu: c.createdAt,
    anonim: !c.user,
  }))
  res.json(hasil)
})

// POST /api/posts/:id/comments - SEKARANG BOLEH TANPA LOGIN (anonim)
// optionalAuth: kalau ada token valid, req.userId keisi; kalau tidak, null.
router.post('/:id/comments', optionalAuth, async (req, res) => {
  const { isi, namaTamu } = req.body
  if (!isi || !isi.trim()) {
    return res.status(400).json({ message: 'Komentar tidak boleh kosong' })
  }

  const isiBersih = sanitizeHtml(isi.trim(), { allowedTags: [], allowedAttributes: {} })

  const comment = await prisma.comment.create({
    data: {
      isi: isiBersih,
      postId: req.params.id,
      userId: req.userId || null,
      // Kalau tidak login, pakai nama yang diketik (dibersihkan juga),
      // atau "Anonim" kalau kosong.
      namaTamu: req.userId ? null : (sanitizeHtml((namaTamu || '').trim(), { allowedTags: [], allowedAttributes: {} }) || 'Anonim'),
    },
    include: { user: true },
  })

  res.json({
    id: comment.id,
    isi: comment.isi,
    nama: comment.user ? comment.user.namaPena : (comment.namaTamu || 'Anonim'),
    waktu: comment.createdAt,
    anonim: !comment.user,
  })
})

export default router
