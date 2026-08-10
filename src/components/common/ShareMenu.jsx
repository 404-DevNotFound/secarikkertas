import { useState, useRef, useEffect } from 'react'

// Dropdown kecil berisi beberapa cara membagikan tulisan. Di perangkat
// yang mendukung Web Share API (kebanyakan HP), tombol utama langsung
// membuka share sheet bawaan OS — dropdown dengan pilihan platform cuma
// muncul di perangkat yang tidak mendukungnya (kebanyakan desktop),
// supaya tidak ada dua cara berbeda yang membingungkan di device yang
// sama.
export default function ShareMenu({ judul, onSalinBerhasil, onSalinGagal }) {
  const [terbuka, setTerbuka] = useState(false)
  const wrapRef = useRef(null)
  const dukungShareNative = typeof navigator !== 'undefined' && !!navigator.share

  useEffect(() => {
    function tutupKalauDiLuar(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setTerbuka(false)
    }
    document.addEventListener('mousedown', tutupKalauDiLuar)
    return () => document.removeEventListener('mousedown', tutupKalauDiLuar)
  }, [])

  async function klikUtama() {
    const url = window.location.href
    if (dukungShareNative) {
      try {
        await navigator.share({ title: judul, url })
      } catch {
        // Pengguna membatalkan share sheet — bukan error yang perlu ditampilkan
      }
      return
    }
    setTerbuka((v) => !v)
  }

  async function salinTautan() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      onSalinBerhasil?.()
    } catch {
      onSalinGagal?.()
    }
    setTerbuka(false)
  }

  function bagikanKe(platform) {
    const url = encodeURIComponent(window.location.href)
    const teks = encodeURIComponent(judul)
    const tautan = {
      whatsapp: `https://wa.me/?text=${teks}%20${url}`,
      x: `https://twitter.com/intent/tweet?text=${teks}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    }[platform]
    window.open(tautan, '_blank', 'noopener,noreferrer,width=600,height=500')
    setTerbuka(false)
  }

  return (
    <div className="relative inline-block" ref={wrapRef}>
      <button
        onClick={klikUtama}
        aria-haspopup={!dukungShareNative}
        aria-expanded={!dukungShareNative && terbuka}
        aria-label="Bagikan tulisan ini"
        className="font-mono text-xs px-3 py-1.5 border border-kertas-line text-tinta-faint hover:border-biru hover:text-biru transition-colors"
      >
        ↗ Bagikan
      </button>

      {!dukungShareNative && terbuka && (
        <div
          role="menu"
          className="absolute z-20 mt-1 left-0 bg-kertas border border-kertas-line shadow-lg py-1 min-w-[170px] font-mono text-xs"
        >
          <button role="menuitem" onClick={() => bagikanKe('whatsapp')} className="w-full text-left px-3 py-2 hover:bg-kertas-soft text-tinta">
            WhatsApp
          </button>
          <button role="menuitem" onClick={() => bagikanKe('x')} className="w-full text-left px-3 py-2 hover:bg-kertas-soft text-tinta">
            X (Twitter)
          </button>
          <button role="menuitem" onClick={() => bagikanKe('facebook')} className="w-full text-left px-3 py-2 hover:bg-kertas-soft text-tinta">
            Facebook
          </button>
          <button role="menuitem" onClick={salinTautan} className="w-full text-left px-3 py-2 hover:bg-kertas-soft text-tinta border-t border-kertas-line">
            Salin Tautan
          </button>
        </div>
      )}
    </div>
  )
}
