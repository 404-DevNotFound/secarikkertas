import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import InputField from '../components/common/InputField'
import Button from '../components/common/Button'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [nama, setNama] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

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

    try {
      await register(nama, username, password)
      navigate('/dashboard')
    } catch (err) {
      setError('Gagal mendaftar, username mungkin sudah dipakai')
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-20">
      <h1 className="font-judul text-2xl font-semibold text-tinta mb-8">Daftar</h1>
      <form onSubmit={handleSubmit}>
        <InputField label="Nama" value={nama} onChange={(e) => setNama(e.target.value)} />
        <InputField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder="huruf-kecil_angka"
        />
        <InputField label="Kata Sandi" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
        <Button type="submit">Daftar</Button>
      </form>
      <p className="font-baca text-sm text-tinta-soft mt-6">
        Sudah punya akun? <Link to="/login" className="text-stempel-dark underline">Masuk</Link>
      </p>
    </div>
  )
}
