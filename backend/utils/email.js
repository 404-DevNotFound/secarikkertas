import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Alamat pengirim. Kalau kamu sudah verifikasi domain sendiri di Resend,
// ganti ke "no-reply@secarikkertas.my.id" (harus domain yang sudah
// diverifikasi di dashboard Resend). Sebelum domain diverifikasi, Resend
// cuma izinkan kirim dari "onboarding@resend.dev" dan cuma ke alamat email
// akun Resend kamu sendiri — cukup buat testing tapi belum buat produksi.
const EMAIL_FROM = process.env.EMAIL_FROM || 'SecarikKertas <onboarding@resend.dev>'

// Kirim kode verifikasi 6 digit ke email user. Melempar error kalau gagal
// kirim — biar pemanggil (routes/auth.js) yang memutuskan apa yang terjadi
// ke akun (mis. batalkan pembuatan user) kalau pengiriman gagal.
export async function kirimKodeVerifikasi(email, kode) {
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `${kode} — Kode verifikasi SecarikKertas`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
        <h2 style="margin-bottom: 8px;">Verifikasi akun SecarikKertas</h2>
        <p>Masukkan kode berikut untuk mengaktifkan akunmu. Kode berlaku selama <strong>5 menit</strong>.</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; margin: 24px 0; background: #f5f5f4; padding: 16px; border-radius: 8px;">
          ${kode}
        </p>
        <p style="color: #666; font-size: 13px;">Kalau kamu tidak merasa mendaftar di SecarikKertas, abaikan saja email ini.</p>
      </div>
    `,
  })

  if (error) {
    throw new Error(`Gagal mengirim email verifikasi: ${error.message || error}`)
  }
}
