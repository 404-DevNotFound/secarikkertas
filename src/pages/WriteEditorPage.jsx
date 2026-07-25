import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import TextEditorContainer from '../components/feature/TextEditorContainer'
import InputField from '../components/common/InputField'
import Button from '../components/common/Button'
import Toast from '../components/common/Toast'

export default function WriteEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [judul, setJudul] = useState('')
  const [isi, setIsi] = useState('')
  const [gambarSampul, setGambarSampul] = useState(null)
  const [statusSimpan, setStatusSimpan] = useState('Tersimpan')
  const [toast, setToast] = useState(null)
  const [menyimpanManual, setMenyimpanManual] = useState(false)
  const [mengunggahGambar, setMengunggahGambar] = useState(false)
  const timerRef = useRef(null)
  const sudahDimuat = useRef(false)
  const fileGambarRef = useRef(null)

  useEffect(() => {
    api.get(`/posts/${id}`).then((res) => {
      setJudul(res.data.judul)
      setIsi(res.data.isi || '')
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
  }, [judul, isi])

  async function simpanKeServer(tampilkanNotifikasi) {
    try {
      await api.put(`/posts/${id}/draft`, { judul, isi })
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
    } catch (err) {
      setToast({ message: 'Gagal menghapus gambar', type: 'error' })
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono text-xs text-tinta-faint">{statusSimpan}</span>
      </div>

      {/* Gambar Sampul */}
      <div className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-widest text-tinta-faint mb-2">Gambar Sampul</p>
        {gambarSampul ? (
          <div className="relative inline-block">
            <img src={gambarSampul} alt="" className="w-full max-h-64 object-cover shadow-sm" />
            <button
              onClick={handleHapusGambar}
              className="absolute top-2 right-2 bg-tinta/80 text-kertas font-mono text-[10px] uppercase px-2 py-1 hover:bg-red-600 transition-colors"
            >
              Hapus
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileGambarRef.current?.click()}
            disabled={mengunggahGambar}
            className="w-full h-32 border-2 border-dashed border-kertas-line text-tinta-faint hover:border-stempel hover:text-stempel-dark transition-colors font-mono text-xs uppercase disabled:opacity-50"
          >
            {mengunggahGambar ? 'Mengunggah...' : '+ Tambah Gambar Sampul'}
          </button>
        )}
        <input ref={fileGambarRef} type="file" accept="image/*" onChange={handleUploadGambar} className="hidden" />
      </div>

      <InputField
        value={judul}
        onChange={(e) => setJudul(e.target.value)}
        placeholder="Judul tulisan..."
        className="text-xl font-judul font-semibold"
      />

      <TextEditorContainer postId={id} value={isi} onChange={setIsi} />

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button onClick={handleSimpanManual} disabled={menyimpanManual} className="w-full sm:w-auto">
          {menyimpanManual ? 'Menyimpan...' : 'Simpan'}
        </Button>
        <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full sm:w-auto">
          Kembali ke Dasbor
        </Button>
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
