import { useState, useEffect } from 'react'
import api from '../api/axios'
import CardPost from '../components/common/CardPost'
import Sidebar from '../components/layout/Sidebar'

const DAFTAR_KATEGORI = ['Romansa', 'Horor', 'Slice of Life', 'Fantasi', 'Puisi']

export default function HomePage() {
  const [posts, setPosts] = useState([])
  const [keyword, setKeyword] = useState('')
  const [tab, setTab] = useState('cerpen')
  const [kategoriAktif, setKategoriAktif] = useState(null)

  useEffect(() => {
    document.title = 'secarikkertas'
  }, [])

  useEffect(() => {
    api.get('/posts', { params: { tipe: tab, q: keyword, kategori: kategoriAktif } })
      .then((res) => setPosts(res.data))
  }, [tab, keyword, kategoriAktif])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col md:flex-row gap-8 md:gap-12">
      <div className="flex-1 min-w-0">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Cari cerpen atau artikel..."
          className="w-full px-0 py-3 mb-6 sm:mb-8 bg-transparent border-b-2 border-kertas-line focus:border-stempel outline-none font-baca text-base sm:text-lg placeholder:text-tinta-faint/60 transition-colors"
        />

        <div className="flex gap-1 mb-6 sm:mb-8 font-mono text-xs uppercase tracking-wide overflow-x-auto">
          <button
            onClick={() => setTab('cerpen')}
            className={`px-4 py-2 border-b-2 whitespace-nowrap transition-colors ${
              tab === 'cerpen' ? 'border-stempel text-tinta' : 'border-transparent text-tinta-faint hover:text-tinta-soft'
            }`}
          >
            Koleksi Cerpen
          </button>
          <button
            onClick={() => setTab('artikel')}
            className={`px-4 py-2 border-b-2 whitespace-nowrap transition-colors ${
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

      <Sidebar
        kategori={DAFTAR_KATEGORI}
        kategoriAktif={kategoriAktif}
        onPilihKategori={setKategoriAktif}
        populer={posts.slice(0, 3)}
      />
    </div>
  )
}
