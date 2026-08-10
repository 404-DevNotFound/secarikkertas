import { useState, useEffect, useMemo } from 'react'
import api from '../api/axios'
import CardPost from '../components/common/CardPost'
import BookSpread from '../components/layout/BookSpread'
import Toast from '../components/common/Toast'
import ConfirmModal from '../components/common/ConfirmModal'

const TANPA_KOLEKSI = '__tanpa__'

export default function SavedPostsPage() {
  const [posts, setPosts] = useState([])
  const [koleksi, setKoleksi] = useState([])
  const [filterAktif, setFilterAktif] = useState('semua') // 'semua' | TANPA_KOLEKSI | id koleksi
  const [namaBaru, setNamaBaru] = useState('')
  const [memuat, setMemuat] = useState(true)
  const [toast, setToast] = useState(null)
  const [targetHapus, setTargetHapus] = useState(null) // { id, nama } | null

  function muatSemua() {
    Promise.all([api.get('/posts/tersimpan'), api.get('/collections')])
      .then(([resPosts, resKoleksi]) => {
        setPosts(resPosts.data)
        setKoleksi(resKoleksi.data)
      })
      .finally(() => setMemuat(false))
  }

  useEffect(() => {
    document.title = 'Tersimpan — secarikkertas'
    muatSemua()
  }, [])

  const postsTampil = useMemo(() => {
    if (filterAktif === 'semua') return posts
    if (filterAktif === TANPA_KOLEKSI) return posts.filter((p) => !p.collectionId)
    return posts.filter((p) => p.collectionId === filterAktif)
  }, [posts, filterAktif])

  async function buatKoleksi(e) {
    e.preventDefault()
    const nama = namaBaru.trim()
    if (!nama) return
    try {
      const res = await api.post('/collections', { nama })
      setKoleksi((prev) => [...prev, res.data])
      setNamaBaru('')
      setToast({ message: `Koleksi "${nama}" dibuat.`, type: 'sukses' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Gagal membuat koleksi', type: 'error' })
    }
  }

  async function konfirmasiHapusKoleksi() {
    if (!targetHapus) return
    try {
      await api.delete(`/collections/${targetHapus.id}`)
      setKoleksi((prev) => prev.filter((k) => k.id !== targetHapus.id))
      setPosts((prev) => prev.map((p) => (p.collectionId === targetHapus.id ? { ...p, collectionId: null } : p)))
      if (filterAktif === targetHapus.id) setFilterAktif('semua')
      setToast({ message: `Koleksi "${targetHapus.nama}" dihapus.`, type: 'sukses' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Gagal menghapus koleksi', type: 'error' })
    } finally {
      setTargetHapus(null)
    }
  }

  async function pindahkanKoleksi(postId, collectionId) {
    try {
      await api.put(`/collections/tandai/${postId}`, { collectionId: collectionId || null })
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, collectionId: collectionId || null } : p)))
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Gagal memindahkan ke koleksi', type: 'error' })
    }
  }

  return (
    <>
      <BookSpread
        kiri={
          <div className="flex flex-col h-full">
            <span className="font-ketik text-[11px] uppercase tracking-[0.25em] text-naskah-leather mb-3">
              Rak Bacaan
            </span>
            <h1 className="font-naskah text-3xl sm:text-4xl leading-tight text-naskah-ink mb-4">
              Tulisan Tersimpan
            </h1>
            <p className="font-ketik text-sm text-naskah-inksoft leading-relaxed mb-6">
              Tulisan yang kamu tandai untuk dibaca nanti berkumpul di sini.
              Kelompokkan ke koleksi kalau raknya sudah mulai penuh.
            </p>

            <h3 className="font-ketik text-[11px] uppercase tracking-[0.2em] text-naskah-inksoft/70 mb-3">
              Koleksi
            </h3>
            <ul className="space-y-2 mb-4">
              <li>
                <button
                  onClick={() => setFilterAktif('semua')}
                  className={`font-naskah text-left transition-colors ${
                    filterAktif === 'semua' ? 'text-naskah-leather font-semibold' : 'text-naskah-inksoft hover:text-naskah-ink'
                  }`}
                >
                  Semua ({posts.length})
                </button>
              </li>
              <li>
                <button
                  onClick={() => setFilterAktif(TANPA_KOLEKSI)}
                  className={`font-naskah text-left transition-colors ${
                    filterAktif === TANPA_KOLEKSI ? 'text-naskah-leather font-semibold' : 'text-naskah-inksoft hover:text-naskah-ink'
                  }`}
                >
                  Tanpa Koleksi ({posts.filter((p) => !p.collectionId).length})
                </button>
              </li>
              {koleksi.map((k) => (
                <li key={k.id} className="flex items-center justify-between gap-2 group">
                  <button
                    onClick={() => setFilterAktif(k.id)}
                    className={`font-naskah text-left transition-colors truncate ${
                      filterAktif === k.id ? 'text-naskah-leather font-semibold' : 'text-naskah-inksoft hover:text-naskah-ink'
                    }`}
                  >
                    {k.nama} ({posts.filter((p) => p.collectionId === k.id).length})
                  </button>
                  <button
                    onClick={() => setTargetHapus({ id: k.id, nama: k.nama })}
                    aria-label={`Hapus koleksi ${k.nama}`}
                    className="text-naskah-inksoft/40 hover:text-red-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>

            <form onSubmit={buatKoleksi} className="flex gap-2 mb-8">
              <input
                value={namaBaru}
                onChange={(e) => setNamaBaru(e.target.value)}
                placeholder="Nama koleksi baru..."
                maxLength={50}
                className="flex-1 min-w-0 px-2 py-1.5 bg-transparent border-b border-naskah-aged focus:border-naskah-leather outline-none font-ketik text-xs placeholder:text-naskah-inksoft/50"
              />
              <button type="submit" className="font-ketik text-[11px] uppercase text-naskah-leather underline shrink-0">
                + Buat
              </button>
            </form>

            <div className="mt-auto pt-6 border-t border-naskah-aged/60">
              <p className="font-naskah text-2xl text-naskah-ink">{posts.length}</p>
              <p className="font-ketik text-[11px] uppercase tracking-wide text-naskah-inksoft/70">
                Tulisan Tersimpan
              </p>
            </div>
          </div>
        }
        kanan={
          <div>
            <h3 className="font-ketik text-[11px] uppercase tracking-[0.2em] text-naskah-inksoft/70 mb-4">
              Daftar Bacaan
            </h3>

            {memuat && <p className="font-baca italic text-sm text-naskah-inksoft/60">Memuat...</p>}
            {!memuat && postsTampil.length === 0 && (
              <p className="font-baca italic text-sm text-naskah-inksoft/60">
                {posts.length === 0
                  ? 'Belum ada tulisan yang disimpan. Tekan ikon simpan di halaman baca untuk menambahkannya ke sini.'
                  : 'Tidak ada tulisan di koleksi ini.'}
              </p>
            )}
            {postsTampil.map((p) => (
              <div key={p.id} className="mb-1">
                <CardPost
                  id={p.id}
                  judul={p.judul}
                  penulis={p.penulis}
                  penulisUsername={p.penulisUsername}
                  ringkasan={p.ringkasan}
                  likes={p.likes}
                  likedAwal={p.sudahSuka}
                  disimpanAwal
                  tags={p.tags}
                  tipe={p.tipe}
                  gambarSampul={p.gambarSampul}
                  tanggalTerbit={p.tanggalTerbit}
                />
                {koleksi.length > 0 && (
                  <div className="flex items-center gap-2 pl-1 -mt-2 mb-4">
                    <label className="font-ketik text-[10px] uppercase text-naskah-inksoft/50 shrink-0">
                      Koleksi:
                    </label>
                    <select
                      value={p.collectionId || ''}
                      onChange={(e) => pindahkanKoleksi(p.id, e.target.value)}
                      className="font-ketik text-[11px] bg-transparent border border-naskah-aged px-1.5 py-1 outline-none focus:border-naskah-leather text-naskah-inksoft/70 max-w-[180px]"
                    >
                      <option value="">Tanpa koleksi</option>
                      {koleksi.map((k) => (
                        <option key={k.id} value={k.id}>{k.nama}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        }
      />

      <ConfirmModal
        open={!!targetHapus}
        title="Hapus Koleksi?"
        message={`Koleksi "${targetHapus?.nama}" akan dihapus. Tulisan di dalamnya TIDAK ikut terhapus, cuma jadi "Tanpa Koleksi" lagi.`}
        confirmText="Hapus"
        onConfirm={konfirmasiHapusKoleksi}
        onCancel={() => setTargetHapus(null)}
      />
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </>
  )
}
