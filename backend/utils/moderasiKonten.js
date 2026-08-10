// Moderasi konten dasar — lapisan PERTAMA sebelum konten tayang, bukan
// pengganti tinjauan admin manusia (naskah tetap wajib melalui alur
// diajukan -> ditinjau -> disetujui seperti biasa). Modul ini sengaja
// sederhana (daftar kata + beberapa heuristik spam), bukan model AI —
// cukup untuk menangkap kasus paling jelas & murah dijalankan di setiap
// request tanpa perlu panggilan ke layanan luar.
//
// CATATAN JUJUR: daftar kata kasar di bawah TIDAK dan TIDAK AKAN pernah
// lengkap — bahasa gaul/typo terus berubah. Jangan andalkan ini sebagai
// satu-satunya lapisan moderasi. Untuk komunitas yang lebih besar,
// pertimbangkan layanan moderasi pihak ketiga yang lebih matang.

// Daftar kata kasar umum Bahasa Indonesia (bentuk dasar, dicek sebagai
// utuh kata via regex \b supaya "kelas" tidak ke-flag gara-gara mengandung
// potongan kata lain).
const KATA_KASAR = [
  'anjing', 'anjir', 'asu', 'bangsat', 'bajingan', 'babi', 'bego', 'goblok',
  'tolol', 'idiot', 'kontol', 'memek', 'ngentot', 'jancok', 'jancuk',
  'kampret', 'keparat', 'sialan', 'pukimak', 'pepek', 'peler', 'tai',
  'taik', 'sundal', 'lonte', 'pelacur',
]

const REGEX_KATA_KASAR = new RegExp(`\\b(${KATA_KASAR.join('|')})\\b`, 'i')

// Heuristik spam ringan: banyak URL, huruf kapital semua, atau karakter
// yang diulang berlebihan (mis. "PROMOOOOO!!!!!!!!").
function kemungkinanSpam(teks) {
  const jumlahUrl = (teks.match(/https?:\/\/|www\./gi) || []).length
  if (jumlahUrl >= 3) return 'Mengandung terlalu banyak tautan'

  const hurufSaja = teks.replace(/[^a-zA-Z]/g, '')
  if (hurufSaja.length >= 12) {
    const rasioKapital = (hurufSaja.match(/[A-Z]/g) || []).length / hurufSaja.length
    if (rasioKapital > 0.8) return 'Ditulis dengan huruf kapital berlebihan'
  }

  if (/(.)\1{7,}/.test(teks)) return 'Mengandung karakter berulang berlebihan'

  return null
}

// periksaKonten(teks) -> { bermasalah: boolean, alasan: string|null }
// "teks" boleh berisi HTML (tag dibuang dulu sebelum diperiksa).
export function periksaKonten(teks) {
  const bersih = String(teks || '').replace(/<[^>]*>/g, ' ')
  if (!bersih.trim()) return { bermasalah: false, alasan: null }

  if (REGEX_KATA_KASAR.test(bersih)) {
    return { bermasalah: true, alasan: 'Terdeteksi kata tidak pantas' }
  }

  const alasanSpam = kemungkinanSpam(bersih)
  if (alasanSpam) {
    return { bermasalah: true, alasan: alasanSpam }
  }

  return { bermasalah: false, alasan: null }
}
