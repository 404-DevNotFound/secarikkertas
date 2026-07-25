import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'

// Rotasi warna badge kategori — supaya tidak monoton satu warna terus
const WARNA_BADGE = [
  { text: 'text-stempel-dark', dot: 'bg-stempel' },
  { text: 'text-biru', dot: 'bg-biru' },
  { text: 'text-merahmuda', dot: 'bg-merahmuda' },
  { text: 'text-mustard', dot: 'bg-mustard' },
]
function warnaDariId(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return WARNA_BADGE[Math.abs(hash) % WARNA_BADGE.length]
}

// Kemiringan kecil acak (tapi konsisten per-id) di judul — biar kesan
// "ditulis tangan", bukan barisan judul yang kaku lurus sempurna
function miringDariId(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 3) - hash)
  const sudut = (Math.abs(hash) % 5) / 4 - 0.5 // antara -0.5 dan 0.75 derajat
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
    } catch {
      setLiked(!nilaiBaru)
      setLikes((n) => (nilaiBaru ? Math.max(0, n - 1) : n + 1))
    }
  }

  return (
    // Tanpa kartu putih/bayangan — tulisan langsung "di atas" garis buku
    // (background garis-buku disediakan wrapper di HomePage), dipisah
    // antar-entri dengan garis bawah tipis, bukan kotak terpisah.
    <article className="relative py-6 first:pt-2 border-b border-naskah-aged/50 last:border-none">
      <div className="flex gap-4">
        {gambarSampul && (
          <Link to={`/post/${id}`} className="shrink-0">
            <img
              src={gambarSampul}
              alt=""
              className="w-20 h-20 sm:w-28 sm:h-28 object-cover shadow-sm"
              style={{ transform: `rotate(${sudut * -1.4}deg)` }}
            />
          </Link>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${warna.dot}`} />
            <span className={`font-mono text-[11px] uppercase tracking-widest ${warna.text}`}>
              {tipe === 'artikel' ? 'Artikel' : 'Cerpen'}
            </span>
            {kategori && (
              <>
                <span className="text-naskah-inksoft/40">·</span>
                <span className="font-mono text-[11px] uppercase tracking-widest text-naskah-inksoft/50">{kategori}</span>
              </>
            )}
          </div>

          <Link to={`/post/${id}`} className="inline-block" style={{ transform: `rotate(${sudut}deg)` }}>
            <h2 className="font-judul text-lg sm:text-xl font-semibold text-naskah-ink hover:text-naskah-leather transition-colors">
              {judul}
            </h2>
          </Link>
          <p className="font-mono text-[11px] uppercase tracking-wide text-naskah-inksoft/50 mt-1 mb-2">
            oleh {penulis}
          </p>
          {ringkasan && (
            <p className="font-baca text-sm sm:text-[15px] leading-8 text-naskah-inksoft mb-2">{ringkasan}</p>
          )}

          <div className="flex items-center justify-between mt-2">
            <Link
              to={`/post/${id}`}
              className="font-baca text-sm text-naskah-leather hover:underline inline-flex items-center gap-1"
            >
              Selengkapnya <span aria-hidden>→</span>
            </Link>

            <button
              onClick={handleLike}
              className={`font-mono text-xs px-3 py-1.5 border transition-colors ${
                liked ? 'bg-naskah-mosslight border-naskah-moss text-naskah-moss' : 'border-naskah-aged text-naskah-inksoft/60 hover:border-naskah-moss hover:text-naskah-moss'
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
