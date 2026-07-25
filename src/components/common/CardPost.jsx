import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'

// Rotasi warna badge kategori — supaya tidak monoton satu warna terus
const WARNA_BADGE = [
  { bg: 'bg-stempel', text: 'text-stempel-dark', dot: 'bg-stempel' },
  { bg: 'bg-biru', text: 'text-biru', dot: 'bg-biru' },
  { bg: 'bg-merahmuda', text: 'text-merahmuda', dot: 'bg-merahmuda' },
  { bg: 'bg-mustard', text: 'text-mustard', dot: 'bg-mustard' },
]
function warnaDariId(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return WARNA_BADGE[Math.abs(hash) % WARNA_BADGE.length]
}

// Kemiringan kecil acak (tapi konsisten per-id) biar kesan "ditempel tangan"
function miringDariId(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 3) - hash)
  const sudut = (Math.abs(hash) % 3) - 1 // -1, 0, atau 1 derajat
  return sudut
}

export default function CardPost({ id, judul, penulis, ringkasan, likes: likesAwal = 0, likedAwal = false, kategori, tipe, gambarSampul }) {
  const [liked, setLiked] = useState(likedAwal)
  const [likes, setLikes] = useState(likesAwal)
  const warna = warnaDariId(id)
  const sudut = miringDariId(id)

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
    <article
      style={{ transform: `rotate(${sudut}deg)` }}
      className="relative bg-white p-4 sm:p-5 shadow-[0_2px_6px_rgba(43,42,40,0.1)] hover:shadow-[0_6px_18px_rgba(43,42,40,0.16)] hover:rotate-0 transition-all"
    >
      {/* Washi tape dekoratif di atas kartu */}
      <div className={`washi-tape ${warna.bg}`} />

      <div className="flex gap-4">
        {gambarSampul && (
          <Link to={`/post/${id}`} className="shrink-0">
            <img
              src={gambarSampul}
              alt=""
              className="w-20 h-20 sm:w-28 sm:h-28 object-cover border-2 border-white shadow-sm"
            />
          </Link>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-2">
            <span className={`w-1.5 h-1.5 rounded-full ${warna.dot}`} />
            <span className={`font-mono text-[11px] uppercase tracking-widest ${warna.text}`}>
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
        </div>
      </div>
    </article>
  )
}
