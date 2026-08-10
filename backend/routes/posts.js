import express from 'express'
import multer from 'multer'
import sanitizeHtml from 'sanitize-html'
import mammoth from 'mammoth'
import pdfParse from 'pdf-parse'
import rateLimit from 'express-rate-limit'
import { put, del } from '@vercel/blob'
import prisma from '../data/prisma.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import { buatNotifikasi } from '../utils/notify.js'
import { periksaKonten } from '../utils/moderasiKonten.js'

const router = express.Router()

// Komentar TIDAK wajib login (bisa tamu), jadi paling rawan dipakai buat
// spam massal — dibatasi lebih ketat daripada limiter global di server.js.
const commentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 menit
  max: 20,
  message: { message: 'Terlalu sering berkomentar, coba lagi beberapa menit lagi' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Laporan wajib login, tapi tetap dibatasi supaya tidak dipakai buat
// membanjiri antrean moderasi admin dengan laporan asal-asalan.
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: 'Terlalu banyak laporan dikirim, coba lagi beberapa menit lagi' },
  standardHeaders: true,
  legacyHeaders: false,
})

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

const uploadGambar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // gambar maks 5MB
})

// "tags" di query string boleh satu nama tag atau beberapa dipisah koma
// (mis. ?tags=Horor,Drama) — tulisan yang punya SALAH SATU dari tag itu
// akan ikut muncul (OR, bukan AND), supaya makin banyak tag dipilih makin
// banyak juga hasil yang tampil (seperti filter kategori sebelumnya, cuma
// sekarang bisa lebih dari satu sekaligus).
function uraikanTags(nilai) {
  if (!nilai) return []
  return String(nilai)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

router.get('/', optionalAuth, async (req, res) => {
  const { tipe, q, tags, sort } = req.query
  const halaman = Math.max(1, parseInt(req.query.page, 10) || 1)
  const batas = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 6))
  const daftarTag = uraikanTags(tags)

  const where = {
    status: 'terbit',
    ...(tipe && { tipe }),
    ...(daftarTag.length > 0 && { tags: { some: { nama: { in: daftarTag } } } }),
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
      include: { penulis: true, likes: true, tags: { select: { nama: true } } },
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
    tags: p.tags.map((t) => t.nama),
    tipe: p.tipe,
    gambarSampul: p.gambarSampul,
    // publishedAt diisi sekali saat naskah pertama kali disetujui/terbit
    // (lihat PUT /:id/ajukan & admin.js PUT /naskah/:id/setujui) dan tidak
    // berubah lagi sesudahnya — beda dari updatedAt yang ikut maju tiap
    // kali baris ini disentuh apa pun (mis. viewCount bertambah).
    tanggalTerbit: p.publishedAt,
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
    include: { post: { include: { penulis: true, likes: true, tags: { select: { nama: true } } } } },
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
      tags: b.post.tags.map((t) => t.nama),
      tipe: b.post.tipe,
      gambarSampul: b.post.gambarSampul,
      tanggalTerbit: b.post.publishedAt,
      disimpanPada: b.createdAt,
      collectionId: b.collectionId,
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

// Ringkasan statistik untuk dasbor penulis: total per naskah + aktivitas
// harian (suka & komentar) 14 hari terakhir. Sengaja dibangun dari data
// yang sudah ada (Like.createdAt, Comment.createdAt) — tidak perlu tabel
// pencatat "kunjungan" baru cuma untuk grafik ini.
router.get('/saya/statistik', requireAuth, async (req, res) => {
  const posts = await prisma.post.findMany({
    where: { penulisId: req.userId },
    include: {
      _count: { select: { likes: true, comments: true, bookmarks: true, reaksi: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
  const postIds = posts.map((p) => p.id)

  const H14_MS = 14 * 24 * 60 * 60 * 1000
  const sejak = new Date(Date.now() - H14_MS)

  const [likesBaru, komentarBaru] = postIds.length === 0 ? [[], []] : await Promise.all([
    prisma.like.findMany({ where: { postId: { in: postIds }, createdAt: { gte: sejak } }, select: { createdAt: true } }),
    prisma.comment.findMany({ where: { postId: { in: postIds }, createdAt: { gte: sejak } }, select: { createdAt: true } }),
  ])

  // Bentuk 14 slot tanggal (YYYY-MM-DD) berurutan, isi 0 dulu supaya
  // grafik tetap punya sumbu-x lengkap walau harinya sepi aktivitas.
  const slot = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    slot[d.toISOString().slice(0, 10)] = { tanggal: d.toISOString().slice(0, 10), suka: 0, komentar: 0 }
  }
  likesBaru.forEach((l) => {
    const key = new Date(l.createdAt).toISOString().slice(0, 10)
    if (slot[key]) slot[key].suka += 1
  })
  komentarBaru.forEach((c) => {
    const key = new Date(c.createdAt).toISOString().slice(0, 10)
    if (slot[key]) slot[key].komentar += 1
  })

  const perNaskah = posts.map((p) => ({
    id: p.id,
    judul: p.judul,
    tipe: p.tipe,
    status: p.status,
    viewCount: p.viewCount,
    jumlahSuka: p._count.likes,
    jumlahKomentar: p._count.comments,
    jumlahTersimpan: p._count.bookmarks,
    jumlahReaksi: p._count.reaksi,
    publishedAt: p.publishedAt,
  }))

  const ringkasan = perNaskah.reduce(
    (acc, p) => ({
      totalTulisan: acc.totalTulisan + 1,
      totalTerbit: acc.totalTerbit + (p.status === 'terbit' ? 1 : 0),
      totalDibaca: acc.totalDibaca + p.viewCount,
      totalSuka: acc.totalSuka + p.jumlahSuka,
      totalKomentar: acc.totalKomentar + p.jumlahKomentar,
      totalTersimpan: acc.totalTersimpan + p.jumlahTersimpan,
    }),
    { totalTulisan: 0, totalTerbit: 0, totalDibaca: 0, totalSuka: 0, totalKomentar: 0, totalTersimpan: 0 },
  )

  res.json({
    ringkasan,
    perNaskah: perNaskah.sort((a, b) => b.viewCount - a.viewCount),
    aktivitasHarian: Object.values(slot),
  })
})

// Rekomendasi personal sederhana: cari tag dari tulisan yang pernah
// disukai/disimpan pengguna, lalu sarankan tulisan LAIN terbit yang
// berbagi tag itu (belum pernah disukai/disimpan olehnya). Kalau
// pengguna belum pernah berinteraksi sama sekali, kembalikan array kosong
// — biarkan bagian "Terbaru"/"Terpopuler" di beranda yang mengisi.
router.get('/rekomendasi', requireAuth, async (req, res) => {
  const [disukai, disimpan] = await Promise.all([
    prisma.like.findMany({ where: { userId: req.userId }, select: { postId: true } }),
    prisma.bookmark.findMany({ where: { userId: req.userId }, select: { postId: true } }),
  ])
  const idDiketahui = [...new Set([...disukai.map((l) => l.postId), ...disimpan.map((b) => b.postId)])]
  if (idDiketahui.length === 0) return res.json([])

  const postDiketahui = await prisma.post.findMany({
    where: { id: { in: idDiketahui } },
    include: { tags: { select: { nama: true } } },
  })
  const namaTags = [...new Set(postDiketahui.flatMap((p) => p.tags.map((t) => t.nama)))]
  if (namaTags.length === 0) return res.json([])

  const rekomendasi = await prisma.post.findMany({
    where: {
      status: 'terbit',
      id: { notIn: idDiketahui },
      tags: { some: { nama: { in: namaTags } } },
    },
    include: { penulis: true, likes: true, tags: { select: { nama: true } } },
    orderBy: { viewCount: 'desc' },
    take: 5,
  })

  res.json(rekomendasi.map((p) => ({
    id: p.id,
    judul: p.judul,
    penulis: p.penulis.namaPena,
    penulisUsername: p.penulis.username,
    gambarSampul: p.gambarSampul,
    tipe: p.tipe,
    tags: p.tags.map((t) => t.nama),
    likes: p.likes.length,
  })))
})

router.get('/:id', optionalAuth, async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: { penulis: true, likes: true, tags: { select: { nama: true } }, reaksi: true },
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

  // Rekap reaksi per jenis, mis. { terharu: 3, terinspirasi: 1 } — jenis
  // yang jumlahnya nol tidak ikut dikirim, biar payload-nya ringkas.
  const reaksiCount = {}
  post.reaksi.forEach((r) => { reaksiCount[r.tipe] = (reaksiCount[r.tipe] || 0) + 1 })
  const reaksiSaya = req.userId ? (post.reaksi.find((r) => r.userId === req.userId)?.tipe || null) : null

  res.json({
    ...post,
    reaksi: undefined,
    penulis: post.penulis.namaPena,
    penulisUsername: post.penulis.username,
    likes: post.likes.length,
    tags: post.tags.map((t) => t.nama),
    sudahSuka: req.userId ? post.likes.some((l) => l.userId === req.userId) : false,
    sudahBookmark,
    reaksiCount,
    reaksiSaya,
  })
})

// Pilih/ganti/batalkan reaksi ekspresif di halaman baca (terpisah dari
// "suka" di kartu tulisan — lihat catatan di model Reaction). Kirim tipe
// yang SAMA dengan reaksi aktif saat ini untuk membatalkannya.
const TIPE_REAKSI_VALID = ['terharu', 'terinspirasi', 'lucu', 'mikir']
router.post('/:id/reaksi', requireAuth, async (req, res) => {
  const { tipe } = req.body
  const postId = req.params.id

  const aktif = await prisma.reaction.findUnique({
    where: { postId_userId: { postId, userId: req.userId } },
  })

  if (!tipe || (aktif && aktif.tipe === tipe)) {
    // Tidak kirim tipe, atau kirim tipe yang sama dengan reaksi aktif -> batalkan
    if (aktif) await prisma.reaction.delete({ where: { id: aktif.id } })
  } else {
    if (!TIPE_REAKSI_VALID.includes(tipe)) {
      return res.status(400).json({ message: 'Jenis reaksi tidak valid' })
    }
    await prisma.reaction.upsert({
      where: { postId_userId: { postId, userId: req.userId } },
      update: { tipe },
      create: { postId, userId: req.userId, tipe },
    })
  }

  const semua = await prisma.reaction.findMany({ where: { postId } })
  const reaksiCount = {}
  semua.forEach((r) => { reaksiCount[r.tipe] = (reaksiCount[r.tipe] || 0) + 1 })
  const reaksiSaya = semua.find((r) => r.userId === req.userId)?.tipe || null

  res.json({ reaksiCount, reaksiSaya })
})

// Beberapa tulisan lain yang berbagi tag, untuk rekomendasi di akhir tulisan
// halaman baca. Ditaruh di sini (bukan "/:id/terkait" dengan awalan yang
// sama) supaya urutan route Express tidak bentrok dengan "/:id" di atas.
router.get('/:id/terkait', async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id }, include: { tags: true } })
  if (!post) return res.status(404).json({ message: 'Tidak ditemukan' })

  // "Terkait" sekarang berarti berbagi minimal SATU tag yang sama (dulu:
  // harus kategori tunggalnya persis sama). Tulisan tanpa tag sama sekali
  // tidak akan punya rekomendasi terkait — itu wajar, tidak ada dasar
  // kemiripannya.
  const namaTags = post.tags.map((t) => t.nama)
  const terkait = namaTags.length === 0 ? [] : await prisma.post.findMany({
    where: {
      status: 'terbit',
      id: { not: post.id },
      tags: { some: { nama: { in: namaTags } } },
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
  const { judul, tipe } = req.body
  const post = await prisma.post.create({
    data: {
      judul: judul || 'Tanpa judul',
      tipe: tipe || 'cerpen',
      penulisId: req.userId,
    },
    include: { tags: { select: { nama: true } } },
  })
  res.json({ ...post, tags: post.tags.map((t) => t.nama) })
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

  const { judul, isi, tags } = req.body
  const isiHtml = isi !== undefined ? sanitizeHtml(isi, {
    allowedTags: ['p', 'div', 'b', 'i', 'em', 'strong', 'br', 'blockquote', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: { a: ['href'], p: ['style'], div: ['style'] },
    allowedStyles: {
      p: { 'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/] },
      div: { 'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/] },
    },
  }) : undefined

  // "tags" datang sebagai array nama (string) dari TagInput di frontend —
  // dibersihkan dulu (buang spasi berlebih & duplikat, batasi panjang &
  // jumlah biar tidak disalahgunakan) sebelum dipakai mengganti relasi.
  // set: [] dulu baru connectOrCreate = cara Prisma mengganti SELURUH isi
  // relasi many-to-many sekaligus (bukan menambah di atas tag lama).
  const daftarTag = Array.isArray(tags)
    ? [...new Set(tags.map((t) => String(t).trim()).filter(Boolean))]
        .slice(0, 10)
        .map((t) => t.slice(0, 40))
    : undefined

  const updated = await prisma.post.update({
    where: { id: req.params.id },
    data: {
      ...(judul !== undefined && { judul }),
      ...(isi !== undefined && { isi, isiHtml }),
      ...(daftarTag !== undefined && {
        tags: {
          set: [],
          connectOrCreate: daftarTag.map((nama) => ({
            where: { nama },
            create: { nama },
          })),
        },
      }),
    },
    include: { tags: { select: { nama: true } } },
  })
  res.json({ ...updated, tags: updated.tags.map((t) => t.nama) })
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

  // Bukan penghalang (naskah tetap masuk antrean seperti biasa) — cuma
  // tanda peringatan dini buat admin, ditaruh di catatanAdmin supaya
  // langsung kelihatan di panel Antrean Naskah saat ditinjau manual.
  const cekModerasi = periksaKonten(post.judul + ' ' + post.isi)
  const catatanAwal = cekModerasi.bermasalah
    ? `⚑ Terdeteksi otomatis: ${cekModerasi.alasan.toLowerCase()} — mohon tinjau lebih cermat.`
    : ''

  const updated = await prisma.post.update({
    where: { id: req.params.id },
    data: {
      status: statusBaru,
      catatanAdmin: statusBaru === 'terbit' ? '' : catatanAwal,
      // Cuma diisi PERTAMA KALI naskah ini terbit — kalau sebelumnya sudah
      // pernah punya publishedAt (mis. "Terbitkan Ulang"), tanggal terbit
      // aslinya dipertahankan, tidak ikut maju ke hari ini.
      ...(statusBaru === 'terbit' && !post.publishedAt && { publishedAt: new Date() }),
    },
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
router.post('/:id/laporkan', requireAuth, reportLimiter, async (req, res) => {
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

router.post('/:id/comments', commentLimiter, optionalAuth, async (req, res) => {
  const { isi, namaTamu, parentId } = req.body
  if (!isi || !isi.trim()) {
    return res.status(400).json({ message: 'Komentar tidak boleh kosong' })
  }

  // Komentar tayang LANGSUNG tanpa antrean tinjauan admin (beda dari
  // naskah) — jadi lapisan filter kata kasar/spam di sini yang menahan
  // kasus paling jelas sebelum sempat terlihat pengguna lain.
  const cekModerasi = periksaKonten(isi)
  if (cekModerasi.bermasalah) {
    return res.status(400).json({ message: `Komentar tidak bisa dikirim: ${cekModerasi.alasan.toLowerCase()}` })
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
router.post('/comments/:id/laporkan', requireAuth, reportLimiter, async (req, res) => {
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
