import { useState, useEffect } from 'react'
import api from '../../api/axios'
import CommentItem from './CommentItem'
import { useAuth } from '../../context/AuthContext'

// FR-04.1: komentar dinamis, muncul langsung tanpa refresh halaman utama
export default function CommentSection({ postId }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')

  useEffect(() => {
    api.get(`/posts/${postId}/comments`).then((res) => setComments(res.data))
  }, [postId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return

    const res = await api.post(`/posts/${postId}/comments`, { isi: text })
    // langsung tambahkan ke daftar yang tampil, tanpa reload/fetch ulang
    setComments((prev) => [res.data, ...prev])
    setText('')
  }

  return (
    <div className="mt-8">
      <h3 className="font-semibold text-slate-800 mb-3">Komentar</h3>

      {user && (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tulis komentar..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-200"
          />
          <button className="px-4 py-2 bg-slate-800 text-white rounded-lg">Kirim</button>
        </form>
      )}

      <div>
        {comments.map((c) => (
          <CommentItem key={c.id} nama={c.nama} isi={c.isi} waktu={c.waktu} />
        ))}
      </div>
    </div>
  )
}
