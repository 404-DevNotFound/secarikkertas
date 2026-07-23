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

// Security headers (cegah clickjacking, XSS lewat header, dll)
app.use(helmet())

// CORS: hanya izinkan domain frontend kamu, bukan wildcard "*"
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',')
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true)
    else callback(new Error('Ditolak oleh kebijakan CORS'))
  },
}))

// Batasi body request supaya tidak dibanjiri payload raksasa
app.use(express.json({ limit: '1mb' }))

// Rate limit global — proteksi tambahan selain yang khusus di auth.js
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // 300 request per 15 menit per IP, cukup longgar untuk pemakaian normal
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(globalLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/users', userRoutes)
app.use('/api/admin', adminRoutes)

app.get('/', (req, res) => res.send('secarikkertas API jalan ✅'))

// Jangan bocorkan detail error teknis ke publik
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: 'Terjadi kesalahan pada server' })
})

if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => console.log(`Server jalan di http://localhost:${PORT}`))
}

export default app
