import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import InputField from '../components/common/InputField'
import Button from '../components/common/Button'
import Captcha from '../components/common/Captcha'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!captchaToken) {
      setError('Selesaikan verifikasi captcha terlebih dahulu')
      return
    }

    setLoading(true)
    try {
      await login(username, password, captchaToken)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Username atau kata sandi salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <h1 className="font-judul text-2xl font-semibold text-tinta mb-8">Masuk</h1>
      <form onSubmit={handleSubmit}>
        <InputField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <InputField label="Kata Sandi" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Captcha onVerify={setCaptchaToken} />
        {error && <p className="font-mono text-xs text-stabilo mb-4">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? 'Memproses...' : 'Masuk'}
        </Button>
      </form>
      <p className="font-baca text-sm text-tinta-soft mt-6">
        Belum punya akun? <Link to="/register" className="text-stempel-dark underline">Daftar</Link>
      </p>
    </div>
  )
}
