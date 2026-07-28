import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend'

const mailerSend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY })

// Alamat & nama pengirim. Selama domain (mis. secarikkertas.my.id) belum
// diverifikasi di dashboard MailerSend, akun trial cuma boleh kirim dari
// domain uji coba bawaan MailerSend (lihat Email > Domains di dashboard,
// biasanya berformat "xxxxx.mlsender.net") dan cuma sampai ke alamat email
// akun MailerSend kamu sendiri — cukup buat testing, belum buat production.
// WAJIB diisi lewat .env, tidak ada nilai default di sini karena domainnya
// unik per akun.
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'SecarikKertas'

// Kirim kode verifikasi 6 digit ke email user. Melempar error kalau gagal
// kirim — biar pemanggil (routes/auth.js) yang memutuskan apa yang terjadi
// ke akun (mis. batalkan pembuatan user) kalau pengiriman gagal.
export async function kirimKodeVerifikasi(email, kode) {
  const sentFrom = new Sender(EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME)
  const recipients = [new Recipient(email)]

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h2 style="margin-bottom: 8px;">Verifikasi akun SecarikKertas</h2>
      <p>Masukkan kode berikut untuk mengaktifkan akunmu. Kode berlaku selama <strong>5 menit</strong>.</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; margin: 24px 0; background: #f5f5f4; padding: 16px; border-radius: 8px;">
        ${kode}
      </p>
      <p style="color: #666; font-size: 13px;">Kalau kamu tidak merasa mendaftar di SecarikKertas, abaikan saja email ini.</p>
    </div>
  `

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject(`${kode} — Kode verifikasi SecarikKertas`)
    .setHtml(html)
    .setText(`Kode verifikasi SecarikKertas kamu: ${kode} (berlaku 5 menit)`)

  try {
    await mailerSend.email.send(emailParams)
  } catch (err) {
    const detail = err?.body?.message || err?.message || err
    throw new Error(`Gagal mengirim email verifikasi: ${detail}`)
  }
}

// Kirim kode 6 digit untuk reset kata sandi. Pola sama persis dengan
// kirimKodeVerifikasi di atas, cuma beda salinan teksnya.
export async function kirimKodeResetPassword(email, kode) {
  const sentFrom = new Sender(EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME)
  const recipients = [new Recipient(email)]

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h2 style="margin-bottom: 8px;">Reset kata sandi SecarikKertas</h2>
      <p>Masukkan kode berikut untuk membuat kata sandi baru. Kode berlaku selama <strong>5 menit</strong>.</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; margin: 24px 0; background: #f5f5f4; padding: 16px; border-radius: 8px;">
        ${kode}
      </p>
      <p style="color: #666; font-size: 13px;">Kalau kamu tidak meminta reset kata sandi, abaikan saja email ini — akunmu tetap aman.</p>
    </div>
  `

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject(`${kode} — Reset kata sandi SecarikKertas`)
    .setHtml(html)
    .setText(`Kode reset kata sandi SecarikKertas kamu: ${kode} (berlaku 5 menit)`)

  try {
    await mailerSend.email.send(emailParams)
  } catch (err) {
    const detail = err?.body?.message || err?.message || err
    throw new Error(`Gagal mengirim email reset kata sandi: ${detail}`)
  }
}
