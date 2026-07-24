import { useRef, useState } from 'react'
import api from '../../api/axios'

// Sekarang jadi "controlled component" — nilai & perubahan diatur dari
// parent (WriteEditorPage), supaya tombol "Simpan" bisa kontrol semuanya
// jadi satu titik, bukan tersebar antara auto-save internal dan manual save.
export default function TextEditorContainer({ postId, value, onChange }) {
  const [mengunggah, setMengunggah] = useState(false)
  const [errorUnggah, setErrorUnggah] = useState('')
  const fileInputRef = useRef(null)

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
      onChange(res.data.isi) // isi editor otomatis ter-timpa hasil ekstraksi
    } catch (err) {
      setErrorUnggah(err.response?.data?.message || 'Gagal mengunggah file, coba lagi')
    } finally {
      setMengunggah(false)
      e.target.value = ''
    }
  }

  return (
    <div>
      <div className="mb-2">
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

      {errorUnggah && (
        <p className="font-mono text-xs text-stabilo mb-2">{errorUnggah}</p>
      )}
      <p className="font-baca text-xs text-tinta-faint italic mb-3">
        Mengunggah file akan menimpa isi editor di bawah ini dengan isi dari dokumen.
      </p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[400px] p-4 border border-kertas-line outline-none focus:border-stempel font-baca text-tinta transition-colors"
        placeholder="Mulai menulis ceritamu di sini, atau unggah file Word/PDF di atas..."
      />
    </div>
  )
}
