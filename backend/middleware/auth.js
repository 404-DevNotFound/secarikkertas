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

// Dipakai untuk endpoint yang BOLEH diakses tanpa login (misal komentar
// anonim), tapi tetap mau tahu siapa yang login KALAU dia login.
// Beda dari requireAuth: tidak pernah menolak request, cuma set
// req.userId = null kalau tidak ada/tidak valid token-nya.
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header) {
    req.userId = null
    return next()
  }

  const token = header.replace('Bearer ', '')
  try {
    const payload = jwt.verify(token, SECRET)
    req.userId = payload.userId
  } catch (err) {
    req.userId = null
  }
  next()
}

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
