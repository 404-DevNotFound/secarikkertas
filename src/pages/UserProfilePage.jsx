import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Button from '../components/common/Button'
import BookSpread from '../components/layout/BookSpread'
import Toast from '../components/common/Toast'

function inisialDari(teks) {
  if (!teks) return '?'
  const kata = teks.trim().split(/\s+/)
  if (kata.length === 1) return kata[0].slice(0, 2).toUpperCase()
  return (kata[0][0] + kata[1][0]).toUpperCase()
}

export default function UserProfilePage() {
  const { user, updateUser } = useAuth()
  const [namaPena, setNamaPena] = useState(user?.namaPena || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [error, setError] = useState('')
  const [menyimpan, setMenyimpan] = useState(false)
  const [toast, setToast] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // FR-02.2: validasi langsung
    if (namaPena.trim().length < 3) {
      setError('Nama pena minimal 3 karakter')
      return
    }

    setMenyimpan(true)
    try {
      const res = await api.put('/users/me', { namaPena, bio })
      updateUser(res.data.user)
      setToast({ message: 'Profil tersimpan.', type: 'sukses' })
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan, coba lagi')
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <>
      <BookSpread
        kiri={
          <div className="flex flex-col h-full">
            <span className="font-ketik text-[11px] uppercase tracking-[0.25em] text-naskah-leather mb-3">
              Halaman Sampul
            </span>
            <h1 className="font-naskah text-3xl sm:text-4xl leading-tight text-naskah-ink mb-4">
              Profil Saya
            </h1>
            <p className="font-ketik text-sm text-naskah-inksoft leading-relaxed mb-8">
              Nama pena dan bio ini yang tampil ke pembaca lain, di setiap
              tulisan yang kamu terbitkan dan di halaman penulismu.
            </p>

            <div className="flex items-center gap-4 mt-auto pt-6 border-t border-naskah-aged/60">
              <span className="w-14 h-14 rounded-full bg-naskah-leather text-naskah-bg flex items-center justify-center font-ketik text-lg shrink-0">
                {inisialDari(namaPena || user?.namaPena)}
              </span>
              <div className="min-w-0">
                <p className="font-naskah text-lg text-naskah-ink truncate">{namaPena || user?.namaPena}</p>
                <p className="font-ketik text-[11px] uppercase tracking-widest text-naskah-inksoft/60 truncate">
                  @{user?.username}
                </p>
              </div>
            </div>
          </div>
        }
        kanan={
          <div>
            <h3 className="font-ketik text-[11px] uppercase tracking-[0.2em] text-naskah-inksoft/70 mb-6">
              Ubah Data
            </h3>

            <form onSubmit={handleSubmit}>
              <label className="block font-ketik text-[11px] uppercase tracking-widest text-naskah-inksoft/70 mb-1.5">
                Nama Pena
              </label>
              <input
                value={namaPena}
                onChange={(e) => setNamaPena(e.target.value)}
                className={`w-full px-0 py-2.5 mb-1 bg-transparent border-0 border-b-2 outline-none font-baca text-naskah-ink placeholder:text-naskah-inksoft/40 focus:border-naskah-leather transition-colors ${
                  error ? 'border-red-500' : 'border-naskah-aged'
                }`}
              />
              {error && <p className="font-mono text-xs text-red-600 mb-4">{error}</p>}
              {!error && <div className="mb-4" />}

              <label className="block font-ketik text-[11px] uppercase tracking-widest text-naskah-inksoft/70 mb-1.5">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Ceritakan sedikit tentang dirimu..."
                className="w-full px-0 py-2.5 mb-8 bg-transparent border-0 border-b-2 border-naskah-aged outline-none font-baca text-sm text-naskah-ink placeholder:text-naskah-inksoft/40 focus:border-naskah-leather transition-colors resize-none"
              />

              <Button
                type="submit"
                disabled={menyimpan}
                className="!bg-naskah-leather !text-naskah-bg hover:!bg-naskah-leatherdark !font-ketik disabled:opacity-60"
              >
                {menyimpan ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </form>
          </div>
        }
      />

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </>
  )
}
