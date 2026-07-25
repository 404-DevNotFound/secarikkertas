import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import CommentSection from '../components/feature/CommentSection'

export default function ReadPostPage() {
  const { id } = useParams()
  const [post, setPost] = useState(null)

  useEffect(() => {
    api.get(`/posts/${id}`).then((res) => setPost(res.data))
    document.title = 'secarikkertas'

    let meta = document.querySelector('meta[name="description"]')
    if (meta && post?.isi) meta.setAttribute('content', post.isi.slice(0, 150))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

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
          className="w-full max-h-[420px] object-cover mb-8 shadow-md"
        />
      )}

      <div className="pb-8 mb-8 border-b border-kertas-line" />

      {/* Tipografi baca: paragraf lega, blockquote jadi pull-quote, tautan
          dan penekanan (i/em/strong) didukung kalau penulis pakai HTML manual */}
      <div
        className="font-baca text-[17px] sm:text-[18px] leading-[1.9] text-tinta
          [&>p]:mb-5
          [&>blockquote]:font-judul [&>blockquote]:text-xl [&>blockquote]:italic
          [&>blockquote]:text-stempel-dark [&>blockquote]:border-l-4 [&>blockquote]:border-stabilo
          [&>blockquote]:pl-5 [&>blockquote]:my-8
          [&_a]:text-biru [&_a]:underline
          [&_em]:italic [&_strong]:font-semibold"
        dangerouslySetInnerHTML={{ __html: post.isiHtml }}
      />

      <CommentSection postId={id} />
    </article>
  )
}
