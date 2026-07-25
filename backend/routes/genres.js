import express from 'express'
import prisma from '../data/prisma.js'

const router = express.Router()

// GET /api/genres — daftar nama genre (untuk dropdown di editor naskah).
// Publik, tidak perlu login — cuma daftar pilihan, bukan data sensitif.
router.get('/', async (req, res) => {
  const genres = await prisma.genre.findMany({ orderBy: { nama: 'asc' } })
  res.json(genres.map((g) => g.nama))
})

export default router
