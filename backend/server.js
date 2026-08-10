import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.js'
import postRoutes from './routes/posts.js'
import userRoutes from './routes/users.js'
import adminRoutes from './routes/admin.js'
import genreRoutes from './routes/genres.js'
import notificationRoutes from './routes/notifications.js'
import collectionRoutes from './routes/collections.js'
import prisma from './data/prisma.js'

const app = express()

app.use(helmet())

// CORS: hanya izinkan domain frontend kamu, bukan wildcard "*"
// Boleh isi beberapa domain dipisah koma di ALLOWED_ORIGINS (env var).
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // origin kosong = request dari server-ke-server / curl / Postman, izinkan
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      // Tolak dengan rapi (403), JANGAN throw Error di sini —
      // throw di callback CORS bikin Express crash jadi 500 untuk semua orang,
      // padahal cuma origin ini saja yang seharusnya ditolak.
      callback(null, false)
    }
  },
}))

app.use(express.json({ limit: '1mb' }))

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(globalLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/users', userRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/genres', genreRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/collections', collectionRoutes)

app.get('/', (req, res) => res.send('secarikkertas API jalan ✅'))

// Feed RSS publik — 30 naskah terbit terbaru, supaya pembaca setia bisa
// berlangganan lewat pembaca RSS (Feedly, dst) tanpa perlu buka situsnya.
// Diletakkan di /rss.xml (bukan di bawah /api) supaya URL-nya pendek &
// gampang diingat/dibagikan, sesuai konvensi feed pada umumnya.
function escapeXml(teks) {
  return String(teks || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

app.get('/rss.xml', async (req, res) => {
  const situsUrl = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',')[0].trim()
  const posts = await prisma.post.findMany({
    where: { status: 'terbit' },
    include: { penulis: true },
    orderBy: { updatedAt: 'desc' },
    take: 30,
  })

  const items = posts.map((p) => `
    <item>
      <title>${escapeXml(p.judul)}</title>
      <link>${situsUrl}/post/${p.id}</link>
      <guid>${situsUrl}/post/${p.id}</guid>
      <pubDate>${new Date(p.updatedAt).toUTCString()}</pubDate>
      <author>${escapeXml(p.penulis.namaPena)}</author>
      <description>${escapeXml(p.isi.slice(0, 300))}</description>
    </item>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>secarikkertas</title>
    <link>${situsUrl}</link>
    <description>Cerpen dan artikel terbaru dari secarikkertas</description>
    <language>id-ID</language>${items}
  </channel>
</rss>`

  res.set('Content-Type', 'application/rss+xml; charset=utf-8')
  res.send(xml)
})

// Tangkap error tak terduga apapun supaya user tetap dapat pesan rapi,
// bukan halaman error mentah. Detail teknisnya tetap masuk log server (console.error)
// supaya kamu (developer) bisa lihat di Vercel > Deployments > Logs.
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ message: 'Terjadi kesalahan pada server' })
})

if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => console.log(`Server jalan di http://localhost:${PORT}`))
}

export default app
