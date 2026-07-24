import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'

const TORN_EDGE = {
  clipPath:
    'polygon(0% 6px, 4% 0%, 8% 6px, 12% 0%, 16% 6px, 20% 0%, 24% 6px, 28% 0%, 32% 6px, 36% 0%, 40% 6px, 44% 0%, 48% 6px, 52% 0%, 56% 6px, 60% 0%, 64% 6px, 68% 0%, 72% 6px, 76% 0%, 80% 6px, 84% 0%, 88% 6px, 92% 0%, 96% 6px, 100% 0%, 100% 100%, 0% 100%)',
}

export default function CardPost({ id, judul, penulis, ringkasan, likes: likesAwal = 0, likedAwal = false, kategori, tipe }) {
  const [liked, setLiked] = useState(likedAwal)
  const [likes, setLikes] = useState(likesAwal)

  async function handleLike() {
    const nilaiBaru = !liked
    setLiked(nilaiBaru)
    setLikes((n) => (nilaiBaru ? n + 1 : Math.max(0, n - 1)))
    try {
      await api.post(`/posts/${id}/like`, { liked: nilaiBaru })
    } catch (err) {
      setLiked(!nilaiBaru)
      setLikes((n) => (nilaiBaru ? Math.max(0, n - 1) : n + 1))
    }
  }

  return (
    <article style={TORN_EDGE} className="bg-white pt-4 pb-5 px-4 sm:px-6 shadow-[0_1px_3px_rgba(43,42,40,0.08)] hover:shadow-[0_4px_14px_rgba(43,42,40,0.12)] transition-shadow">
      {/* Badge kategori/tipe, ala referensi (label bertitik di atas judul) */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-stempel" />
        <span className="font-mono text-[11px] uppercase tracking-widest text-stempel-dark">
          {tipe === 'artikel' ? 'Artikel' : 'Cerpen'}
        </span>
        {kategori && (
          <>
            <span className="text-tinta-faint">·</span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-tinta-faint">{kategori}</span>
          </>
        )}
      </div>

      <Link to={`/post/${id}`}>
        <h2 className="font-judul text-lg sm:text-xl font-semibold text-tinta hover:text-stempel-dark transition-colors">
          {judul}
        </h2>
      </Link>
      <p className="font-mono text-[11px] uppercase tracking-wide text-tinta-faint mt-1 mb-3">
        oleh {penulis}
      </p>
      {ringkasan && (
        <p className="font-baca text-sm sm:text-[15px] leading-relaxed text-tinta-soft mb-4">{ringkasan}</p>
      )}

      <div className="flex items-center justify-between">
        <Link
          to={`/post/${id}`}
          className="font-baca text-sm text-stempel-dark hover:underline inline-flex items-center gap-1"
        >
          Selengkapnya <span aria-hidden>→</span>
        </Link>

        <button
          onClick={handleLike}
          className={`font-mono text-xs px-3 py-1.5 border transition-colors ${
            liked ? 'bg-stempel-light border-stempel text-stempel-dark' : 'border-kertas-line text-tinta-soft hover:border-stempel hover:text-stempel-dark'
          }`}
        >
          {liked ? '♥ DISUKAI' : '♡ SUKA'} · {likes}
        </button>
      </div>
    </article>
  )
}
