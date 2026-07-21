import express from 'express'
import prisma from '../data/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.put('/me', requireAuth, async (req, res) => {
  const { namaPena, bio } = req.body

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      ...(namaPena !== undefined && { namaPena }),
      ...(bio !== undefined && { bio }),
    },
  })

  const { password: _, ...userTanpaPassword } = user
  res.json({ user: userTanpaPassword })
})

export default router
