import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import InputField from '../components/common/InputField'
import Button from '../components/common/Button'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter')
      return
    }
    try {
      await register(nama, email, password)
      navigate('/dashboard')
    } catch (err) {
      setError('Gagal mendaftar, email mungkin sudah dipakai')
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-xl font-bold text-slate-800 mb-6">Daftar</h1>
      <form onSubmit={handleSubmit}>
        <InputField label="Nama" value={nama} onChange={(e) => setNama(e.target.value)} />
        <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <InputField label="Kata Sandi" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
        <Button type="submit">Daftar</Button>
      </form>
      <p className="text-sm text-slate-500 mt-4">
        Sudah punya akun? <Link to="/login" className="underline">Masuk</Link>
      </p>
    </div>
  )
}
