import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Button from '../components/common/Button'
import ConfirmModal from '../components/common/ConfirmModal'
import Toast from '../components/common/Toast'
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
  const [targetHapus, setTargetHapus] = useState(null) // { id, judul } | null
  const [toast, setToast] = useState(null) // { message, type }

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
      setToast({
        message: isAdmin ? 'Naskah berhasil diterbitkan.' : 'Naskah berhasil diajukan untuk ditinjau.',
        type: 'sukses',
      })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Gagal mengajukan naskah', type: 'error' })
    }
  }

  // Buka popup konfirmasi, belum benar-benar menghapus
  function mintaKonfirmasiHapus(id, judul) {
    setTargetHapus({ id, judul })
  }

  // Dipanggil setelah user klik "Hapus" di popup konfirmasi
  async function konfirmasiHapus() {
    if (!targetHapus) return
    try {
      await api.delete(`/posts/${targetHapus.id}`)
      setDrafts((prev) => prev.filter((d) => d.id !== targetHapus.id))
      setToast({ message: `Draf "${targetHapus.judul}" berhasil dihapus.`, type: 'sukses' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Gagal menghapus draf', type: 'error' })
    } finally {
      setTargetHapus(null)
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
          const bisaDihapus = ['draft', 'ditolak'].includes(d.status)
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

              {bisaDihapus && (
                <div className="flex flex-wrap gap-4 mt-3">
                  <button
                    onClick={() => ajukan(d.id)}
                    className="font-mono text-xs uppercase text-stempel-dark underline"
                  >
                    {isAdmin ? 'Terbitkan Langsung' : 'Ajukan untuk Ditinjau'}
                  </button>
                  <button
                    onClick={() => mintaKonfirmasiHapus(d.id, d.judul)}
                    className="font-mono text-xs uppercase text-red-600 underline"
                  >
                    Hapus Draf
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {drafts.length === 0 && (
          <p className="font-baca italic text-tinta-faint">Belum ada tulisan. Mulai menulis sekarang.</p>
        )}
      </div>

      <ConfirmModal
        open={!!targetHapus}
        title="Hapus Draf?"
        message={`Draf "${targetHapus?.judul}" akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`}
        confirmText="Hapus"
        onConfirm={konfirmasiHapus}
        onCancel={() => setTargetHapus(null)}
      />

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
