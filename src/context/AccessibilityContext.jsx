import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AccessibilityContext = createContext(null)

const KUNCI_PENYIMPANAN = 'sk_mode_nyaman'

// "Mode nyaman": mematikan kursor kustom bentuk pensil, animasi/transisi
// dekoratif, dan kedipan (mis. denyut tombol musik) — untuk pengguna yang
// sensitif terhadap gerakan (motion sensitivity) atau sekadar lebih suka
// tampilan polos & cepat. Nilai awal ikut preferensi sistem operasi
// (prefers-reduced-motion) kalau pengguna belum pernah memilih manual.
function bacaModeAwal() {
  if (typeof window === 'undefined') return false
  const tersimpan = localStorage.getItem(KUNCI_PENYIMPANAN)
  if (tersimpan === '1') return true
  if (tersimpan === '0') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false
}

export function AccessibilityProvider({ children }) {
  const [modeNyaman, setModeNyaman] = useState(bacaModeAwal)

  useEffect(() => {
    document.documentElement.classList.toggle('mode-nyaman', modeNyaman)
    localStorage.setItem(KUNCI_PENYIMPANAN, modeNyaman ? '1' : '0')
  }, [modeNyaman])

  const toggleModeNyaman = useCallback(() => {
    setModeNyaman((v) => !v)
  }, [])

  return (
    <AccessibilityContext.Provider value={{ modeNyaman, toggleModeNyaman }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext)
  if (!ctx) throw new Error('useAccessibility harus dipakai di dalam <AccessibilityProvider>')
  return ctx
}
