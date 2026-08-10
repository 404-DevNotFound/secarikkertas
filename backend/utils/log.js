import prisma from '../data/prisma.js'

// Catat satu baris jejak aksi admin. Dipanggil "fire-and-forget" (tanpa
// await di pemanggilnya) di titik-titik moderasi penting supaya respons
// ke admin tidak ikut menunggu penulisan log — kalau gagal pun cukup
// dicatat di console, jangan sampai menggagalkan aksi utamanya.
export async function catatLogAdmin({ adminId, aksi, target, detail = '' }) {
  try {
    await prisma.adminLog.create({
      data: { adminId: adminId || null, aksi, target: target || '-', detail },
    })
  } catch (err) {
    console.error('Gagal mencatat log admin:', err)
  }
}
