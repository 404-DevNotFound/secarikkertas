import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import TextEditorContainer from '../components/feature/TextEditorContainer'
import Button from '../components/common/Button'
import Toast from '../components/common/Toast'
import BookSpread from '../components/layout/BookSpread'
import { useAuth } from '../context/AuthContext'

export default function WriteEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [judul, setJudul] = useState('')
  const [isi, setIsi] = useState('')
  const [genre, setGenre] = useState('')
  const [tipe, setTipe] = useState('cerpen')
  const [status, setStatus] = useState('draft')
  const [gambarSampul, setGambarSampul] = useState(null)
  const [statusSimpan, setStatusSimpan] = useState('Tersimpan')
  const [toast, setToast] = useState(null)
  const [menyimpanManual, setMenyimpanManual] = useState(false)
  const [menerbitkanUlang, setMenerbitkanUlang] = useState(false)
  const [mengunggahGambar, setMengunggahGambar] = useState(false)
  const [daftarGenre, setDaftarGenre] = useState([])
  const timerRef = useRef(null)
  const sudahDimuat = useRef(false)
  const fileGambarRef = useRef(null)

  // Artikel edukasi tidak punya genre bebas — selalu "Umum".
  const genreTerkunci = tipe === 'artikel'

  // Ambil daftar genre siap-pakai dari backend (tabel Genre) buat isi dropdown.
  useEffect(() => {
    api.get('/genres').then((res) => setDaftarGenre(res.data)).catch(() => setDaftarGenre([]))
  }, [])

  useEffect(() => {
    api.get(`/posts/${id}`).then((res) => {
      setJudul(res.data.judul)
      setIsi(res.data.isi || '')
      setTipe(res.data.tipe || 'cerpen')
      setGenre(res.data.tipe === 'artikel' ? 'Umum' : (res.data.kategori || ''))
      setStatus(res.data.status || 'draft')
      setGambarSampul(res.data.gambarSampul || null)
      sudahDimuat.current = true
    })
  }, [id])

  useEffect(() => {
    if (!sudahDimuat.current) return

    setStatusSimpan('Menyimpan...')
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => simpanKeServer(false), 2000)

    return () => clearTimeout(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [judul, isi, genre])

  async function simpanKeServer(tampilkanNotifikasi) {
    try {
      // Artikel selalu "Umum". Genre kosong (cerpen) -> otomatis "Umum" juga,
      // jangan biarkan tersimpan string kosong.
      const genreDikirim = genreTerkunci ? 'Umum' : (genre.trim() || 'Umum')
      await api.put(`/posts/${id}/draft`, { judul, isi, kategori: genreDikirim })
      setStatusSimpan('Tersimpan')
      if (tampilkanNotifikasi) setToast({ message: 'Tulisan berhasil disimpan.', type: 'sukses' })
      return true
    } catch (err) {
      setStatusSimpan('Gagal menyimpan')
      if (tampilkanNotifikasi) setToast({ message: err.response?.data?.message || 'Gagal menyimpan tulisan', type: 'error' })
      return false
    }
  }

  async function handleSimpanManual() {
    setMenyimpanManual(true)
    clearTimeout(timerRef.current)
    const berhasil = await simpanKeServer(true)
    setMenyimpanManual(false)
    if (berhasil) setTimeout(() => navigate('/dashboard'), 900)
  }

  // Khusus admin, mengedit naskah yang sudah terbit: simpan dulu perubahan,
  // baru picu ulang endpoint publish supaya naskah live ter-update dan
  // statusnya tetap "terbit".
  async function handleTerbitkanUlang() {
    setMenerbitkanUlang(true)
    clearTimeout(timerRef.current)
    const tersimpan = await simpanKeServer(false)
    if (!tersimpan) {
      setMenerbitkanUlang(false)
      setToast({ message: 'Gagal menyimpan perubahan, naskah belum diterbitkan ulang.', type: 'error' })
      return
    }
    try {
      await api.put(`/posts/${id}/ajukan`)
      setToast({ message: 'Naskah berhasil diterbitkan ulang.', type: 'sukses' })
      setTimeout(() => navigate('/admin'), 900)
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Gagal menerbitkan ulang naskah', type: 'error' })
    } finally {
      setMenerbitkanUlang(false)
    }
  }

  async function handleUploadGambar(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setToast({ message: 'File harus berupa gambar (jpg/png/dll)', type: 'error' })
      e.target.value = ''
      return
    }

    setMengunggahGambar(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post(`/posts/${id}/cover`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setGambarSampul(res.data.gambarSampul)
      setToast({ message: 'Gambar sampul berhasil diunggah.', type: 'sukses' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Gagal mengunggah gambar', type: 'error' })
    } finally {
      setMengunggahGambar(false)
      e.target.value = ''
    }
  }

  async function handleHapusGambar() {
    try {
      await api.delete(`/posts/${id}/cover`)
      setGambarSampul(null)
      setToast({ message: 'Gambar sampul dihapus.', type: 'sukses' })
    } catch {
      setToast({ message: 'Gagal menghapus gambar', type: 'error' })
    }
  }

  return (
    <>
      <BookSpread
        kiri={
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <span className="font-ketik text-[11px] uppercase tracking-[0.25em] text-naskah-leather">
                Meja Kerja
              </span>
              <span className="font-ketik text-[11px] text-naskah-inksoft/60">{statusSimpan}</span>
            </div>

            {/* Jenis Tulisan — ditentukan saat naskah dibuat, ditampilkan
                sebagai info saja (bukan bisa diganti di sini). */}
            <p className="font-ketik text-[11px] uppercase tracking-widest text-naskah-inksoft/70 mb-2">
              Jenis Tulisan
            </p>
            <div className="flex items-center gap-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-stempel" />
              <span className="font-mono text-xs uppercase tracking-widest text-naskah-inksoft">
                {tipe === 'artikel' ? 'Artikel Edukasi' : 'Cerpen'}
              </span>
              {isAdmin && status === 'terbit' && (
                <span className="font-ketik text-[10px] uppercase px-2 py-0.5 bg-naskah-mosslight text-naskah-moss ml-1">
                  Terbit
                </span>
              )}
            </div>

            {/* Gambar Sampul */}
            <p className="font-ketik text-[11px] uppercase tracking-widest text-naskah-inksoft/70 mb-2">
              Gambar Sampul
            </p>
            {gambarSampul ? (
              <div className="relative inline-block mb-6">
                <img src={gambarSampul} alt="" className="w-full max-h-64 object-cover shadow-sm" />
                <button
                  onClick={handleHapusGambar}
                  className="absolute top-2 right-2 bg-naskah-ink/80 text-naskah-bg font-ketik text-[10px] uppercase px-2 py-1 hover:bg-red-600 transition-colors"
                >
                  Hapus
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fileGambarRef.current?.click()}
                  disabled={mengunggahGambar}
                  className="w-full h-32 border-2 border-dashed border-naskah-aged text-naskah-inksoft/70 hover:border-naskah-leather hover:text-naskah-leather transition-colors font-ketik text-xs uppercase disabled:opacity-50 mb-6"
                >
                  {mengunggahGambar ? 'Mengunggah...' : '+ Tambah Gambar Sampul'}
                </button>
              </>
            )}
            <input ref={fileGambarRef} type="file" accept="image/*" onChange={handleUploadGambar} className="hidden" />

            <p className="font-ketik text-[11px] uppercase tracking-widest text-naskah-inksoft/70 mb-2">
              Judul
            </p>
            <input
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Judul tulisan..."
              className="w-full px-3 py-2.5 mb-6 bg-white border border-naskah-aged focus:border-naskah-leather outline-none font-naskah text-xl text-naskah-ink transition-colors"
            />

            <p className="font-ketik text-[11px] uppercase tracking-widest text-naskah-inksoft/70 mb-2">
              Genre
            </p>
            {genreTerkunci ? (
              <div className="w-full px-3 py-2.5 mb-2 bg-naskah-aged/30 border border-naskah-aged font-baca text-sm text-naskah-inksoft/70">
                Umum
              </div>
            ) : (
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-2.5 mb-2 bg-white border border-naskah-aged focus:border-naskah-leather outline-none font-baca text-sm text-naskah-ink transition-colors"
              >
                <option value="">Umum (default)</option>
                {daftarGenre.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            )}
            <p className="font-ketik text-[10px] text-naskah-inksoft/50 mb-8">
              {genreTerkunci
                ? 'Artikel edukasi selalu memakai genre "Umum" dan tidak bisa diganti.'
                : 'Pilih genre yang paling sesuai dengan isi ceritanya.'}
            </p>

            <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-naskah-aged/60">
              {isAdmin && status === 'terbit' && (
                <Button
                  onClick={handleTerbitkanUlang}
                  disabled={menerbitkanUlang}
                  className="!bg-naskah-moss !text-white hover:!bg-naskah-moss/90 !font-ketik w-full disabled:opacity-60"
                >
                  {menerbitkanUlang ? 'Menerbitkan Ulang...' : 'Simpan & Terbitkan Ulang'}
                </Button>
              )}
              <Button
                onClick={handleSimpanManual}
                disabled={menyimpanManual}
                className="!bg-naskah-leather !text-naskah-bg hover:!bg-naskah-leatherdark !font-ketik w-full"
              >
                {menyimpanManual ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(isAdmin && status === 'terbit' ? '/admin' : '/dashboard')}
                className="!border-naskah-aged !text-naskah-inksoft hover:!bg-naskah-aged/40 !font-ketik w-full"
              >
                {isAdmin && status === 'terbit' ? 'Kembali ke Panel Admin' : 'Kembali ke Dasbor'}
              </Button>
            </div>
          </div>
        }
        kanan={
          <div>
            <p className="font-ketik text-[11px] uppercase tracking-widest text-naskah-inksoft/70 mb-3">
              Naskah
            </p>
            <TextEditorContainer postId={id} value={isi} onChange={setIsi} />
          </div>
        }
      />

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </>
  )
}
