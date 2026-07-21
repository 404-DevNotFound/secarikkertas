import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'

// Ini pengembangan dari CardPost yang sudah kamu buat sendiri sebelumnya.
// Bedanya: sekarang liked datang dari props (data asli dari server),
// dan saat diklik langsung update tampilan dulu (optimistic),
// baru kirim request ke server di belakang layar (FR-04.2).
export default function CardPost({ id, judul, penulis, ringkasan, likedAwal = false }) {
  const [liked, setLiked] = useState(likedAwal)

  async function handleLike() {
    const nilaiBaru = !liked
    setLiked(nilaiBaru) // update UI instan, tidak nunggu server

    try {
      await api.post(`/posts/${id}/like`, { liked: nilaiBaru })
    } catch (err) {
      // kalau request gagal, kembalikan tampilan seperti semula
      setLiked(!nilaiBaru)
      console.error('Gagal menyimpan like:', err)
    }
  }

  return (
    <div className="p-5 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <Link to={`/post/${id}`}>
        <h2 className="text-lg font-semibold text-slate-800">{judul}</h2>
      </Link>
      <p className="text-sm text-slate-500 mb-2">oleh {penulis}</p>
      {ringkasan && <p className="text-slate-600 text-sm mb-3">{ringkasan}</p>}

      <button
        onClick={handleLike}
        className="text-sm px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50"
      >
        {liked ? '❤️ Disukai' : '🤍 Suka'}
      </button>
    </div>
  )
}
