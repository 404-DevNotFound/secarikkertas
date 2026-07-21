import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import InputField from '../components/common/InputField'
import Button from '../components/common/Button'

export default function UserProfilePage() {
  const { user } = useAuth()
  const [namaPena, setNamaPena] = useState(user?.namaPena || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [error, setError] = useState('')
  const [sukses, setSukses] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // FR-02.2: validasi langsung
    if (namaPena.trim().length < 3) {
      setError('Nama pena minimal 3 karakter')
      return
    }

    try {
      await api.put('/users/me', { namaPena, bio })
      setSukses(true)
    } catch (err) {
      setError('Gagal menyimpan, coba lagi')
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-slate-800 mb-6">Profil Saya</h1>

      <form onSubmit={handleSubmit}>
        <InputField
          label="Nama Pena"
          value={namaPena}
          onChange={(e) => setNamaPena(e.target.value)}
          error={error}
        />
        <InputField
          label="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <Button type="submit">Simpan</Button>
        {sukses && <p className="text-green-600 text-sm mt-2">Profil tersimpan.</p>}
      </form>
    </div>
  )
}
