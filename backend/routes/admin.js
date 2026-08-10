import express from 'express'
import prisma from '../data/prisma.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { buatNotifikasi, beriTahuPengikut } from '../utils/notify.js'
import { catatLogAdmin } from '../utils/log.js'

const router = express.Router()
router.use(requireAuth, requireAdmin(prisma))

router.get('/stats', async (req, res) => {
  const [totalUser, totalPost, totalTerbit, totalDiajukan, totalComment, totalLaporanBaru] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.post.count({ where: { status: 'terbit' } }),
    // Dihitung dari seluruh tahap pipeline (antrean + sedang diperiksa +
    // siap terbit), bukan cuma tahap "diajukan" paling awal, supaya
    // angkanya mencerminkan semua naskah yang masih diproses.
    prisma.post.count({ where: { status: { in: ['diajukan', 'ditinjau', 'siap_terbit'] } } }),
    prisma.comment.count(),
    prisma.report.count({ where: { status: 'baru' } }),
  ])
  res.json({ totalUser, totalPost, totalTerbit, totalDiajukan, totalComment, totalLaporanBaru })
})

router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, username: true, namaPena: true, email: true, emailVerified: true,
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
  catatLogAdmin({ adminId: req.userId, aksi: 'ubah_role', target: `@${user.username}`, detail: `Role diubah jadi ${role}` })
  res.json({ id: user.id, role: user.role })
})

router.put('/users/:id/banned', async (req, res) => {
  const { banned } = req.body
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { banned: !!banned } })
  catatLogAdmin({ adminId: req.userId, aksi: banned ? 'user_diblokir' : 'user_dibuka_blokir', target: `@${user.username}` })
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
  catatLogAdmin({ adminId: req.userId, aksi: 'user_dihapus', target: `@${target.username}` })
  res.json({ message: `Akun "${target.username}" berhasil dihapus permanen` })
})

router.get('/naskah', async (req, res) => {
  const { status } = req.query
  // "proses" itu bukan status asli di database — dia gabungan 3 tahap
  // pipeline (antrean, sedang diperiksa, siap terbit) supaya tab
  // "Antrean Naskah" di admin bisa nampilin semuanya sekaligus.
  let where
  if (status === 'proses') {
    where = { status: { in: ['diajukan', 'ditinjau', 'siap_terbit'] } }
  } else if (status) {
    where = { status }
  } else {
    where = { status: { in: ['diajukan', 'ditinjau', 'siap_terbit', 'terbit', 'ditolak'] } }
  }

  const posts = await prisma.post.findMany({
    where,
    include: { penulis: { select: { namaPena: true, username: true } }, tags: { select: { nama: true } } },
    orderBy: { updatedAt: 'desc' },
  })
  res.json(posts.map((p) => ({ ...p, tags: p.tags.map((t) => t.nama) })))
})

// Antrean -> Sedang Diperiksa
router.put('/naskah/:id/mulai-periksa', async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post) return res.status(404).json({ message: 'Naskah tidak ditemukan' })
  if (post.status !== 'diajukan') {
    return res.status(400).json({ message: 'Naskah tidak sedang dalam antrean' })
  }
  const updated = await prisma.post.update({
    where: { id: req.params.id },
    data: { status: 'ditinjau' },
  })
  catatLogAdmin({ adminId: req.userId, aksi: 'naskah_mulai_diperiksa', target: updated.judul })
  res.json(updated)
})

// Sedang Diperiksa -> Siap Terbit
router.put('/naskah/:id/siap-terbit', async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post) return res.status(404).json({ message: 'Naskah tidak ditemukan' })
  if (post.status !== 'ditinjau') {
    return res.status(400).json({ message: 'Naskah belum berstatus sedang diperiksa' })
  }
  const updated = await prisma.post.update({
    where: { id: req.params.id },
    data: { status: 'siap_terbit' },
  })
  catatLogAdmin({ adminId: req.userId, aksi: 'naskah_siap_terbit', target: updated.judul })
  res.json(updated)
})

router.put('/naskah/:id/setujui', async (req, res) => {
  const sebelum = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!sebelum) return res.status(404).json({ message: 'Naskah tidak ditemukan' })

  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: {
      status: 'terbit',
      catatanAdmin: '',
      // Cuma diisi PERTAMA KALI naskah ini terbit, supaya tanggal terbit
      // yang tampil ke pembaca adalah kapan naskah pertama disetujui —
      // bukan ikut berubah tiap kali baris ini disentuh lagi nanti.
      ...(!sebelum.publishedAt && { publishedAt: new Date() }),
    },
    include: { penulis: true },
  })

  await buatNotifikasi({
    userId: post.penulisId,
    tipe: 'naskah_disetujui',
    pesan: `Naskahmu "${post.judul}" telah disetujui dan terbit.`,
    link: `/post/${post.id}`,
  })
  // Fire-and-forget — jangan tunggu semua notifikasi pengikut selesai
  // sebelum membalas admin, supaya panel admin tetap terasa responsif.
  beriTahuPengikut({
    penulisId: post.penulisId,
    penulisNama: post.penulis.namaPena,
    postId: post.id,
    judul: post.judul,
  })

  catatLogAdmin({ adminId: req.userId, aksi: 'naskah_disetujui', target: post.judul })
  res.json(post)
})

router.put('/naskah/:id/tolak', async (req, res) => {
  const { catatan } = req.body
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: { status: 'ditolak', catatanAdmin: catatan || 'Tidak sesuai pedoman komunitas' },
  })

  await buatNotifikasi({
    userId: post.penulisId,
    tipe: 'naskah_ditolak',
    pesan: `Naskahmu "${post.judul}" ditolak. Cek catatan admin di dasbor.`,
    link: `/dashboard`,
  })

  catatLogAdmin({ adminId: req.userId, aksi: 'naskah_ditolak', target: post.judul, detail: catatan || '' })
  res.json(post)
})

router.delete('/posts/:id', async (req, res) => {
  const target = await prisma.post.findUnique({ where: { id: req.params.id } })
  await prisma.post.delete({ where: { id: req.params.id } })
  catatLogAdmin({ adminId: req.userId, aksi: 'naskah_dihapus', target: target?.judul || req.params.id })
  res.json({ message: 'Naskah dihapus' })
})

router.delete('/comments/:id', async (req, res) => {
  const target = await prisma.comment.findUnique({ where: { id: req.params.id } })
  await prisma.comment.delete({ where: { id: req.params.id } })
  catatLogAdmin({ adminId: req.userId, aksi: 'komentar_dihapus', target: target?.isi?.slice(0, 60) || req.params.id })
  res.json({ message: 'Komentar dihapus' })
})

// Daftar laporan konten (naskah/komentar) dari pembaca. Default cuma
// tampilkan yang "baru" (belum ditindak), atau semua kalau ?status=semua.
router.get('/laporan', async (req, res) => {
  const { status } = req.query
  const where = status === 'semua' ? {} : { status: 'baru' }

  const laporan = await prisma.report.findMany({
    where,
    include: {
      post: { select: { id: true, judul: true } },
      comment: { select: { id: true, isi: true, postId: true } },
      pelapor: { select: { username: true, namaPena: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(laporan)
})

// Tandai laporan sudah ditindaklanjuti (tanpa harus menghapus kontennya —
// admin bisa saja memutuskan laporannya tidak valid).
router.put('/laporan/:id/selesai', async (req, res) => {
  const laporan = await prisma.report.update({
    where: { id: req.params.id },
    data: { status: 'selesai' },
  })
  catatLogAdmin({ adminId: req.userId, aksi: 'laporan_selesai', target: laporan.postId ? `naskah #${laporan.postId}` : `komentar #${laporan.commentId}` })
  res.json(laporan)
})

// Riwayat aksi admin (audit log) — 100 baris terakhir, terbaru duluan.
// Ditaruh paling bawah supaya tidak bentrok dengan route ":id" manapun
// di atasnya (di sini tidak ada, tapi konsisten dengan pola di posts.js).
router.get('/log', async (req, res) => {
  const log = await prisma.adminLog.findMany({
    include: { admin: { select: { username: true, namaPena: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  res.json(log.map((l) => ({
    id: l.id,
    aksi: l.aksi,
    target: l.target,
    detail: l.detail,
    createdAt: l.createdAt,
    admin: l.admin ? (l.admin.namaPena || l.admin.username) : 'Akun terhapus',
  })))
})

export default router
