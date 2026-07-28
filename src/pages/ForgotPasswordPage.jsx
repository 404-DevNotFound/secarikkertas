import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import InputField from '../components/common/InputField'
import PasswordField from '../components/common/PasswordField'
import Button from '../components/common/Button'
import PaperCard from '../components/layout/PaperCard'

// Alur 2 langkah, sama polanya dengan verifikasi email di RegisterPage:
// 1) minta kode dikirim ke email, 2) masukkan kode + kata sandi baru.
export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { forgotPassword, resetPassword } = useAuth()

  const [step, setStep] = useState('minta')
  const [email, setEmail] = useState('')
  const [kode, setKode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleMintaKode(e) {
    e.preventDefault()
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Email tidak valid')
      return
    }
    setLoading(true)
    try {
      const res = await forgotPassword(email.trim())
      setInfo(res.message)
      setStep('reset')
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal terhubung ke server, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    if (!/^\d{6}$/.test(kode)) {
      setError('Kode harus 6 digit angka')
      return
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter')
      return
    }
    setLoading(true)
    try {
      await resetPassword(email.trim(), kode, password)
      navigate('/login', { state: { pesanSukses: 'Kata sandi berhasil diganti. Silakan masuk.' } })
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal terhubung ke server, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'reset') {
    return (
      <div className="min-h-full flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16">
        <PaperCard>
          <h1 className="font-judul text-2xl font-semibold text-tinta mb-2">Kata Sandi Baru</h1>
          <p className="font-baca text-sm text-tinta-soft mb-8">
            Kode reset telah dikirim ke <span className="font-medium">{email}</span> (kalau email
            tersebut terdaftar). Masukkan kodenya beserta kata sandi baru di bawah ini.
          </p>
          <form onSubmit={handleReset}>
            <InputField
              label="Kode Reset"
              value={kode}
              onChange={(e) => setKode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              placeholder="123456"
              maxLength={6}
            />
            <PasswordField
              label="Kata Sandi Baru"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="font-mono text-xs text-stabilo mb-4">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Memproses...' : 'Ganti Kata Sandi'}
            </Button>
          </form>
          <button
            onClick={() => setStep('minta')}
            className="font-baca text-sm text-stempel-dark underline mt-6"
          >
            Kirim ulang / ganti email
          </button>
        </PaperCard>
      </div>
    )
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16">
      <PaperCard>
        <h1 className="font-judul text-2xl font-semibold text-tinta mb-2">Lupa Kata Sandi</h1>
        <p className="font-baca text-sm text-tinta-soft mb-8">
          Masukkan email akunmu. Kami akan kirim kode 6 digit untuk membuat kata sandi baru.
        </p>
        <form onSubmit={handleMintaKode}>
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="font-mono text-xs text-stabilo mb-4">{error}</p>}
          {info && <p className="font-mono text-xs text-stempel-dark mb-4">{info}</p>}
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? 'Mengirim...' : 'Kirim Kode'}
          </Button>
        </form>
        <p className="font-baca text-sm text-tinta-soft mt-6">
          Ingat kata sandinya? <Link to="/login" className="text-stempel-dark underline">Masuk</Link>
        </p>
      </PaperCard>
    </div>
  )
}
