// Cara pakai (di terminal folder backend):
//   node scripts/createSuperadmin.js <username> <password> <namaPena>
// Contoh:
//   node scripts/createSuperadmin.js admin RahasiaKuat123 "Admin Utama"

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import prisma from '../data/prisma.js'

async function main() {
  const [, , username, password, ...namaPenaParts] = process.argv
  const namaPena = namaPenaParts.join(' ') || username

  if (!username || !password) {
    console.log('Cara pakai: node scripts/createSuperadmin.js <username> <password> <namaPena opsional>')
    process.exit(1)
  }
  if (password.length < 8) {
    console.log('Demi keamanan, password superadmin minimal 8 karakter.')
    process.exit(1)
  }

  const sudahAda = await prisma.user.findUnique({ where: { username } })
  if (sudahAda) {
    // Kalau usernamenya sudah ada (misal kamu sudah register biasa), tinggal naikkan rolenya
    await prisma.user.update({ where: { username }, data: { role: 'admin' } })
    console.log(`User "${username}" sudah ada — role-nya sudah dinaikkan jadi admin.`)
  } else {
    const hash = await bcrypt.hash(password, 10)
    // Dibuat lewat script (bukan form register), jadi tidak lewat alur
    // verifikasi email — langsung ditandai emailVerified: true.
    await prisma.user.create({
      data: { username, password: hash, namaPena, role: 'admin', emailVerified: true },
    })
    console.log(`Superadmin "${username}" berhasil dibuat.`)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
