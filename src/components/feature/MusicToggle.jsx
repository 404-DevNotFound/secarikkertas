import { useRef, useState } from 'react'

// Tombol lagu latar — HANYA dipasang di ReadPostPage (halaman baca).
// GANTI baris SUMBER_MUSIK di bawah dengan file musikmu sendiri:
// taruh filenya di folder public/ (mis. public/audio/latar-baca.mp3),
// lalu ganti nilainya jadi '/audio/latar-baca.mp3'.
//
// Karena komponen ini cuma hidup selama ReadPostPage terbuka, begitu
// pengguna pindah ke halaman lain, React meng-unmount komponen ini —
// elemen <audio> ikut lenyap dari DOM dan lagunya otomatis berhenti,
// tidak perlu logika tambahan untuk itu.
const SUMBER_MUSIK = '/audio/latar-baca.mp3'

export default function MusicToggle() {
  const audioRef = useRef(null)
  const [diputar, setDiputar] = useState(false)

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (diputar) {
      audio.pause()
      setDiputar(false)
    } else {
      audio.play().catch(() => {})
      setDiputar(true)
    }
  }

  return (
    <>
      <audio ref={audioRef} src={SUMBER_MUSIK} loop preload="none" />

      <button
        onClick={toggle}
        aria-label={diputar ? 'Jeda musik latar' : 'Putar musik latar'}
        title={diputar ? 'Jeda musik latar' : 'Putar musik latar'}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-naskah-bg border border-naskah-aged shadow-[0_6px_16px_rgba(28,28,19,0.25)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        {diputar ? (
          // Sedang diputar — titik tengah + cincin berdenyut ke luar
          <span className="relative w-5 h-5 flex items-center justify-center" aria-hidden="true">
            <span className="absolute w-5 h-5 rounded-full border border-naskah-leather animate-ping" />
            <span className="absolute w-5 h-5 rounded-full border border-naskah-leather/50" />
            <span className="w-2 h-2 rounded-full bg-naskah-leather" />
          </span>
        ) : (
          // Dijeda — dua batang statis
          <span className="flex items-center gap-[3px]" aria-hidden="true">
            <span className="w-[3px] h-4 rounded-sm bg-naskah-leather" />
            <span className="w-[3px] h-4 rounded-sm bg-naskah-leather" />
          </span>
        )}
      </button>
    </>
  )
}
