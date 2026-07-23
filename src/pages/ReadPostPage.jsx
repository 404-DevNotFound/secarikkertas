import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import CommentSection from '../components/feature/CommentSection'

export default function ReadPostPage() {
  const { id } = useParams()
  const [post, setPost] = useState(null)

  useEffect(() => {
    api.get(`/posts/${id}`).then((res) => {
      setPost(res.data)
      document.title = `${res.data.judul} — secarikkertas`

      let meta = document.querySelector('meta[name="description"]')
      if (meta) meta.setAttribute('content', res.data.isi?.slice(0, 150) || '')
    })

    return () => {
      document.title = 'secarikkertas — Komunitas Cerpen & Artikel Kepenulisan'
    }
  }, [id])

  if (!post) return <p className="text-center py-10 text-tinta-faint font-baca italic">Memuat...</p>

  return (
    <article className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-judul text-2xl sm:text-3xl font-semibold text-tinta">{post.judul}</h1>
      <p className="font-mono text-xs uppercase tracking-wide text-tinta-faint mt-2 mb-6">oleh {post.penulis}</p>

      {/* NFR-03: konten sudah disanitasi di server sebelum sampai sini */}
      <div
        className="font-baca text-[16px] sm:text-[17px] leading-relaxed text-tinta prose-p:mb-4"
        dangerouslySetInnerHTML={{ __html: post.isiHtml }}
      />

      <CommentSection postId={id} />
    </article>
  )
}
