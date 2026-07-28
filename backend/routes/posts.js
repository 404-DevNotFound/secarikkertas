import express from 'express'
import multer from 'multer'
import sanitizeHtml from 'sanitize-html'
import mammoth from 'mammoth'
import pdfParse from 'pdf-parse'
import { put, del } from '@vercel/blob'
import prisma from '../data/prisma.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import { buatNotifikasi } from '../utils/notify.js'

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

const uploadGambar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // gambar maks 5MB
})

router.get('/', optionalAuth, async (req, res) => {
  const { tipe, q, kategori, sort } = req.query
  const halaman = Math.max(1, parseInt(req.query.page, 10) || 1)
  const batas = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 6))

  const where = {
    status: 'terbit',
    ...(tipe && { tipe }),
    ...(kategori && { kategori }),
    // Pencarian sekarang mencakup judul, isi tulisan, dan nama pena
    // penulis — bukan cuma judul — supaya lebih gampang ketemu tulisan
    // walau kata kuncinya bukan bagian dari judul.
    ...(q && {
      OR: [
        { judul: { contains: q, mode: 'insensitive' } },
        { isi: { contains: q, mode: 'insensitive' } },
        { penulis: { namaPena: { contains: q, mode: 'insensitive' } } },
      ],
    }),
  }

  // "terpopuler" diurutkan dari jumlah suka lalu jumlah dibaca sebagai
  // pemecah seri — dilakukan di memori (bukan orderBy Prisma) karena
  // jumlah suka berasal dari relasi (_count), sedangkan halamannya tetap
  // dipotong di database dulu lewat skip/take berbasis createdAt supaya
  // tidak perlu tarik SEMUA baris "terbit" ke memori pada situs besar.
  const urutan = sort === 'terpopuler'
    ? [{ likes: { _count: 'desc' } }, { viewCount: 'desc' }]
    : { createdAt: 'desc' }

  const [posts, total, idTersimpan] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { penulis: true, likes: true },
      orderBy: urutan,
      skip: (halaman - 1) * batas,
      take: batas,
    }),
    prisma.post.count({ where }),
    // Set id naskah yang sudah disimpan akun yang login, dipakai supaya
    // tombol "Simpan" di kartu daftar langsung tampil sesuai status
    // sebenarnya (bukan cuma reset ke belum-tersimpan tiap kali reload).
    req.userId
      ? prisma.bookmark.findMany({ where: { userId: req.userId }, select: { postId: true } })
      : [],
  ])
  const setTersimpan = new Set(idTersimpan.map((b) => b.postId))

  const hasil = posts.map((p) => ({
    id: p.id,
    judul: p.judul,
    penulis: p.penulis.namaPena,
    penulisUsername: p.penulis.username,
    ringkasan: p.isi.slice(0, 120),
    likes: p.likes.length,
    viewCount: p.viewCount,
    disimpanAwal: setTersimpan.has(p.id),
    // Status suka akun yang sedang login, ditentukan dari data server —
    // bukan cuma disimpan lokal di browser/perangkat. Ini yang bikin
    // status "sudah suka" konsisten walau ganti perangkat/browser.
    sudahSuka: req.userId ? p.likes.some((l) => l.userId === req.userId) : false,
    kategori: p.kategori,
    tipe: p.tipe,
    gambarSampul: p.gambarSampul,
    // Pakai updatedAt sebagai tanggal terbit — field ini otomatis ke-update
    // Prisma tiap kali status berubah jadi "terbit", dan naskah yang sudah
    // terbit tidak bisa diedit lagi, jadi nilainya stabil sebagai "kapan terbit"
    tanggalTerbit: p.updatedAt,
  }))

  res.json({
    data: hasil,
    page: halaman,
    totalPages: Math.max(1, Math.ceil(total / batas)),
    total,
  })
})

// Tulisan yang disimpan pemakai yang sedang login untuk dibaca nanti.
// Ditaruh SEBELUM "/:id" (seperti "/saya" di atasnya) supaya Express
// tidak salah mencocokkan "tersimpan" sebagai parameter :id.
router.get('/tersimpan', requireAuth, async (req, res) => {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: req.userId },
    include: { post: { include: { penulis: true, likes: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const hasil = bookmarks
    .filter((b) => b.post.status === 'terbit')
    .map((b) => ({
      id: b.post.id,
      judul: b.post.judul,
      penulis: b.post.penulis.namaPena,
      penulisUsername: b.post.penulis.username,
      ringkasan: b.post.isi.slice(0, 120),
      likes: b.post.likes.length,
      viewCount: b.post.viewCount,
      sudahSuka: b.post.likes.some((l) => l.userId === req.userId),
      kategori: b.post.kategori,
      tipe: b.post.tipe,
      gambarSampul: b.post.gambarSampul,
      tanggalTerbit: b.post.updatedAt,
      disimpanPada: b.createdAt,
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

router.get('/:id', optionalAuth, async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: { penulis: true, likes: true },
  })
  if (!post) return res.status(404).json({ message: 'Tidak ditemukan' })

  // Hitungan dibaca cuma dinaikkan untuk naskah yang sudah terbit (bukan
  // draft/preview admin), dan tidak menunggu (await) supaya tidak
  // memperlambat respons ke pembaca.
  if (post.status === 'terbit') {
    prisma.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }).catch(() => {})
  }

  const sudahBookmark = req.userId
    ? !!(await prisma.bookmark.findUnique({
        where: { postId_userId: { postId: post.id, userId: req.userId } },
      }))
    : false

  res.json({
    ...post,
    penulis: post.penulis.namaPena,
    penulisUsername: post.penulis.username,
    likes: post.likes.length,
    sudahSuka: req.userId ? post.likes.some((l) => l.userId === req.userId) : false,
    sudahBookmark,
  })
})

// Beberapa tulisan lain yang sekategori, untuk rekomendasi di akhir
// halaman baca. Ditaruh di sini (bukan "/:id/terkait" dengan awalan yang
// sama) supaya urutan route Express tidak bentrok dengan "/:id" di atas.
router.get('/:id/terkait', async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post) return res.status(404).json({ message: 'Tidak ditemukan' })

  const terkait = await prisma.post.findMany({
    where: {
      status: 'terbit',
      id: { not: post.id },
      kategori: post.kategori,
    },
    include: { penulis: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  res.json(
    terkait.map((p) => ({
      id: p.id,
      judul: p.judul,
      penulis: p.penulis.namaPena,
      gambarSampul: p.gambarSampul,
      tipe: p.tipe,
    }))
  )
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
  if (!post) return res.status(404).json({ message: 'Tidak ditemukan' })

  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  const isAdmin = user?.role === 'admin'

  if (post.penulisId !== req.userId && !isAdmin) {
    return res.status(403).json({ message: 'Tidak diizinkan' })
  }
  // Admin boleh mengedit naskah kapan pun, termasuk yang sudah terbit
  // (dipakai fitur "Edit & Terbitkan Ulang"). Penulis biasa cuma boleh
  // edit selagi draft/ditolak.
  if (!isAdmin && !['draft', 'ditolak'].includes(post.status)) {
    return res.status(400).json({ message: 'Naskah sedang ditinjau/terbit, tidak bisa diedit' })
  }

  const { judul, isi, kategori } = req.body
  const isiHtml = isi !== undefined ? sanitizeHtml(isi, {
    allowedTags: ['p', 'div', 'b', 'i', 'em', 'strong', 'br', 'blockquote', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: { a: ['href'], p: ['style'], div: ['style'] },
    allowedStyles: {
      p: { 'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/] },
      div: { 'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/] },
    },
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

// POST /api/posts/:id/cover - upload/ganti gambar sampul
router.post('/:id/cover', requireAuth, uploadGambar.single('file'), async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post) return res.status(404).json({ message: 'Tidak ditemukan' })

  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  const isAdmin = user?.role === 'admin'

  if (post.penulisId !== req.userId && !isAdmin) {
    return res.status(403).json({ message: 'Tidak diizinkan' })
  }
  if (!req.file) {
    return res.status(400).json({ message: 'Tidak ada gambar yang diunggah' })
  }
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ message: 'File harus berupa gambar' })
  }

  // Hapus gambar lama dulu dari Blob storage kalau ada, biar tidak numpuk
  // file "sampah" yang sudah tidak dipakai.
  if (post.gambarSampul) {
    try {
      await del(post.gambarSampul)
    } catch (err) {
      console.warn('Gagal hapus gambar lama (mungkin sudah tidak ada):', err.message)
    }
  }

  const namaUnik = `sampul/${req.params.id}-${Date.now()}-${req.file.originalname}`
  const blob = await put(namaUnik, req.file.buffer, {
    access: 'public',
    contentType: req.file.mimetype,
  })

  const updated = await prisma.post.update({
    where: { id: req.params.id },
    data: { gambarSampul: blob.url },
  })
  res.json(updated)
})

// DELETE /api/posts/:id/cover - hapus gambar sampul (tanpa hapus naskahnya)
router.delete('/:id/cover', requireAuth, async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post) return res.status(404).json({ message: 'Tidak ditemukan' })

  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  const isAdmin = user?.role === 'admin'

  if (post.penulisId !== req.userId && !isAdmin) {
    return res.status(403).json({ message: 'Tidak diizinkan' })
  }
  if (post.gambarSampul) {
    try {
      await del(post.gambarSampul)
    } catch (err) {
      console.warn('Gagal hapus file gambar:', err.message)
    }
  }
  const updated = await prisma.post.update({
    where: { id: req.params.id },
    data: { gambarSampul: null },
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
    return res.status(400).json({ message: 'Naskah yang sudah terbit hanya bisa dihapus oleh admin' })
  }

  if (post.gambarSampul) {
    try {
      await del(post.gambarSampul)
    } catch (err) {
      console.warn('Gagal hapus gambar sampul saat hapus naskah:', err.message)
    }
  }

  await prisma.post.delete({ where: { id: req.params.id } })
  res.json({ message: 'Draf dihapus' })
})

router.put('/:id/ajukan', requireAuth, async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post) return res.status(404).json({ message: 'Tidak ditemukan' })

  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  const isAdmin = user?.role === 'admin'

  if (post.penulisId !== req.userId && !isAdmin) {
    return res.status(403).json({ message: 'Tidak diizinkan' })
  }
  if (!post.judul || post.judul === 'Tanpa judul' || post.isi.length < 50) {
    return res.status(400).json({ message: 'Lengkapi judul dan isi (minimal 50 karakter) sebelum mengajukan' })
  }

  // Admin: langsung terbit (dipakai juga untuk "Terbitkan Ulang" naskah
  // yang sudah terbit sebelumnya). Penulis biasa: masuk antrean tinjauan.
  const statusBaru = isAdmin ? 'terbit' : 'diajukan'

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
    allowedTags: ['p', 'div', 'b', 'i', 'em', 'strong', 'br', 'blockquote', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: { a: ['href'], p: ['style'], div: ['style'] },
    allowedStyles: {
      p: { 'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/] },
      div: { 'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/] },
    },
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

// Simpan/batal simpan tulisan ke daftar bacaan pribadi ("Tersimpan").
router.post('/:id/bookmark', requireAuth, async (req, res) => {
  const { disimpan } = req.body
  const postId = req.params.id

  if (disimpan) {
    await prisma.bookmark.upsert({
      where: { postId_userId: { postId, userId: req.userId } },
      update: {},
      create: { postId, userId: req.userId },
    })
  } else {
    await prisma.bookmark.deleteMany({ where: { postId, userId: req.userId } })
  }

  res.json({ sudahBookmark: !!disimpan })
})

// Lapor naskah karena melanggar (konten tidak pantas, plagiarisme, dll).
router.post('/:id/laporkan', requireAuth, async (req, res) => {
  const { alasan, detail } = req.body
  if (!alasan || !alasan.trim()) {
    return res.status(400).json({ message: 'Pilih alasan laporan terlebih dahulu' })
  }
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post) return res.status(404).json({ message: 'Tidak ditemukan' })

  await prisma.report.create({
    data: {
      alasan: alasan.trim(),
      detail: (detail || '').trim(),
      postId: post.id,
      pelaporId: req.userId,
    },
  })
  res.json({ message: 'Terima kasih, laporanmu sudah dikirim ke admin untuk ditinjau.' })
})

// Komentar dikembalikan flat (dengan parentId) — frontend yang menyusun
// jadi pohon (komentar utama + balasannya), supaya query di sini tetap
// sederhana (satu findMany, tanpa recursive query).
router.get('/:id/comments', async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { postId: req.params.id },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  })

  const hasil = comments.map((c) => ({
    id: c.id,
    isi: c.isi,
    nama: c.user ? c.user.namaPena : (c.namaTamu || 'Anonim'),
    waktu: c.createdAt,
    anonim: !c.user,
    parentId: c.parentId,
  }))
  res.json(hasil)
})

router.post('/:id/comments', optionalAuth, async (req, res) => {
  const { isi, namaTamu, parentId } = req.body
  if (!isi || !isi.trim()) {
    return res.status(400).json({ message: 'Komentar tidak boleh kosong' })
  }

  // Kalau ini balasan, pastikan komentar induknya benar-benar ada dan
  // milik naskah yang sama — cegah balasan "nyasar" ke naskah lain.
  if (parentId) {
    const induk = await prisma.comment.findUnique({ where: { id: parentId } })
    if (!induk || induk.postId !== req.params.id) {
      return res.status(400).json({ message: 'Komentar induk tidak valid' })
    }
  }

  const isiBersih = sanitizeHtml(isi.trim(), { allowedTags: [], allowedAttributes: {} })

  const comment = await prisma.comment.create({
    data: {
      isi: isiBersih,
      postId: req.params.id,
      userId: req.userId || null,
      parentId: parentId || null,
      namaTamu: req.userId ? null : (sanitizeHtml((namaTamu || '').trim(), { allowedTags: [], allowedAttributes: {} }) || 'Anonim'),
    },
    include: { user: true },
  })

  // Beri tahu penulis naskah kalau ada komentar baru masuk (kecuali kalau
  // yang berkomentar adalah penulisnya sendiri).
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (post && post.penulisId !== req.userId) {
    await buatNotifikasi({
      userId: post.penulisId,
      tipe: 'komentar',
      pesan: `${comment.user ? comment.user.namaPena : (comment.namaTamu || 'Anonim')} mengomentari "${post.judul}"`,
      link: `/post/${post.id}`,
    })
  }

  res.json({
    id: comment.id,
    isi: comment.isi,
    nama: comment.user ? comment.user.namaPena : (comment.namaTamu || 'Anonim'),
    waktu: comment.createdAt,
    anonim: !comment.user,
    parentId: comment.parentId,
  })
})

// Lapor komentar karena melanggar.
router.post('/comments/:id/laporkan', requireAuth, async (req, res) => {
  const { alasan, detail } = req.body
  if (!alasan || !alasan.trim()) {
    return res.status(400).json({ message: 'Pilih alasan laporan terlebih dahulu' })
  }
  const comment = await prisma.comment.findUnique({ where: { id: req.params.id } })
  if (!comment) return res.status(404).json({ message: 'Komentar tidak ditemukan' })

  await prisma.report.create({
    data: {
      alasan: alasan.trim(),
      detail: (detail || '').trim(),
      commentId: comment.id,
      pelaporId: req.userId,
    },
  })
  res.json({ message: 'Terima kasih, laporanmu sudah dikirim ke admin untuk ditinjau.' })
})

export default router
