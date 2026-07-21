import { PrismaClient } from '@prisma/client'

// Satu instance PrismaClient dipakai di seluruh app (best practice)
const prisma = new PrismaClient()

export default prisma
