import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import CardPost from '../components/common/CardPost'
import Toast from '../components/common/Toast'

function inisialDari(teks) {
  if (!teks) return '?'
  const kata = teks.trim().split(/\s+/)
  if (kata.length === 1) return kata[0].slice(0, 2).toUpperCase()
  return (kata[0][0] + kata[1][0]).toUpperCase()
}

export default function AuthorProfilePage() {
  const { username } = useParams()
  const { user } = useAuth()
  const [profil, setProfil] = useState(null)
  const [memuat, setMemuat] = useState(true)
  const [toast, setToast] = useState(null)
  const [sedangIkuti, setSedangIkuti] = useState(false)

  useEffect(() => {
    setMemuat(true)
    api.get(`/users/${username}`)
      .then((res) => setProfil(res.data))
      .catch(() => setProfil(null))
      .finally(() => setMemuat(false))
  }, [username])

  async function toggleIkuti() {
    if (!user) {
      setToast({ message: 'Masuk dulu untuk mengikuti penulis ini.', type: 'error' })
      return
    }
    setSedangIkuti(true)
    const nilaiBaru = !profil.mengikuti
    try {
      const res = await api.post(`/users/${username}/ikuti`, { ikuti: nilaiBaru })
      setProfil((p) => ({ ...p, mengikuti: res.data.mengikuti, jumlahPengikut: res.data.jumlahPengikut }))
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Gagal memperbarui status ikuti', type: 'error' })
    } finally {
      setSedangIkuti(false)
    }
  }

  if (memuat) {
    return <p className="text-center py-10 text-naskah-inksoft/70 font-baca italic">Memuat...</p>
  }
  if (!profil) {
    return <p className="text-center py-10 text-naskah-inksoft/70 font-baca italic">Penulis tidak ditemukan.</p>
  }

  const milikSendiri = user?.username === profil.username

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="flex items-start gap-4 mb-8">
        <span className="w-16 h-16 rounded-full bg-naskah-leather text-naskah-bg flex items-center justify-center font-ketik text-xl shrink-0">
          {inisialDari(profil.namaPena)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-naskah text-2xl sm:text-3xl text-naskah-ink truncate">{profil.namaPena}</h1>
          <p className="font-ketik text-[11px] uppercase tracking-widest text-naskah-inksoft/60">
            @{profil.username} · Bergabung {new Date(profil.bergabung).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </p>
          {profil.bio && (
            <p className="font-baca text-sm text-naskah-inksoft mt-3 leading-relaxed">{profil.bio}</p>
          )}
          <div className="flex items-center gap-5 mt-4">
            <span className="font-ketik text-xs text-naskah-inksoft/70">
              <strong className="text-naskah-ink">{profil.jumlahPengikut}</strong> Pengikut
            </span>
            <span className="font-ketik text-xs text-naskah-inksoft/70">
              <strong className="text-naskah-ink">{profil.jumlahMengikuti}</strong> Mengikuti
            </span>
            <span className="font-ketik text-xs text-naskah-inksoft/70">
              <strong className="text-naskah-ink">{profil.tulisan.length}</strong> Tulisan
            </span>
          </div>
          {!milikSendiri && (
            <button
              onClick={toggleIkuti}
              disabled={sedangIkuti}
              className={`mt-4 px-4 py-1.5 font-mono text-xs uppercase tracking-wide border transition-colors disabled:opacity-60 ${
                profil.mengikuti
                  ? 'border-naskah-moss text-naskah-moss bg-naskah-mosslight'
                  : 'border-naskah-leather text-naskah-leather hover:bg-naskah-leather hover:text-naskah-bg'
              }`}
            >
              {profil.mengikuti ? '✓ Mengikuti' : '+ Ikuti'}
            </button>
          )}
        </div>
      </div>

      <h3 className="font-ketik text-[11px] uppercase tracking-[0.2em] text-naskah-inksoft/70 mb-2 border-t border-naskah-aged/60 pt-6">
        Tulisan Terbit
      </h3>
      {profil.tulisan.length === 0 && (
        <p className="font-baca italic text-sm text-naskah-inksoft/60">Belum ada tulisan terbit.</p>
      )}
      {profil.tulisan.map((p) => (
        <CardPost
          key={p.id}
          id={p.id}
          judul={p.judul}
          penulis={profil.namaPena}
          penulisUsername={profil.username}
          ringkasan={p.ringkasan}
          likes={p.likes}
          viewCount={p.viewCount}
          kategori={p.kategori}
          tipe={p.tipe}
          gambarSampul={p.gambarSampul}
          tanggalTerbit={p.tanggalTerbit}
        />
      ))}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
