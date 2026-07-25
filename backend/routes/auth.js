import express from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import prisma from '../data/prisma.js'
import { requireAuth, SECRET } from '../middleware/auth.js'
import { kirimKodeVerifikasi } from '../utils/email.js'

const router = express.Router()

// Batasi percobaan login/register — cegah brute force & bot spam ("judol")
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // maksimal 10 percobaan per IP per 15 menit
  message: { message: 'Terlalu banyak percobaan, coba lagi beberapa menit lagi' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Endpoint kirim-ulang kode dibatasi lebih ketat — ini yang paling gampang
// dipakai buat spam kalau tidak dibatasi (tinggal panggil berkali-kali,
// tanpa perlu isi form apapun).
const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Terlalu banyak percobaan kirim ulang, coba lagi beberapa menit lagi' },
  standardHeaders: true,
  legacyHeaders: false,
})

const MASA_BERLAKU_KODE_MS = 5 * 60 * 1000 // 5 menit

function buatKodeVerifikasi() {
  // Angka 6 digit, boleh ada 0 di depan (dipadding), pakai crypto biar
  // tidak gampang ditebak (bukan Math.random()).
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0')
}

// Verifikasi token Cloudflare Turnstile ke server Cloudflare
async function verifikasiCaptcha(token, ip) {
  if (!token) return false

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip,
    }),
  })
  const data = await res.json()
  return data.success === true
}

router.post('/register', authLimiter, async (req, res) => {
  const { username, email, password, captchaToken } = req.body

  const captchaValid = await verifikasiCaptcha(captchaToken, req.ip)
  if (!captchaValid) {
    return res.status(400).json({ message: 'Verifikasi captcha gagal, coba lagi' })
  }

  const usernameValid = /^[a-z0-9_]{3,20}$/.test(username || '')
  if (!usernameValid) {
    return res.status(400).json({
      message: 'Username 3-20 karakter, hanya huruf kecil, angka, dan underscore',
    })
  }
  // Regex sederhana, cukup buat validasi format dasar (bukan verifikasi
  // deliverability) — konsisten dengan validasi format lain di file ini.
  const emailBersih = (email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailBersih)) {
    return res.status(400).json({ message: 'Email tidak valid' })
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Kata sandi minimal 6 karakter' })
  }

  const usernameSudahAda = await prisma.user.findUnique({ where: { username } })
  if (usernameSudahAda) {
    return res.status(400).json({ message: 'Username sudah dipakai' })
  }
  // Pengecekan ke database — 1 email cuma boleh dipakai 1 akun.
  const emailSudahAda = await prisma.user.findUnique({ where: { email: emailBersih } })
  if (emailSudahAda) {
    return res.status(400).json({ message: 'Email sudah terpakai, gunakan email lain' })
  }

  const hash = await bcrypt.hash(password, 10)
  const kode = buatKodeVerifikasi()
  let user
  try {
    user = await prisma.user.create({
      data: {
        username,
        email: emailBersih,
        password: hash,
        // Nama pena diisi otomatis dari username — bisa diganti sendiri
        // nanti lewat halaman profil.
        namaPena: username,
        emailVerified: false,
        kodeVerifikasi: kode,
        kodeVerifikasiExpiry: new Date(Date.now() + MASA_BERLAKU_KODE_MS),
      },
    })
  } catch (err) {
    // Jaga-jaga kalau ada 2 permintaan daftar bersamaan persis di detik yang
    // sama dengan email/username sama — lolos dari pengecekan di atas, tapi
    // tetap ketahan oleh constraint unik di database (kode error Prisma P2002).
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'Username atau email sudah terpakai' })
    }
    throw err
  }

  try {
    await kirimKodeVerifikasi(emailBersih, kode)
  } catch (err) {
    // Kalau emailnya gagal terkirim sama sekali, jangan tinggalkan akun
    // "mati" yang gak bisa diverifikasi maupun didaftarkan ulang — hapus
    // lagi baris yang baru dibuat, dan minta user coba daftar lagi.
    console.error('Gagal kirim email verifikasi:', err)
    await prisma.user.delete({ where: { id: user.id } })
    return res.status(502).json({ message: 'Gagal mengirim email verifikasi, coba lagi' })
  }

  res.json({ message: 'Kode verifikasi telah dikirim ke email kamu', email: emailBersih })
})

// Langkah 2 registrasi: user memasukkan kode 6 digit yang dikirim ke email.
// Kalau cocok & belum kedaluwarsa, akun jadi aktif dan langsung login
// (dikasih token), sama seperti alur login biasa.
router.post('/verify-email', authLimiter, async (req, res) => {
  const { email, kode } = req.body
  const emailBersih = (email || '').trim().toLowerCase()

  const user = await prisma.user.findUnique({ where: { email: emailBersih } })
  if (!user) {
    return res.status(400).json({ message: 'Email tidak ditemukan' })
  }
  if (user.emailVerified) {
    return res.status(400).json({ message: 'Akun sudah terverifikasi, silakan masuk' })
  }
  if (!user.kodeVerifikasi || !user.kodeVerifikasiExpiry) {
    return res.status(400).json({ message: 'Belum ada kode aktif, minta kirim ulang' })
  }
  if (user.kodeVerifikasiExpiry < new Date()) {
    return res.status(400).json({ message: 'Kode sudah kedaluwarsa, minta kirim ulang' })
  }
  if (String(kode || '').trim() !== user.kodeVerifikasi) {
    return res.status(400).json({ message: 'Kode salah' })
  }

  const userTerverifikasi = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, kodeVerifikasi: null, kodeVerifikasiExpiry: null },
  })

  const token = jwt.sign({ userId: userTerverifikasi.id }, SECRET, { expiresIn: '7d' })
  const { password: _, ...userTanpaPassword } = userTerverifikasi
  res.json({ token, user: userTanpaPassword })
})

// Kirim ulang kode verifikasi — dipakai kalau kode sebelumnya kedaluwarsa
// (5 menit) atau emailnya tidak sampai.
router.post('/resend-code', resendLimiter, async (req, res) => {
  const { email } = req.body
  const emailBersih = (email || '').trim().toLowerCase()

  const user = await prisma.user.findUnique({ where: { email: emailBersih } })
  if (!user) {
    return res.status(400).json({ message: 'Email tidak ditemukan' })
  }
  if (user.emailVerified) {
    return res.status(400).json({ message: 'Akun sudah terverifikasi, silakan masuk' })
  }

  const kode = buatKodeVerifikasi()
  await prisma.user.update({
    where: { id: user.id },
    data: { kodeVerifikasi: kode, kodeVerifikasiExpiry: new Date(Date.now() + MASA_BERLAKU_KODE_MS) },
  })

  try {
    await kirimKodeVerifikasi(emailBersih, kode)
  } catch (err) {
    console.error('Gagal kirim ulang email verifikasi:', err)
    return res.status(502).json({ message: 'Gagal mengirim email, coba lagi' })
  }

  res.json({ message: 'Kode verifikasi baru telah dikirim' })
})

router.post('/login', authLimiter, async (req, res) => {
  const { username, password, captchaToken } = req.body

  const captchaValid = await verifikasiCaptcha(captchaToken, req.ip)
  if (!captchaValid) {
    return res.status(400).json({ message: 'Verifikasi captcha gagal, coba lagi' })
  }

  const user = await prisma.user.findUnique({ where: { username } })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Username atau kata sandi salah' })
  }
  if (user.banned) {
    return res.status(403).json({ message: 'Akun ini telah dinonaktifkan' })
  }
  if (!user.emailVerified) {
    // Kode khusus (bukan cuma pesan teks) supaya frontend bisa arahkan
    // otomatis ke layar verifikasi, bukan cuma nampilin error biasa.
    return res.status(403).json({
      message: 'Email belum diverifikasi, cek kode yang dikirim ke emailmu',
      code: 'EMAIL_NOT_VERIFIED',
      email: user.email,
    })
  }

  const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '7d' })
  const { password: _, ...userTanpaPassword } = user
  res.json({ token, user: userTanpaPassword })
})

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' })

  const { password: _, ...userTanpaPassword } = user
  res.json({ user: userTanpaPassword })
})

export default router
