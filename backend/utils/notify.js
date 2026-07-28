import prisma from '../data/prisma.js'

// Helper kecil dipakai di beberapa route (posts.js, admin.js) supaya
// pembuatan notifikasi tidak berulang-ulang. Sengaja "fire and forget"
// friendly — pemanggil boleh await atau tidak, tapi selalu dibungkus
// try/catch di sini supaya gagal kirim notifikasi TIDAK menggagalkan
// aksi utama (mis. tetap terbitkan naskah walau notifikasinya gagal dibuat).
export async function buatNotifikasi({ userId, tipe, pesan, link }) {
  try {
    await prisma.notification.create({
      data: { userId, tipe, pesan, link: link || null },
    })
  } catch (err) {
    console.error('Gagal membuat notifikasi:', err)
  }
}

// Beri tahu semua pengikut seorang penulis bahwa dia baru menerbitkan
// naskah. Dipanggil saat status naskah berubah jadi "terbit".
export async function beriTahuPengikut({ penulisId, penulisNama, postId, judul }) {
  try {
    const pengikut = await prisma.follow.findMany({
      where: { followingId: penulisId },
      select: { followerId: true },
    })
    await Promise.all(
      pengikut.map((f) =>
        buatNotifikasi({
          userId: f.followerId,
          tipe: 'penulis_baru_terbit',
          pesan: `${penulisNama} baru saja menerbitkan "${judul}"`,
          link: `/post/${postId}`,
        })
      )
    )
  } catch (err) {
    console.error('Gagal mengirim notifikasi ke pengikut:', err)
  }
}
