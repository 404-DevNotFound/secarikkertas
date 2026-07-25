import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import CardPost from '../components/common/CardPost'
import BookSpread from '../components/layout/BookSpread'
import Pagination from '../components/common/Pagination'

const DAFTAR_KATEGORI = ['Romansa', 'Horor', 'Slice of Life', 'Coming of Age']

export default function HomePage() {
  const [posts, setPosts] = useState([])
  const [keyword, setKeyword] = useState('')
  const [tab, setTab] = useState('cerpen')
  const [kategoriAktif, setKategoriAktif] = useState(null)
  const [halaman, setHalaman] = useState(1)
  const [totalHalaman, setTotalHalaman] = useState(1)

  useEffect(() => {
    document.title = 'secarikkertas'
  }, [])

  useEffect(() => {
    api.get('/posts', { params: { tipe: tab, q: keyword, kategori: kategoriAktif, page: halaman, limit: 6 } })
      .then((res) => {
        setPosts(res.data.data)
        setTotalHalaman(res.data.totalPages)
      })
  }, [tab, keyword, kategoriAktif, halaman])

  // Ganti tab/pencarian/kategori → balik ke halaman 1 (dipanggil langsung
  // dari handler, bukan lewat useEffect terpisah, biar gak ada setState
  // berantai di dalam effect)
  function pilihTab(t) {
    setTab(t)
    setHalaman(1)
  }
  function ubahKeyword(v) {
    setKeyword(v)
    setHalaman(1)
  }
  function pilihKategori(k) {
    setKategoriAktif(k)
    setHalaman(1)
  }

  const populer = posts.slice(0, 3)

  return (
    <BookSpread
      kiri={
        <div className="flex flex-col h-full">
          <span className="font-ketik text-[11px] uppercase tracking-[0.25em] text-naskah-leather mb-3">
            Bagian I &middot; Pendahuluan
          </span>
          <h1 className="font-naskah text-3xl sm:text-4xl leading-tight text-naskah-ink mb-4">
            Selamat datang di <em className="not-italic italic">secarikkertas</em>
          </h1>
          <blockquote className="font-baca text-sm italic text-naskah-inksoft leading-relaxed mb-6 border-l-2 border-naskah-moss/50 pl-4">
            "Orang boleh pandai setinggi langit, tapi selama ia tidak menulis, ia akan
            hilang di dalam masyarakat dan dari sejarah."
            <footer className="not-italic font-mono text-[11px] uppercase tracking-widest text-naskah-inksoft/50 mt-2">
              — Pramoedya Ananta Toer
            </footer>
          </blockquote>

          <input
            value={keyword}
            onChange={(e) => ubahKeyword(e.target.value)}
            placeholder="Cari cerpen atau artikel..."
            className="w-full px-0 py-3 mb-8 bg-transparent border-b border-naskah-aged focus:border-naskah-leather outline-none font-ketik text-sm placeholder:text-naskah-inksoft/50 transition-colors"
          />

          <h3 className="font-ketik text-[11px] uppercase tracking-[0.2em] text-naskah-inksoft/70 mb-3">
            Kategori
          </h3>
          <ul className="space-y-2 mb-8">
            <li>
              <button
                onClick={() => pilihKategori(null)}
                className={`font-naskah text-left transition-colors ${
                  !kategoriAktif ? 'text-naskah-leather font-semibold' : 'text-naskah-inksoft hover:text-naskah-ink'
                }`}
              >
                Semua Tulisan
              </button>
            </li>
            {DAFTAR_KATEGORI.map((k) => (
              <li key={k}>
                <button
                  onClick={() => pilihKategori(k)}
                  className={`font-naskah text-left transition-colors ${
                    kategoriAktif === k ? 'text-naskah-leather font-semibold' : 'text-naskah-inksoft hover:text-naskah-ink'
                  }`}
                >
                  {k}
                </button>
              </li>
            ))}
          </ul>

          {populer.length > 0 && (
            <div className="mt-auto pt-6 border-t border-naskah-aged/60">
              <h3 className="font-ketik text-[11px] uppercase tracking-[0.2em] text-naskah-inksoft/70 mb-3">
                Unggahan Terbaru
              </h3>
              <ul className="space-y-2">
                {populer.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/post/${p.id}`}
                      className="block font-naskah text-sm text-naskah-inksoft border-l-2 border-naskah-moss/50 pl-3 hover:text-naskah-leather hover:border-naskah-leather transition-colors"
                    >
                      {p.judul}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      }
      kanan={
        <div>
          <div className="flex gap-1 mb-2 font-ketik text-xs uppercase tracking-wide overflow-x-auto">
            <button
              onClick={() => pilihTab('cerpen')}
              className={`px-4 py-2 whitespace-nowrap transition-colors ${
                tab === 'cerpen' ? 'garis-tangan text-naskah-ink' : 'text-naskah-inksoft/60 hover:text-naskah-inksoft'
              }`}
            >
              Koleksi Cerpen
            </button>
            <button
              onClick={() => pilihTab('artikel')}
              className={`px-4 py-2 whitespace-nowrap transition-colors ${
                tab === 'artikel' ? 'garis-tangan text-naskah-ink' : 'text-naskah-inksoft/60 hover:text-naskah-inksoft'
              }`}
            >
              Artikel Edukasi
            </button>
          </div>

          <div className="garis-buku">
            {posts.map((p) => (
              <CardPost key={p.id} {...p} />
            ))}
            {posts.length === 0 && (
              <p className="font-ketik italic text-sm text-naskah-inksoft/70 py-6">Belum ada tulisan.</p>
            )}
          </div>

          <Pagination page={halaman} totalPages={totalHalaman} onChange={setHalaman} />
        </div>
      }
    />
  )
}
