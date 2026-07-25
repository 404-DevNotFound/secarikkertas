import { useState } from 'react'

// Halaman gerbang (gate) sebelum masuk ke landing page.
// Ditampilkan penuh layar dengan gambar sampul buku antik sebagai latar.
// Setelah pengguna menekan "Buka Buku", halaman ini fade-out dan
// landing page yang lama muncul di baliknya — isi/fungsi situs tidak berubah.
export default function CoverPage({ onOpen }) {
  const [menutup, setMenutup] = useState(false)

  function handleBuka() {
    setMenutup(true)
    // Beri waktu animasi selesai sebelum benar-benar berpindah ke landing page
    setTimeout(() => {
      onOpen()
    }, 650)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden transition-all duration-700 ease-in-out ${
        menutup ? 'opacity-0 scale-[1.04]' : 'opacity-100 scale-100'
      }`}
    >
      {/* Gambar sampul buku antik, full-bleed */}
      <img
        src="/cover-buku.jpg"
        alt="Sampul buku kulit antik"
        className="absolute inset-0 w-full h-full object-cover select-none"
        draggable={false}
      />

      {/* Vignette supaya teks & tombol tetap terbaca di atas tekstur kulit */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/50" />
      <div className="absolute inset-0 bg-black/10" />

      {/* Konten: judul + tombol, diposisikan di area label hijau tengah sampul */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <span
          className="font-mono text-[10px] sm:text-[11px] tracking-[0.35em] uppercase mb-4"
          style={{ color: '#D9C27E' }}
        >
          Kumpulan Cerpen &amp; Artikel
        </span>

        <h1
          className="font-judul text-4xl sm:text-5xl md:text-6xl tracking-wide"
          style={{
            color: '#E8CE85',
            textShadow: '0 1px 0 rgba(255,255,255,0.12), 0 3px 14px rgba(0,0,0,0.55)',
          }}
        >
          secarikkertas
        </h1>

        <div className="w-14 h-px my-5 sm:my-6" style={{ backgroundColor: 'rgba(232,206,133,0.45)' }} />

        <button
          onClick={handleBuka}
          className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] px-7 sm:px-9 py-3 border transition-colors duration-300"
          style={{
            color: '#E8CE85',
            borderColor: 'rgba(232,206,133,0.55)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#E8CE85'
            e.currentTarget.style.color = '#1c1c13'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#E8CE85'
          }}
        >
          Buka Buku
        </button>
      </div>

      {/* Kredit kecil untuk sumber ilustrasi sampul */}
      <span
        className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 font-mono text-[9px] sm:text-[10px] tracking-[0.15em] uppercase"
        style={{ color: 'rgba(232,206,133,0.6)' }}
      >
        Ilustrasi sampul: koleksi The New York Public Library
      </span>
    </div>
  )
}
