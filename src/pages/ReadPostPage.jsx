import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import CommentSection from '../components/feature/CommentSection'

export default function ReadPostPage() {
  const { id } = useParams()
  const [post, setPost] = useState(null)

  useEffect(() => {
    api.get(`/posts/${id}`).then((res) => setPost(res.data))
  }, [id])

  if (!post) return <p className="text-center py-10 text-slate-400">Memuat...</p>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800">{post.judul}</h1>
      <p className="text-sm text-slate-500 mb-6">oleh {post.penulis}</p>

      {/* NFR-03: konten dari editor sudah disanitasi di sisi server sebelum sampai sini */}
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: post.isiHtml }}
      />

      <CommentSection postId={id} />
    </div>
  )
}
