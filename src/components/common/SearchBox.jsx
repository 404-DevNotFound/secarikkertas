import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Ikon kaca pembesar kecil yang membuka input pencarian saat diklik (biar
// navbar tidak penuh kalau selalu ditampilkan lebar) — submit mengarahkan
// ke beranda dengan query "?q=...", yang lalu dibaca oleh HomePage.jsx.
// Dipasang di SEMUA halaman (bukan cuma beranda) supaya pencarian bisa
// dimulai dari mana saja, bukan cuma saat kebetulan lagi di beranda.
export default function SearchBox({ className = '', awalTerbuka = false, fullWidth = false }) {
  const navigate = useNavigate()
  const [terbuka, setTerbuka] = useState(awalTerbuka)
  const [nilai, setNilai] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (terbuka) inputRef.current?.focus()
  }, [terbuka])

  function submit(e) {
    e.preventDefault()
    const q = nilai.trim()
    if (!q) return
    navigate(`/?q=${encodeURIComponent(q)}`)
    setTerbuka(false)
  }

  if (!terbuka) {
    return (
      <button
        onClick={() => setTerbuka(true)}
        aria-label="Buka pencarian"
        title="Cari tulisan"
        className={`inline-flex items-center justify-center w-8 h-8 shrink-0 text-naskah-inksoft/70 hover:text-naskah-ink transition-colors ${className}`}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    )
  }

  return (
    <form onSubmit={submit} className={`flex items-center gap-1.5 ${className}`}>
      <input
        ref={inputRef}
        value={nilai}
        onChange={(e) => setNilai(e.target.value)}
        onBlur={() => { if (!nilai && !awalTerbuka) setTerbuka(false) }}
        onKeyDown={(e) => { if (e.key === 'Escape' && !awalTerbuka) { setNilai(''); setTerbuka(false) } }}
        placeholder="Cari tulisan..."
        aria-label="Kata kunci pencarian"
        className={`px-2 py-1.5 bg-transparent border-b border-naskah-aged focus:border-naskah-leather outline-none font-ketik text-xs placeholder:text-naskah-inksoft/50 transition-colors ${
          fullWidth ? 'flex-1 min-w-0' : 'w-32 sm:w-44'
        }`}
      />
      <button type="submit" aria-label="Cari" className="text-naskah-inksoft/70 hover:text-naskah-ink shrink-0">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </form>
  )
}
