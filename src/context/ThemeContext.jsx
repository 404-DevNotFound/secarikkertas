import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext(null)

const KUNCI_PENYIMPANAN = 'sk_tema'

// Skrip anti-kedip yang sama juga jalan lebih dulu di index.html (sebelum
// React sempat render) supaya tidak ada "kilatan" tema terang sesaat
// sebelum berganti ke gelap saat halaman pertama dimuat. Fungsi ini cuma
// dipakai untuk membaca nilai AWAL saat React mengambil alih setelahnya,
// jadi keduanya harus selalu sinkron kalau salah satu diubah.
function bacaTemaAwal() {
  if (typeof window === 'undefined') return 'terang'
  const tersimpan = localStorage.getItem(KUNCI_PENYIMPANAN)
  if (tersimpan === 'terang' || tersimpan === 'gelap') return tersimpan
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'gelap' : 'terang'
}

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(bacaTemaAwal)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'gelap')
    localStorage.setItem(KUNCI_PENYIMPANAN, tema)
  }, [tema])

  const toggleTema = useCallback(() => {
    setTema((t) => (t === 'gelap' ? 'terang' : 'gelap'))
  }, [])

  return (
    <ThemeContext.Provider value={{ tema, toggleTema, setTema }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme harus dipakai di dalam <ThemeProvider>')
  return ctx
}
