import { useState, useEffect, useRef } from 'react'
import api from '../../api/axios'

export default function TextEditorContainer({ postId, isiAwal = '' }) {
  const [isi, setIsi] = useState(isiAwal)
  const [status, setStatus] = useState('Tersimpan')
  const [mengunggah, setMengunggah] = useState(false)
  const [errorUnggah, setErrorUnggah] = useState('')
  const timerRef = useRef(null)
  const fileInputRef = useRef(null)

  // Sinkronkan kalau isiAwal berubah dari luar (misal setelah upload berhasil)
  useEffect(() => {
    setIsi(isiAwal)
  }, [isiAwal])

  useEffect(() => {
    setStatus('Menyimpan...')
    clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      try {
        await api.put(`/posts/${postId}/draft`, { isi })
        setStatus('Tersimpan')
      } catch (err) {
        setStatus('Gagal menyimpan')
      }
    }, 2000)

    return () => clearTimeout(timerRef.current)
  }, [isi, postId])

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const namaValid = /\.(docx|pdf)$/i.test(file.name)
    if (!namaValid) {
      setErrorUnggah('Format file harus .docx atau .pdf')
      e.target.value = ''
      return
    }

    setErrorUnggah('')
    setMengunggah(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post(`/posts/${postId}/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setIsi(res.data.isi) // otomatis timpa isi editor dengan hasil ekstraksi
      setStatus('Tersimpan')
    } catch (err) {
      setErrorUnggah(err.response?.data?.message || 'Gagal mengunggah file, coba lagi')
    } finally {
      setMengunggah(false)
      e.target.value = '' // reset supaya bisa upload file yang sama lagi kalau perlu
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={mengunggah}
            className="font-mono text-xs uppercase px-3 py-1.5 border border-kertas-line text-tinta-soft hover:border-stempel hover:text-stempel-dark transition-colors disabled:opacity-50"
          >
            {mengunggah ? 'Mengunggah...' : '↑ Unggah dari Word/PDF'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <span className="text-xs text-tinta-faint font-mono">{status}</span>
      </div>

      {errorUnggah && (
        <p className="font-mono text-xs text-stabilo mb-2">{errorUnggah}</p>
      )}
      <p className="font-baca text-xs text-tinta-faint italic mb-3">
        Mengunggah file akan menimpa isi editor di bawah ini dengan isi dari dokumen.
      </p>

      <textarea
        value={isi}
        onChange={(e) => setIsi(e.target.value)}
        className="w-full min-h-[400px] p-4 border border-kertas-line outline-none focus:border-stempel font-baca text-tinta transition-colors"
        placeholder="Mulai menulis ceritamu di sini, atau unggah file Word/PDF di atas..."
      />
    </div>
  )
}
