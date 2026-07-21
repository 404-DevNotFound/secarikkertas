import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../data/prisma.js'
import { requireAuth, SECRET } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', async (req, res) => {
  const { nama, email, password } = req.body

  const sudahAda = await prisma.user.findUnique({ where: { email } })
  if (sudahAda) {
    return res.status(400).json({ message: 'Email sudah terdaftar' })
  }

  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { nama, email, password: hash, namaPena: nama },
  })

  const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '7d' })
  const { password: _, ...userTanpaPassword } = user
  res.json({ token, user: userTanpaPassword })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Email atau kata sandi salah' })
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
