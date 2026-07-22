import { useState, useEffect } from 'react'
import api from '../api/axios'
import CardPost from '../components/common/CardPost'
import Sidebar from '../components/layout/Sidebar'

export default function HomePage() {
  const [posts, setPosts] = useState([])
  const [keyword, setKeyword] = useState('')
  const [tab, setTab] = useState('cerpen')

  useEffect(() => {
    api.get('/posts', { params: { tipe: tab, q: keyword } })
      .then((res) => setPosts(res.data))
  }, [tab, keyword])

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
      <div className="flex-1">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Cari cerpen atau artikel..."
          className="w-full px-0 py-3 mb-8 bg-transparent border-b-2 border-kertas-line focus:border-stempel outline-none font-baca text-lg placeholder:text-tinta-faint/60 transition-colors"
        />

        <div className="flex gap-1 mb-8 font-mono text-xs uppercase tracking-wide">
          <button
            onClick={() => setTab('cerpen')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              tab === 'cerpen' ? 'border-stempel text-tinta' : 'border-transparent text-tinta-faint hover:text-tinta-soft'
            }`}
          >
            Koleksi Cerpen
          </button>
          <button
            onClick={() => setTab('artikel')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              tab === 'artikel' ? 'border-stempel text-tinta' : 'border-transparent text-tinta-faint hover:text-tinta-soft'
            }`}
          >
            Artikel Edukasi
          </button>
        </div>

        <div className="grid gap-5">
          {posts.map((p) => (
            <CardPost key={p.id} {...p} />
          ))}
          {posts.length === 0 && (
            <p className="font-baca italic text-tinta-faint">Belum ada tulisan.</p>
          )}
        </div>
      </div>

      <Sidebar kategori={['Romansa', 'Horor', 'Slice of Life']} populer={posts.slice(0, 3)} />
    </div>
  )
}
