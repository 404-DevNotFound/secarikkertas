import { useState, useEffect } from 'react'
import api from '../../api/axios'
import CommentItem from './CommentItem'
import ReportModal from '../common/ReportModal'
import Toast from '../common/Toast'
import { useAuth } from '../../context/AuthContext'

// Susun daftar komentar flat (dengan parentId) jadi pohon satu-tingkat:
// komentar utama (parentId null) masing-masing membawa array balasannya.
// Cuma satu tingkat kedalaman yang dipakai di UI — balasan tidak bisa
// dibalas lagi — supaya percakapan tetap gampang diikuti.
function susunPohon(flat) {
  const balasanPerInduk = {}
  flat.forEach((c) => {
    if (c.parentId) {
      balasanPerInduk[c.parentId] = balasanPerInduk[c.parentId] || []
      balasanPerInduk[c.parentId].push(c)
    }
  })
  return flat
    .filter((c) => !c.parentId)
    .map((c) => ({ ...c, balasan: balasanPerInduk[c.id] || [] }))
}

export default function CommentSection({ postId }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [namaTamu, setNamaTamu] = useState('')
  const [laporTarget, setLaporTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const [mengirim, setMengirim] = useState(false)

  useEffect(() => {
    api.get(`/posts/${postId}/comments`).then((res) => setComments(res.data))
  }, [postId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() || mengirim) return

    setMengirim(true)
    try {
      const res = await api.post(`/posts/${postId}/comments`, {
        isi: text,
        ...(!user && { namaTamu }),
      })
      setComments((prev) => [...prev, res.data])
      setText('')
    } catch (err) {
      // Bisa gagal karena rate limit (terlalu sering komentar) atau
      // tersaring moderasi konten otomatis — lihat commentLimiter &
      // periksaKonten() di backend/routes/posts.js.
      setToast({ message: err.response?.data?.message || 'Gagal mengirim komentar, coba lagi.', type: 'error' })
    } finally {
      setMengirim(false)
    }
  }

  async function handleBalas(parentId, isiBalasan, namaTamuBalasan) {
    try {
      const res = await api.post(`/posts/${postId}/comments`, {
        isi: isiBalasan,
        parentId,
        ...(!user && { namaTamu: namaTamuBalasan }),
      })
      setComments((prev) => [...prev, res.data])
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Gagal mengirim balasan, coba lagi.', type: 'error' })
      // Dilempar lagi supaya CommentItem (pemanggil) tahu ini gagal — jadi
      // kotak balasannya TIDAK ikut ditutup/dikosongkan seolah berhasil.
      throw err
    }
  }

  async function kirimLaporan(alasan, detail) {
    try {
      const res = await api.post(`/posts/comments/${laporTarget}/laporkan`, { alasan, detail })
      setToast({ message: res.data.message, type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Gagal mengirim laporan.', type: 'error' })
    } finally {
      setLaporTarget(null)
    }
  }

  const pohonKomentar = susunPohon(comments)

  return (
    <div className="mt-10 pt-8 border-t border-kertas-line">
      <h3 className="font-judul text-lg font-semibold text-tinta mb-4">
        Komentar {comments.length > 0 && <span className="text-tinta-faint font-normal">({comments.length})</span>}
      </h3>

      {/* Sekarang komentar TIDAK wajib login — kalau belum login, minta nama (opsional) */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        {!user && (
          <input
            value={namaTamu}
            onChange={(e) => setNamaTamu(e.target.value)}
            placeholder="Nama (opsional, kosongkan untuk Anonim)"
            className="w-full px-3 py-2 border border-kertas-line text-sm font-baca outline-none focus:border-stempel transition-colors"
          />
        )}
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tulis komentar..."
            className="flex-1 px-3 py-2 border border-kertas-line font-baca outline-none focus:border-stempel transition-colors"
          />
          <button type="submit" disabled={mengirim} className="px-4 py-2 bg-tinta text-kertas font-baca text-sm hover:bg-stempel-dark transition-colors disabled:opacity-60">
            {mengirim ? 'Mengirim...' : 'Kirim'}
          </button>
        </div>
      </form>

      <div>
        {pohonKomentar.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            butuhNamaTamu={!user}
            onBalas={handleBalas}
            onLaporkan={setLaporTarget}
          />
        ))}
        {pohonKomentar.length === 0 && (
          <p className="font-baca italic text-sm text-tinta-faint">Belum ada komentar. Jadilah yang pertama.</p>
        )}
      </div>

      <ReportModal
        open={!!laporTarget}
        title="Laporkan Komentar"
        onSubmit={kirimLaporan}
        onCancel={() => setLaporTarget(null)}
      />
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
