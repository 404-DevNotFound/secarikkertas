import { useRef, useState, useEffect } from 'react'
import api from '../../api/axios'

const TOMBOL_ALIGN = [
  { cmd: 'justifyLeft', label: 'Rata Kiri', ikon: '⯇' },
  { cmd: 'justifyCenter', label: 'Rata Tengah', ikon: '≡' },
  { cmd: 'justifyRight', label: 'Rata Kanan', ikon: '⯈' },
  { cmd: 'justifyFull', label: 'Rata Kiri-Kanan (Justify)', ikon: '☰' },
]

// Editor teks kaya (rich text) sederhana berbasis contentEditable.
// Dibuat "semi-controlled": HTML awal diisi sekali (atau saat berubah dari
// luar, mis. setelah impor Word/PDF), lalu perubahan lanjut dikirim ke parent
// lewat onChange tanpa menimpa ulang innerHTML tiap ketikan (supaya kursor
// tidak lompat-lompat).
export default function TextEditorContainer({ postId, value, onChange }) {
  const [mengunggah, setMengunggah] = useState(false)
  const [errorUnggah, setErrorUnggah] = useState('')
  const fileInputRef = useRef(null)
  const editorRef = useRef(null)
  const nilaiTerakhirDariLuar = useRef(null)

  // Pakai <p> sebagai pemisah paragraf default (bukan <div>), supaya konsisten
  // dengan tag yang diizinkan backend (sanitize-html).
  useEffect(() => {
    document.execCommand('defaultParagraphSeparator', false, 'p')
  }, [])

  // Isi ulang innerHTML hanya kalau nilainya berubah dari LUAR komponen
  // (mis. saat pertama kali post dimuat, atau setelah impor Word/PDF) —
  // bukan tiap kali user mengetik.
  useEffect(() => {
    if (value !== nilaiTerakhirDariLuar.current && editorRef.current) {
      editorRef.current.innerHTML = value || ''
      nilaiTerakhirDariLuar.current = value
    }
  }, [value])

  function handleInput() {
    const html = editorRef.current?.innerHTML || ''
    nilaiTerakhirDariLuar.current = html
    onChange(html)
  }

  function terapkanAlign(cmd) {
    editorRef.current?.focus()
    document.execCommand(cmd)
    handleInput()
  }

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
      <div className="mb-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={mengunggah}
          className="font-ketik text-xs uppercase px-3 py-1.5 border border-naskah-aged text-naskah-inksoft hover:border-naskah-leather hover:text-naskah-leather transition-colors disabled:opacity-50"
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
        <p className="font-ketik text-xs text-red-600 mb-2">{errorUnggah}</p>
      )}
      <p className="font-naskah italic text-xs text-naskah-inksoft/70 mb-3">
        Mengunggah file akan menimpa isi editor di bawah ini dengan isi dari dokumen.
      </p>

      {/* Toolbar alignment */}
      <div className="flex gap-1 mb-2 border border-naskah-aged bg-naskah-surface/50 p-1 w-fit">
        {TOMBOL_ALIGN.map((t) => (
          <button
            key={t.cmd}
            type="button"
            title={t.label}
            aria-label={t.label}
            onClick={() => terapkanAlign(t.cmd)}
            className="w-8 h-8 flex items-center justify-center text-naskah-inksoft hover:bg-naskah-leather hover:text-naskah-bg transition-colors font-naskah text-sm"
          >
            {t.ikon}
          </button>
        ))}
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder="Mulai menulis ceritamu di sini, atau unggah file Word/PDF di atas..."
        className="editor-naskah w-full min-h-[400px] p-4 border border-naskah-aged outline-none focus:border-naskah-leather font-baca text-naskah-ink transition-colors [&>p]:mb-4"
        suppressContentEditableWarning
      />
    </div>
  )
}
