import { useState, useEffect, useRef } from 'react'
import api from '../../api/axios'

// FR-03.1: sementara pakai <textarea>. Ganti dengan Quill/Editor.js nanti:
//   npm install quill  ->  lalu ganti bagian <textarea> di bawah dengan komponen Quill.
// FR-03.2: Auto-save tiap beberapa detik ke server.
export default function TextEditorContainer({ postId, isiAwal = '' }) {
  const [isi, setIsi] = useState(isiAwal)
  const [status, setStatus] = useState('Tersimpan')
  const timerRef = useRef(null)

  useEffect(() => {
    setStatus('Menyimpan...')
    clearTimeout(timerRef.current)

    // Debounce: tunggu user berhenti mengetik 2 detik baru simpan ke server
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

  return (
    <div>
      <div className="flex justify-end mb-2 text-xs text-slate-400">{status}</div>
      <textarea
        value={isi}
        onChange={(e) => setIsi(e.target.value)}
        className="w-full min-h-[400px] p-4 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-200"
        placeholder="Mulai menulis ceritamu di sini..."
      />
    </div>
  )
}
