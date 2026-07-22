import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import InputField from '../components/common/InputField'
import Button from '../components/common/Button'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      setError('Username atau kata sandi salah')
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-20">
      <h1 className="font-judul text-2xl font-semibold text-tinta mb-8">Masuk</h1>
      <form onSubmit={handleSubmit}>
        <InputField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <InputField label="Kata Sandi" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
        <Button type="submit">Masuk</Button>
      </form>
      <p className="font-baca text-sm text-tinta-soft mt-6">
        Belum punya akun? <Link to="/register" className="text-stempel-dark underline">Daftar</Link>
      </p>
    </div>
  )
}
