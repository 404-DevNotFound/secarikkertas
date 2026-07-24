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
  const [statusSimpan, setStatusSimpan] = useState('Tersimpan')
  const [toast, setToast] = useState(null)
  const [menyimpanManual, setMenyimpanManual] = useState(false)
  const timerRef = useRef(null)
  const sudahDimuat = useRef(false)

  useEffect(() => {
    api.get(`/posts/${id}`).then((res) => {
      setJudul(res.data.judul)
      setIsi(res.data.isi || '')
      sudahDimuat.current = true
    })
  }, [id])

  // Auto-save tetap jalan di belakang layar (FR-03.2), tombol Simpan
  // di bawah cuma mempercepat + kasih kepastian lewat notifikasi.
  useEffect(() => {
    if (!sudahDimuat.current) return // jangan auto-save pas baru pertama load data

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
      if (tampilkanNotifikasi) {
        setToast({ message: 'Tulisan berhasil disimpan.', type: 'sukses' })
      }
      return true
    } catch (err) {
      setStatusSimpan('Gagal menyimpan')
      if (tampilkanNotifikasi) {
        setToast({ message: err.response?.data?.message || 'Gagal menyimpan tulisan', type: 'error' })
      }
      return false
    }
  }

  // Tombol "Simpan" — simpan langsung (skip jeda auto-save), kasih notifikasi,
  // lalu balik ke dasbor daftar draf.
  async function handleSimpanManual() {
    setMenyimpanManual(true)
    clearTimeout(timerRef.current)
    const berhasil = await simpanKeServer(true)
    setMenyimpanManual(false)

    if (berhasil) {
      setTimeout(() => navigate('/dashboard'), 900) // beri jeda sebentar biar notifikasi sempat kebaca
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono text-xs text-tinta-faint">{statusSimpan}</span>
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
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="w-full sm:w-auto"
        >
          Kembali ke Dasbor
        </Button>
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
