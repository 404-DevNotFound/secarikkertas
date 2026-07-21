import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import InputField from '../components/common/InputField'
import Button from '../components/common/Button'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError('Email atau kata sandi salah')
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-xl font-bold text-slate-800 mb-6">Masuk</h1>
      <form onSubmit={handleSubmit}>
        <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <InputField label="Kata Sandi" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
        <Button type="submit">Masuk</Button>
      </form>
      <p className="text-sm text-slate-500 mt-4">
        Belum punya akun? <Link to="/register" className="underline">Daftar</Link>
      </p>
    </div>
  )
}
