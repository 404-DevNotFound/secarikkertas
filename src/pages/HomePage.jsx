import { useState, useEffect } from 'react'
import api from '../api/axios'
import CardPost from '../components/common/CardPost'
import Sidebar from '../components/layout/Sidebar'

export default function HomePage() {
  const [posts, setPosts] = useState([])
  const [keyword, setKeyword] = useState('')
  const [tab, setTab] = useState('cerpen') // FR-03.3: tab Artikel vs Cerpen

  useEffect(() => {
    api.get('/posts', { params: { tipe: tab, q: keyword } })
      .then((res) => setPosts(res.data))
  }, [tab, keyword]) // FR-05.2: search-as-you-type, otomatis fetch ulang saat keyword berubah

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      <div className="flex-1">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Cari cerpen atau artikel..."
          className="w-full px-4 py-2 mb-6 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-200"
        />

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('cerpen')}
            className={`px-4 py-2 rounded-lg ${tab === 'cerpen' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}
          >
            Koleksi Cerpen
          </button>
          <button
            onClick={() => setTab('artikel')}
            className={`px-4 py-2 rounded-lg ${tab === 'artikel' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}
          >
            Artikel Edukasi
          </button>
        </div>

        <div className="grid gap-4">
          {posts.map((p) => (
            <CardPost key={p.id} {...p} />
          ))}
          {posts.length === 0 && <p className="text-slate-400">Belum ada tulisan.</p>}
        </div>
      </div>

      <Sidebar kategori={['Coming of Age', 'Romansa']} populer={posts.slice(0, 3)} />
    </div>
  )
}
