import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import CommentSection from '../components/feature/CommentSection'
import Toast from '../components/common/Toast'

export default function ReadPostPage() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    api.get(`/posts/${id}`).then((res) => setPost(res.data))
    document.title = 'secarikkertas'

    let meta = document.querySelector('meta[name="description"]')
    if (meta && post?.isi) meta.setAttribute('content', post.isi.slice(0, 150))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

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
      <p className="font-mono text-xs uppercase tracking-wide text-tinta-faint mt-3 mb-6">
        Oleh {post.penulis}
      </p>

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
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent, transparent 37px, #C9DCEE 38px)',
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

      <CommentSection postId={id} />

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </article>
  )
}
