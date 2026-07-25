import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import InputField from '../components/common/InputField'
import PasswordField from '../components/common/PasswordField'
import Button from '../components/common/Button'
import Captcha from '../components/common/Captcha'
import PaperCard from '../components/layout/PaperCard'

const MASA_BERLAKU_KODE_DETIK = 5 * 60 // 5 menit — samakan dengan backend

function formatWaktu(detik) {
  const m = Math.floor(detik / 60)
  const s = detik % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyEmail, resendCode } = useAuth()

  // Bisa "masuk" langsung ke langkah verifikasi kalau dikirim dari LoginPage
  // (akun belum diverifikasi saat coba login).
  const emailBelumTerverifikasi = location.state?.emailBelumTerverifikasi

  const [step, setStep] = useState(emailBelumTerverifikasi ? 'verifikasi' : 'daftar')

  // --- state form daftar ---
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState(emailBelumTerverifikasi || '')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // --- state verifikasi kode ---
  const [kode, setKode] = useState('')
  const [sisaWaktu, setSisaWaktu] = useState(MASA_BERLAKU_KODE_DETIK)
  const [infoResend, setInfoResend] = useState('')
  const [loadingResend, setLoadingResend] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (step !== 'verifikasi') return
    intervalRef.current = setInterval(() => {
      setSisaWaktu((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [step])

  // Kalau baru datang dari LoginPage (kode lama dari saat daftar mungkin
  // sudah kedaluwarsa), langsung minta kode baru begitu halaman ini muncul.
  useEffect(() => {
    if (emailBelumTerverifikasi) {
      handleKirimUlang()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmitDaftar(e) {
    e.preventDefault()
    setError('')

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setError('Username 3-20 karakter: huruf kecil, angka, underscore')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Email tidak valid')
      return
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter')
      return
    }
    if (!captchaToken) {
      setError('Selesaikan verifikasi captcha terlebih dahulu')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/register', { username, email: email.trim(), password, captchaToken })
      setSisaWaktu(MASA_BERLAKU_KODE_DETIK)
      setStep('verifikasi')
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal terhubung ke server, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitVerifikasi(e) {
    e.preventDefault()
    setError('')

    if (!/^\d{6}$/.test(kode)) {
      setError('Kode verifikasi harus 6 digit angka')
      return
    }

    setLoading(true)
    try {
      await verifyEmail(email.trim(), kode)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal terhubung ke server, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  async function handleKirimUlang() {
    setError('')
    setInfoResend('')
    setLoadingResend(true)
    try {
      await resendCode(email.trim())
      setSisaWaktu(MASA_BERLAKU_KODE_DETIK)
      setInfoResend('Kode baru telah dikirim ke emailmu')
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim ulang kode, coba lagi')
    } finally {
      setLoadingResend(false)
    }
  }

  if (step === 'verifikasi') {
    return (
      <div className="min-h-full flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16">
        <PaperCard>
          <h1 className="font-judul text-2xl font-semibold text-tinta mb-2">Verifikasi Email</h1>
          <p className="font-baca text-sm text-tinta-soft mb-8">
            Kode 6 digit telah dikirim ke <span className="font-medium">{email}</span>. Masukkan
            kodenya di bawah ini untuk mengaktifkan akun.
          </p>
          <form onSubmit={handleSubmitVerifikasi}>
            <InputField
              label="Kode Verifikasi"
              value={kode}
              onChange={(e) => setKode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              placeholder="123456"
              maxLength={6}
            />
            <p className="font-mono text-xs text-tinta-faint mb-4">
              {sisaWaktu > 0
                ? `Kode berlaku selama ${formatWaktu(sisaWaktu)}`
                : 'Kode sudah kedaluwarsa, minta kirim ulang'}
            </p>
            {error && <p className="font-mono text-xs text-stabilo mb-4">{error}</p>}
            {infoResend && <p className="font-mono text-xs text-stempel-dark mb-4">{infoResend}</p>}
            <Button type="submit" disabled={loading || sisaWaktu === 0} className="w-full sm:w-auto">
              {loading ? 'Memproses...' : 'Verifikasi'}
            </Button>
          </form>
          <button
            onClick={handleKirimUlang}
            disabled={loadingResend}
            className="font-baca text-sm text-stempel-dark underline mt-6 disabled:opacity-50"
          >
            {loadingResend ? 'Mengirim...' : 'Kirim ulang kode'}
          </button>
        </PaperCard>
      </div>
    )
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16">
      <PaperCard>
        <h1 className="font-judul text-2xl font-semibold text-tinta mb-8">Daftar</h1>
        <form onSubmit={handleSubmitDaftar}>
          <InputField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
          />
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <PasswordField label="Kata Sandi" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Captcha onVerify={setCaptchaToken} />
          {error && <p className="font-mono text-xs text-stabilo mb-4">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? 'Memproses...' : 'Daftar'}
          </Button>
        </form>
        <p className="font-baca text-sm text-tinta-soft mt-6">
          Sudah punya akun? <Link to="/login" className="text-stempel-dark underline">Masuk</Link>
        </p>
      </PaperCard>
    </div>
  )
}
