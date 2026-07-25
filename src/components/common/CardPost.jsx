import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import Toast from './Toast'

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

function formatTanggal(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Ringkasan bisa berisi HTML mentah (mis. hasil editor kaya teks) —
// buang semua tag & rapikan whitespace supaya yang tampil teks bersih,
// bukan kode HTML-nya.
function bersihkanRingkasan(html) {
  if (!html) return ''
  const teks = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
  return teks
}

export default function CardPost({ id, judul, penulis, ringkasan, likes: likesAwal = 0, likedAwal = false, kategori, tipe, gambarSampul, tanggalTerbit }) {
  const [liked, setLiked] = useState(likedAwal)
  const [likes, setLikes] = useState(likesAwal)
  const [toast, setToast] = useState(null)
  const { user } = useAuth()
  const warna = warnaDariId(id)
  const sudut = miringDariId(id)

  async function handleLike() {
    // Belum login → jangan pura-pura berhasil (toggle lalu balik lagi),
    // langsung kasih tahu supaya jelas kenapa "suka"-nya gak nempel.
    if (!user) {
      setToast({ message: 'Masuk dulu untuk menyukai tulisan ini.', type: 'error' })
      return
    }

    const nilaiBaru = !liked
    setLiked(nilaiBaru)
    setLikes((n) => (nilaiBaru ? n + 1 : Math.max(0, n - 1)))
    try {
      await api.post(`/posts/${id}/like`, { liked: nilaiBaru })
    } catch (err) {
      setLiked(!nilaiBaru)
      setLikes((n) => (nilaiBaru ? Math.max(0, n - 1) : n + 1))
      setToast({ message: err.response?.data?.message || 'Gagal menyimpan suka, coba lagi.', type: 'error' })
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
            {tanggalTerbit && (
              <>
                <span className="text-naskah-inksoft/40">·</span>
                <span className="font-mono text-[11px] text-naskah-inksoft/50">{formatTanggal(tanggalTerbit)}</span>
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
            <p className="font-baca text-sm sm:text-[15px] leading-8 text-naskah-inksoft mb-2">{bersihkanRingkasan(ringkasan)}</p>
          )}

          <div className="flex items-center justify-between gap-3 mt-2">
            <Link
              to={`/post/${id}`}
              className="font-baca text-sm text-naskah-leather hover:underline inline-flex items-center gap-1 shrink-0"
            >
              Selengkapnya <span aria-hidden>→</span>
            </Link>

            <button
              onClick={handleLike}
              className={`font-mono text-xs px-4 py-1.5 border transition-colors whitespace-nowrap shrink-0 ${
                liked ? 'bg-naskah-mosslight border-naskah-moss text-naskah-moss' : 'border-naskah-aged text-naskah-inksoft/60 hover:border-naskah-moss hover:text-naskah-moss'
              }`}
            >
              {liked ? '♥ DISUKAI' : '♡ SUKA'} · {likes}
            </button>
          </div>
        </div>
      </div>

      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </article>
  )
}
