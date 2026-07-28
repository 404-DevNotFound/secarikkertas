import { useState, useEffect } from 'react'
import api from '../api/axios'
import CardPost from '../components/common/CardPost'

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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <span className="font-ketik text-[11px] uppercase tracking-[0.25em] text-naskah-leather mb-3 block">
        Rak Bacaan
      </span>
      <h1 className="font-naskah text-3xl sm:text-4xl leading-tight text-naskah-ink mb-8">
        Tulisan Tersimpan
      </h1>

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
          kategori={p.kategori}
          tipe={p.tipe}
          gambarSampul={p.gambarSampul}
          tanggalTerbit={p.tanggalTerbit}
        />
      ))}
    </div>
  )
}
