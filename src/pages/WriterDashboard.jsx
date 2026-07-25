import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Button from '../components/common/Button'
import ConfirmModal from '../components/common/ConfirmModal'
import Toast from '../components/common/Toast'
import BookSpread from '../components/layout/BookSpread'
import { useAuth } from '../context/AuthContext'

const LABEL_STATUS = {
  draft: { teks: 'Draf', warna: 'bg-naskah-aged/60 text-naskah-inksoft' },
  diajukan: { teks: 'Menunggu Tinjauan', warna: 'bg-[#F4E3C7] text-[#8A5A1E]' },
  terbit: { teks: 'Terbit', warna: 'bg-naskah-mosslight text-naskah-moss' },
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

  const jumlah = {
    draft: drafts.filter((d) => d.status === 'draft').length,
    diajukan: drafts.filter((d) => d.status === 'diajukan').length,
    terbit: drafts.filter((d) => d.status === 'terbit').length,
  }

  return (
    <>
      <BookSpread
        kiri={
          <div className="flex flex-col h-full">
            <span className="font-ketik text-[11px] uppercase tracking-[0.25em] text-naskah-leather mb-3">
              Meja Kerja
            </span>
            <h1 className="font-naskah text-3xl sm:text-4xl leading-tight text-naskah-ink mb-4">
              Dasbor Menulis
            </h1>
            <p className="font-ketik text-sm text-naskah-inksoft leading-relaxed mb-8">
              Kelola naskahmu di sini — dari draf, diajukan untuk ditinjau, sampai terbit.
            </p>

            <Button
              onClick={buatBaru}
              className="!bg-naskah-leather !text-naskah-bg hover:!bg-naskah-leatherdark !font-ketik w-full sm:w-auto mb-10"
            >
              + Tulisan Baru
            </Button>

            <div className="mt-auto grid grid-cols-3 gap-4 pt-6 border-t border-naskah-aged/60">
              <div>
                <p className="font-naskah text-2xl text-naskah-ink">{jumlah.draft}</p>
                <p className="font-ketik text-[11px] uppercase tracking-wide text-naskah-inksoft/70">Draf</p>
              </div>
              <div>
                <p className="font-naskah text-2xl text-naskah-ink">{jumlah.diajukan}</p>
                <p className="font-ketik text-[11px] uppercase tracking-wide text-naskah-inksoft/70">Ditinjau</p>
              </div>
              <div>
                <p className="font-naskah text-2xl text-naskah-moss">{jumlah.terbit}</p>
                <p className="font-ketik text-[11px] uppercase tracking-wide text-naskah-inksoft/70">Terbit</p>
              </div>
            </div>
          </div>
        }
        kanan={
          <div className="space-y-3">
            <h3 className="font-ketik text-[11px] uppercase tracking-[0.2em] text-naskah-inksoft/70 mb-4">
              Naskahmu
            </h3>
            {drafts.map((d) => {
              const status = LABEL_STATUS[d.status] || LABEL_STATUS.draft
              const bisaDihapus = ['draft', 'ditolak'].includes(d.status)
              return (
                <div key={d.id} className="bg-naskah-surface/60 p-4 border border-naskah-aged/70">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <Link to={`/dashboard/tulis/${d.id}`} className="min-w-0">
                      <p className="font-naskah text-lg text-naskah-ink truncate">{d.judul}</p>
                    </Link>
                    <span className={`font-ketik text-[10px] uppercase px-2 py-1 shrink-0 self-start ${status.warna}`}>
                      {status.teks}
                    </span>
                  </div>

                  {d.status === 'ditolak' && d.catatanAdmin && (
                    <p className="font-ketik text-xs text-red-600 mt-2">Catatan admin: {d.catatanAdmin}</p>
                  )}

                  {bisaDihapus && (
                    <div className="flex flex-wrap gap-4 mt-3">
                      <button
                        onClick={() => ajukan(d.id)}
                        className="font-ketik text-xs uppercase text-naskah-leather underline"
                      >
                        {isAdmin ? 'Terbitkan Langsung' : 'Ajukan untuk Ditinjau'}
                      </button>
                      <button
                        onClick={() => mintaKonfirmasiHapus(d.id, d.judul)}
                        className="font-ketik text-xs uppercase text-red-600 underline"
                      >
                        Hapus Draf
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {drafts.length === 0 && (
              <p className="font-ketik italic text-sm text-naskah-inksoft/70">Belum ada tulisan. Mulai menulis sekarang.</p>
            )}
          </div>
        }
      />

      <ConfirmModal
        open={!!targetHapus}
        title="Hapus Draf?"
        message={`Draf "${targetHapus?.judul}" akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`}
        confirmText="Hapus"
        onConfirm={konfirmasiHapus}
        onCancel={() => setTargetHapus(null)}
      />

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </>
  )
}
