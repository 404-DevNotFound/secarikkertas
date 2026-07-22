import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../data/prisma.js'
import { requireAuth, SECRET } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', async (req, res) => {
  const { nama, username, password } = req.body

  // Validasi dasar biar username konsisten (huruf kecil, angka, underscore)
  const usernameValid = /^[a-z0-9_]{3,20}$/.test(username || '')
  if (!usernameValid) {
    return res.status(400).json({
      message: 'Username 3-20 karakter, hanya huruf kecil, angka, dan underscore',
    })
  }

  const sudahAda = await prisma.user.findUnique({ where: { username } })
  if (sudahAda) {
    return res.status(400).json({ message: 'Username sudah dipakai' })
  }

  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { nama, username, password: hash, namaPena: nama },
  })

  const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '7d' })
  const { password: _, ...userTanpaPassword } = user
  res.json({ token, user: userTanpaPassword })
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  const user = await prisma.user.findUnique({ where: { username } })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Username atau kata sandi salah' })
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
