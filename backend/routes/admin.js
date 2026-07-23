import express from 'express'
import prisma from '../data/prisma.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = express.Router()
router.use(requireAuth, requireAdmin(prisma))

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  const [totalUser, totalPost, totalTerbit, totalDiajukan, totalComment] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.post.count({ where: { status: 'terbit' } }),
    prisma.post.count({ where: { status: 'diajukan' } }),
    prisma.comment.count(),
  ])
  res.json({ totalUser, totalPost, totalTerbit, totalDiajukan, totalComment })
})

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, nama: true, username: true, namaPena: true,
      role: true, banned: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(users)
})

// PUT /api/admin/users/:id/role  { role: "admin" | "penulis" }
router.put('/users/:id/role', async (req, res) => {
  const { role } = req.body
  if (!['admin', 'penulis'].includes(role)) {
    return res.status(400).json({ message: 'Role tidak valid' })
  }
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } })
  res.json({ id: user.id, role: user.role })
})

// PUT /api/admin/users/:id/banned  { banned: true|false }
router.put('/users/:id/banned', async (req, res) => {
  const { banned } = req.body
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { banned: !!banned } })
  res.json({ id: user.id, banned: user.banned })
})

// GET /api/admin/naskah?status=diajukan - antrian naskah menunggu tinjauan
router.get('/naskah', async (req, res) => {
  const { status } = req.query
  const posts = await prisma.post.findMany({
    where: status ? { status } : { status: { in: ['diajukan', 'terbit', 'ditolak'] } },
    include: { penulis: { select: { namaPena: true, username: true } } },
    orderBy: { updatedAt: 'desc' },
  })
  res.json(posts)
})

// PUT /api/admin/naskah/:id/setujui
router.put('/naskah/:id/setujui', async (req, res) => {
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: { status: 'terbit', catatanAdmin: '' },
  })
  res.json(post)
})

// PUT /api/admin/naskah/:id/tolak  { catatan: "..." }
router.put('/naskah/:id/tolak', async (req, res) => {
  const { catatan } = req.body
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: { status: 'ditolak', catatanAdmin: catatan || 'Tidak sesuai pedoman komunitas' },
  })
  res.json(post)
})

// DELETE /api/admin/posts/:id - moderasi konten melanggar
router.delete('/posts/:id', async (req, res) => {
  await prisma.comment.deleteMany({ where: { postId: req.params.id } })
  await prisma.like.deleteMany({ where: { postId: req.params.id } })
  await prisma.post.delete({ where: { id: req.params.id } })
  res.json({ message: 'Naskah dihapus' })
})

// DELETE /api/admin/comments/:id
router.delete('/comments/:id', async (req, res) => {
  await prisma.comment.delete({ where: { id: req.params.id } })
  res.json({ message: 'Komentar dihapus' })
})

export default router
