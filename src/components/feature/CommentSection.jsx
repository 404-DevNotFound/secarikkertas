import { useState, useEffect } from 'react'
import api from '../../api/axios'
import CommentItem from './CommentItem'
import { useAuth } from '../../context/AuthContext'

export default function CommentSection({ postId }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [namaTamu, setNamaTamu] = useState('')

  useEffect(() => {
    api.get(`/posts/${postId}/comments`).then((res) => setComments(res.data))
  }, [postId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return

    const res = await api.post(`/posts/${postId}/comments`, {
      isi: text,
      ...(!user && { namaTamu }),
    })
    setComments((prev) => [res.data, ...prev])
    setText('')
  }

  return (
    <div className="mt-10 pt-8 border-t border-kertas-line">
      <h3 className="font-judul text-lg font-semibold text-tinta mb-4">Komentar</h3>

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
          <button type="submit" className="px-4 py-2 bg-tinta text-kertas font-baca text-sm hover:bg-stempel-dark transition-colors">
            Kirim
          </button>
        </div>
      </form>

      <div>
        {comments.map((c) => (
          <CommentItem key={c.id} nama={c.nama} isi={c.isi} waktu={c.waktu} anonim={c.anonim} />
        ))}
        {comments.length === 0 && (
          <p className="font-baca italic text-sm text-tinta-faint">Belum ada komentar. Jadilah yang pertama.</p>
        )}
      </div>
    </div>
  )
}
