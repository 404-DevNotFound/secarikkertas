import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET

export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ message: 'Belum login' })

  const token = header.replace('Bearer ', '')
  try {
    const payload = jwt.verify(token, SECRET)
    req.userId = payload.userId
    next()
  } catch (err) {
    res.status(401).json({ message: 'Token tidak valid' })
  }
}

// Dipakai SETELAH requireAuth, cek role user dari database
export function requireAdmin(prisma) {
  return async (req, res, next) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak, khusus admin' })
    }
    next()
  }
}

export { SECRET }
