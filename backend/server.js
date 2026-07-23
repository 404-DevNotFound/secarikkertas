import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.js'
import postRoutes from './routes/posts.js'
import userRoutes from './routes/users.js'
import adminRoutes from './routes/admin.js'

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

app.get('/', (req, res) => res.send('secarikkertas API jalan ✅'))

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
