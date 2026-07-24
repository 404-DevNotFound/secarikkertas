import express from 'express'
import prisma from '../data/prisma.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = express.Router()
router.use(requireAuth, requireAdmin(prisma))

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

router.put('/users/:id/role', async (req, res) => {
  const { role } = req.body
  if (!['admin', 'penulis'].includes(role)) {
    return res.status(400).json({ message: 'Role tidak valid' })
  }
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } })
  res.json({ id: user.id, role: user.role })
})

router.put('/users/:id/banned', async (req, res) => {
  const { banned } = req.body
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { banned: !!banned } })
  res.json({ id: user.id, banned: user.banned })
})

// DELETE /api/admin/users/:id - hapus akun PERMANEN dari database
// Berkat onDelete: Cascade di schema.prisma, semua post/komentar/like
// milik user ini ikut otomatis terhapus, tidak perlu dibersihkan manual.
router.delete('/users/:id', async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!target) return res.status(404).json({ message: 'User tidak ditemukan' })

  // Akun admin (siapapun, termasuk diri sendiri) tidak boleh dihapus lewat sini —
  // supaya tidak ada risiko semua admin ke-hapus dan tidak ada yang bisa kelola web lagi.
  // Kalau memang perlu turunkan/hapus admin, turunkan dulu role-nya jadi "penulis"
  // lewat tombol "Turunkan", baru bisa dihapus.
  if (target.role === 'admin') {
    return res.status(400).json({ message: 'Akun admin tidak bisa dihapus. Turunkan role-nya dulu jika diperlukan.' })
  }

  await prisma.user.delete({ where: { id: req.params.id } })
  res.json({ message: `Akun "${target.username}" berhasil dihapus permanen` })
})

router.get('/naskah', async (req, res) => {
  const { status } = req.query
  const posts = await prisma.post.findMany({
    where: status ? { status } : { status: { in: ['diajukan', 'terbit', 'ditolak'] } },
    include: { penulis: { select: { namaPena: true, username: true } } },
    orderBy: { updatedAt: 'desc' },
  })
  res.json(posts)
})

router.put('/naskah/:id/setujui', async (req, res) => {
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: { status: 'terbit', catatanAdmin: '' },
  })
  res.json(post)
})

router.put('/naskah/:id/tolak', async (req, res) => {
  const { catatan } = req.body
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: { status: 'ditolak', catatanAdmin: catatan || 'Tidak sesuai pedoman komunitas' },
  })
  res.json(post)
})

router.delete('/posts/:id', async (req, res) => {
  await prisma.post.delete({ where: { id: req.params.id } })
  res.json({ message: 'Naskah dihapus' })
})

router.delete('/comments/:id', async (req, res) => {
  await prisma.comment.delete({ where: { id: req.params.id } })
  res.json({ message: 'Komentar dihapus' })
})

export default router
