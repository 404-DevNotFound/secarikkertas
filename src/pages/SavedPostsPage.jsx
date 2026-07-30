import { useState, useEffect } from 'react'
import api from '../api/axios'
import CardPost from '../components/common/CardPost'
import BookSpread from '../components/layout/BookSpread'

export default function SavedPostsPage() {
  const [posts, setPosts] = useState([])
  const [memuat, setMemuat] = useState(true)

  useEffect(() => {
    document.title = 'Tersimpan — secarikkertas'
    api.get('/posts/tersimpan')
      .then((res) => setPosts(res.data))
      .finally(() => setMemuat(false))
  }, [])

  return (
    <BookSpread
      kiri={
        <div className="flex flex-col h-full">
          <span className="font-ketik text-[11px] uppercase tracking-[0.25em] text-naskah-leather mb-3">
            Rak Bacaan
          </span>
          <h1 className="font-naskah text-3xl sm:text-4xl leading-tight text-naskah-ink mb-4">
            Tulisan Tersimpan
          </h1>
          <p className="font-ketik text-sm text-naskah-inksoft leading-relaxed mb-8">
            Tulisan yang kamu tandai untuk dibaca nanti berkumpul di sini.
            Tekan ikon simpan di halaman baca kapan saja untuk menambah atau
            mencopotnya dari rak ini.
          </p>

          <div className="mt-auto pt-6 border-t border-naskah-aged/60">
            <p className="font-naskah text-2xl text-naskah-ink">{posts.length}</p>
            <p className="font-ketik text-[11px] uppercase tracking-wide text-naskah-inksoft/70">
              Tulisan Tersimpan
            </p>
          </div>
        </div>
      }
      kanan={
        <div>
          <h3 className="font-ketik text-[11px] uppercase tracking-[0.2em] text-naskah-inksoft/70 mb-4">
            Daftar Bacaan
          </h3>

          {memuat && <p className="font-baca italic text-sm text-naskah-inksoft/60">Memuat...</p>}
          {!memuat && posts.length === 0 && (
            <p className="font-baca italic text-sm text-naskah-inksoft/60">
              Belum ada tulisan yang disimpan. Tekan ikon simpan di halaman baca untuk menambahkannya ke sini.
            </p>
          )}
          {posts.map((p) => (
            <CardPost
              key={p.id}
              id={p.id}
              judul={p.judul}
              penulis={p.penulis}
              penulisUsername={p.penulisUsername}
              ringkasan={p.ringkasan}
              likes={p.likes}
              likedAwal={p.sudahSuka}
              disimpanAwal
              tags={p.tags}
              tipe={p.tipe}
              gambarSampul={p.gambarSampul}
              tanggalTerbit={p.tanggalTerbit}
            />
          ))}
        </div>
      }
    />
  )
}
