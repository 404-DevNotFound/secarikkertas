import { useState, useRef, useEffect } from 'react'

// Input tag multi-pilih ala "chip" — pengganti dropdown genre tunggal lama.
// - Ketik lalu Enter/koma untuk menambah tag (termasuk tag baru yang belum
//   ada di daftar saran).
// - Saran muncul dari daftar tag yang sudah ada (biasanya diisi dari
//   GET /api/genres) supaya penulis cenderung pakai tag yang konsisten,
//   tapi tetap bebas bikin tag baru kalau memang belum ada yang cocok.
// - Klik chip (atau tombol ×-nya) untuk menghapus tag itu dari pilihan.
export default function TagInput({ value = [], onChange, saran = [], disabled = false, placeholder = 'Ketik lalu tekan Enter...', maksimal = 10 }) {
  const [teks, setTeks] = useState('')
  const [fokus, setFokus] = useState(false)
  const wrapperRef = useRef(null)

  // Tutup daftar saran kalau klik di luar komponen ini
  useEffect(() => {
    function handleClickLuar(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setFokus(false)
    }
    document.addEventListener('mousedown', handleClickLuar)
    return () => document.removeEventListener('mousedown', handleClickLuar)
  }, [])

  const saranTersaring = saran
    .filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()))
    .filter((s) => s.toLowerCase().includes(teks.trim().toLowerCase()))
    .slice(0, 6)

  function tambahTag(nama) {
    const bersih = nama.trim()
    if (!bersih) return
    if (value.some((v) => v.toLowerCase() === bersih.toLowerCase())) {
      setTeks('')
      return
    }
    if (value.length >= maksimal) return
    onChange([...value, bersih])
    setTeks('')
  }

  function hapusTag(nama) {
    onChange(value.filter((v) => v !== nama))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      tambahTag(teks)
    } else if (e.key === 'Backspace' && !teks && value.length > 0) {
      // Backspace di kotak kosong -> hapus tag terakhir, biar cepat koreksi
      hapusTag(value[value.length - 1])
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className={`w-full min-h-[46px] px-2 py-2 bg-kertas border border-naskah-aged focus-within:border-naskah-leather transition-colors flex flex-wrap items-center gap-1.5 ${disabled ? 'opacity-60' : ''}`}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-naskah-mosslight text-naskah-moss font-mono text-[11px] uppercase tracking-wide px-2 py-1"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => hapusTag(tag)}
                aria-label={`Hapus tag ${tag}`}
                className="hover:text-red-600 transition-colors leading-none"
              >
                ×
              </button>
            )}
          </span>
        ))}
        {!disabled && value.length < maksimal && (
          <input
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFokus(true)}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[100px] bg-transparent outline-none font-baca text-sm text-naskah-ink px-1 py-0.5"
          />
        )}
      </div>

      {fokus && saranTersaring.length > 0 && !disabled && (
        <ul className="absolute z-10 left-0 right-0 mt-1 bg-kertas border border-naskah-aged shadow-lg max-h-40 overflow-y-auto">
          {saranTersaring.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => tambahTag(s)}
                className="w-full text-left px-3 py-2 font-baca text-sm text-naskah-ink hover:bg-naskah-mosslight/50 transition-colors"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="font-ketik text-[10px] text-naskah-inksoft/50 mt-1">
        {value.length}/{maksimal} tag &middot; Enter atau koma untuk menambah
      </p>
    </div>
  )
}
