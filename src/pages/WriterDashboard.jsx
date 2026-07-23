import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Button from '../components/common/Button'
import { useAuth } from '../context/AuthContext'

const LABEL_STATUS = {
  draft: { teks: 'Draf', warna: 'bg-kertas-line text-tinta-soft' },
  diajukan: { teks: 'Menunggu Tinjauan', warna: 'bg-stabilo-light text-stabilo' },
  terbit: { teks: 'Terbit', warna: 'bg-stempel-light text-stempel-dark' },
  ditolak: { teks: 'Ditolak', warna: 'bg-red-100 text-red-700' },
}

export default function WriterDashboard() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [drafts, setDrafts] = useState([])

  useEffect(() => {
    api.get('/posts/saya').then((res) => setDrafts(res.data))
  }, [])

  async function buatBaru() {
    const res = await api.post('/posts', { judul: 'Tanpa judul', tipe: 'cerpen' })
    window.location.href = `/dashboard/tulis/${res.data.id}`
  }

  async function ajukan(id) {
    try {
      const res = await api.put(`/posts/${id}/ajukan`)
      setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, status: res.data.status } : d)))
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengajukan naskah')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="font-judul text-xl font-semibold text-tinta">Dasbor Menulis</h1>
        <Button onClick={buatBaru} className="w-full sm:w-auto">+ Tulisan Baru</Button>
      </div>

      <div className="space-y-3">
        {drafts.map((d) => {
          const status = LABEL_STATUS[d.status] || LABEL_STATUS.draft
          return (
            <div key={d.id} className="bg-white p-4 border border-kertas-line">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <Link to={`/dashboard/tulis/${d.id}`} className="min-w-0">
                  <p className="font-judul text-lg text-tinta truncate">{d.judul}</p>
                </Link>
                <span className={`font-mono text-[10px] uppercase px-2 py-1 shrink-0 self-start ${status.warna}`}>
                  {status.teks}
                </span>
              </div>

              {d.status === 'ditolak' && d.catatanAdmin && (
                <p className="font-baca text-sm text-red-600 mt-2">Catatan admin: {d.catatanAdmin}</p>
              )}

              {['draft', 'ditolak'].includes(d.status) && (
                <button
                  onClick={() => ajukan(d.id)}
                  className="mt-3 font-mono text-xs uppercase text-stempel-dark underline"
                >
                  {isAdmin ? 'Terbitkan Langsung' : 'Ajukan untuk Ditinjau'}
                </button>
              )}
            </div>
          )
        })}
        {drafts.length === 0 && (
          <p className="font-baca italic text-tinta-faint">Belum ada tulisan. Mulai menulis sekarang.</p>
        )}
      </div>
    </div>
  )
}
