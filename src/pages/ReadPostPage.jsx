import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import CommentSection from '../components/feature/CommentSection'
import Toast from '../components/common/Toast'
import MusicToggle from '../components/feature/MusicToggle'
import ReportModal from '../components/common/ReportModal'

// Estimasi ~200 kata/menit — angka umum untuk kecepatan baca orang dewasa
// dalam bahasa Indonesia. Dihitung dari isi HTML dengan tag dibuang dulu,
// jadi tag tidak ikut kehitung sebagai "kata".
function estimasiWaktuBaca(html) {
  if (!html) return 1
  const teks = html.replace(/<[^>]*>/g, ' ')
  const jumlahKata = teks.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(jumlahKata / 200))
}

export default function ReadPostPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [toast, setToast] = useState(null)
  const [terkait, setTerkait] = useState([])
  const [laporModalBuka, setLaporModalBuka] = useState(false)

  useEffect(() => {
    api.get(`/posts/${id}`).then((res) => setPost(res.data))
    api.get(`/posts/${id}/terkait`).then((res) => setTerkait(res.data)).catch(() => setTerkait([]))
    document.title = 'secarikkertas'

    let meta = document.querySelector('meta[name="description"]')
    if (meta && post?.isi) meta.setAttribute('content', post.isi.slice(0, 150))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function toggleBookmark() {
    if (!user) {
      setToast({ message: 'Masuk dulu untuk menyimpan tulisan ini.', type: 'error' })
      return
    }
    const nilaiBaru = !post.sudahBookmark
    setPost((p) => ({ ...p, sudahBookmark: nilaiBaru }))
    try {
      await api.post(`/posts/${id}/bookmark`, { disimpan: nilaiBaru })
    } catch (err) {
      setPost((p) => ({ ...p, sudahBookmark: !nilaiBaru }))
      setToast({ message: err.response?.data?.message || 'Gagal menyimpan, coba lagi.', type: 'error' })
    }
  }

  async function bagikan() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: post.judul, url })
      } catch {
        // Pengguna membatalkan share sheet — tidak perlu ditangani sebagai error
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setToast({ message: 'Tautan disalin ke clipboard.', type: 'success' })
    } catch {
      setToast({ message: 'Gagal menyalin tautan.', type: 'error' })
    }
  }

  async function kirimLaporan(alasan, detail) {
    try {
      const res = await api.post(`/posts/${id}/laporkan`, { alasan, detail })
      setToast({ message: res.data.message, type: 'success' })
      setLaporModalBuka(false)
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Gagal mengirim laporan.', type: 'error' })
    }
  }

  // Naskah dilindungi hak cipta — cegah copy/cut/seret gambar, dan kasih
  // tahu penggunanya lewat toast supaya jelas ini disengaja, bukan bug.
  function cegahSalin(e) {
    e.preventDefault()
    setToast({
      message: 'Konten ini dilindungi hak cipta. Menyalin naskah tidak diizinkan.',
      type: 'error',
    })
  }

  if (!post) return <p className="text-center py-10 text-tinta-faint font-baca italic">Memuat...</p>

  return (
    <article className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <MusicToggle />
      <Link to="/" className="font-mono text-[11px] uppercase tracking-widest text-tinta-faint hover:text-stempel-dark transition-colors">
        ← Kembali ke Beranda
      </Link>

      <div className="flex items-center gap-1.5 mt-6 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-stempel" />
        <span className="font-mono text-[11px] uppercase tracking-widest text-stempel-dark">
          {post.tipe === 'artikel' ? 'Artikel' : 'Cerpen'}
        </span>
        {post.kategori && (
          <>
            <span className="text-tinta-faint">·</span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-tinta-faint">{post.kategori}</span>
          </>
        )}
      </div>

      <h1 className="font-judul text-2xl sm:text-3xl font-semibold text-tinta leading-tight">{post.judul}</h1>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs uppercase tracking-wide text-tinta-faint mt-3 mb-4">
        <span>
          Oleh{' '}
          {post.penulisUsername ? (
            <Link to={`/penulis/${post.penulisUsername}`} className="text-stempel-dark hover:underline normal-case font-sans">
              {post.penulis}
            </Link>
          ) : post.penulis}
        </span>
        <span>·</span>
        <span>{estimasiWaktuBaca(post.isiHtml)} menit baca</span>
        <span>·</span>
        <span>{post.viewCount} dibaca</span>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={toggleBookmark}
          className={`font-mono text-xs px-3 py-1.5 border transition-colors ${
            post.sudahBookmark ? 'bg-mustard-light border-mustard text-mustard' : 'border-kertas-line text-tinta-faint hover:border-mustard hover:text-mustard'
          }`}
        >
          {post.sudahBookmark ? '🔖 Tersimpan' : '🔖 Simpan'}
        </button>
        <button
          onClick={bagikan}
          className="font-mono text-xs px-3 py-1.5 border border-kertas-line text-tinta-faint hover:border-biru hover:text-biru transition-colors"
        >
          ↗ Bagikan
        </button>
        <button
          onClick={() => setLaporModalBuka(true)}
          className="font-mono text-xs px-3 py-1.5 border border-kertas-line text-tinta-faint hover:border-red-500 hover:text-red-500 transition-colors"
        >
          ⚑ Laporkan
        </button>
      </div>

      {post.gambarSampul && (
        <img
          src={post.gambarSampul}
          alt=""
          className="w-full max-h-[420px] object-cover mb-8 shadow-md select-none"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      )}

      <div className="pb-8 mb-8 border-b border-kertas-line" />

      {/* Kertas bergaris ala buku tulis — garis horizontal biru muda tiap
          baris teks + garis margin merah di kiri, murni dekoratif (CSS),
          tidak mengganggu konten atau selectability yang sudah dimatikan
          di bawah. */}
      <div
        className="relative pl-8 sm:pl-12 pr-1 select-none"
        style={{
          // Teknik yang sama dipakai di body & .garis-buku (linear-gradient +
          // background-size eksplisit) — lebih konsisten ketebalannya di
          // berbagai layar/DPI dibanding repeating-linear-gradient multi-stop.
          backgroundImage: 'linear-gradient(#C9DCEE 1px, transparent 1px)',
          backgroundSize: '100% 38px',
          backgroundPosition: '0 34px',
        }}
        onCopy={cegahSalin}
        onCut={cegahSalin}
        onContextMenu={cegahSalin}
      >
        <div className="absolute top-0 bottom-0 left-4 sm:left-6 w-px bg-margin/60" aria-hidden />

        {/* Tipografi baca: paragraf lega, blockquote jadi pull-quote, tautan
            dan penekanan (i/em/strong) didukung kalau penulis pakai HTML manual */}
        <div
          className="font-baca text-[17px] sm:text-[18px] leading-[38px] text-tinta
            [&>p]:mb-[38px] [&>div]:mb-[38px]
            [&>blockquote]:font-judul [&>blockquote]:text-xl [&>blockquote]:italic
            [&>blockquote]:text-stempel-dark [&>blockquote]:border-l-4 [&>blockquote]:border-stabilo
            [&>blockquote]:pl-5 [&>blockquote]:my-8
            [&_a]:text-biru [&_a]:underline
            [&_em]:italic [&_strong]:font-semibold"
          dangerouslySetInnerHTML={{ __html: post.isiHtml }}
        />
      </div>

      {terkait.length > 0 && (
        <div className="mt-12 pt-8 border-t border-kertas-line">
          <h3 className="font-mono text-[11px] uppercase tracking-widest text-tinta-faint mb-4">
            Tulisan Terkait
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {terkait.map((t) => (
              <Link key={t.id} to={`/post/${t.id}`} className="block group">
                {t.gambarSampul && (
                  <img src={t.gambarSampul} alt="" className="w-full h-24 object-cover mb-2 group-hover:opacity-80 transition-opacity" />
                )}
                <p className="font-judul text-sm font-semibold text-tinta group-hover:text-stempel-dark transition-colors leading-snug">
                  {t.judul}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wide text-tinta-faint mt-1">oleh {t.penulis}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <CommentSection postId={id} />

      <ReportModal
        open={laporModalBuka}
        title="Laporkan Naskah Ini"
        onSubmit={kirimLaporan}
        onCancel={() => setLaporModalBuka(false)}
      />

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </article>
  )
}
