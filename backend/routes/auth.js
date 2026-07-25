import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import prisma from '../data/prisma.js'
import { requireAuth, SECRET } from '../middleware/auth.js'

const router = express.Router()

// Batasi percobaan login/register — cegah brute force & bot spam ("judol")
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // maksimal 10 percobaan per IP per 15 menit
  message: { message: 'Terlalu banyak percobaan, coba lagi beberapa menit lagi' },
  standardHeaders: true,
  legacyHeaders: false,
})

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
  const { nama, username, email, password, captchaToken } = req.body

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
  if (!nama || nama.trim().length < 2) {
    return res.status(400).json({ message: 'Nama tidak valid' })
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
  let user
  try {
    user = await prisma.user.create({
      data: { nama: nama.trim(), username, email: emailBersih, password: hash, namaPena: nama.trim() },
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

  const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '7d' })
  const { password: _, ...userTanpaPassword } = user
  res.json({ token, user: userTanpaPassword })
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
