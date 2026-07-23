import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import InputField from '../components/common/InputField'
import PasswordField from '../components/common/PasswordField'
import Button from '../components/common/Button'
import Captcha from '../components/common/Captcha'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [nama, setNama] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setError('Username 3-20 karakter: huruf kecil, angka, underscore')
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
      // Panggil API register langsung (bukan lewat context), supaya TIDAK
      // otomatis menyimpan token & login. Setelah berhasil daftar, arahkan
      // ke halaman Login supaya user login manual dengan akun barunya.
      await api.post('/auth/register', { nama, username, password, captchaToken })
      navigate('/login', { state: { pesanSukses: 'Akun berhasil dibuat. Silakan masuk.' } })
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal terhubung ke server, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <h1 className="font-judul text-2xl font-semibold text-tinta mb-8">Daftar</h1>
      <form onSubmit={handleSubmit}>
        <InputField label="Nama" value={nama} onChange={(e) => setNama(e.target.value)} />
        <InputField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder="huruf-kecil_angka"
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
    </div>
  )
}
