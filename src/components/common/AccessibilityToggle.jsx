import { useAccessibility } from '../../context/AccessibilityContext'

// Tombol "Aa" kecil di sebelah tombol tema — matikan animasi dekoratif &
// kursor kustom bentuk pensil untuk pengguna yang sensitif terhadap
// gerakan atau cuma mau tampilan lebih tenang & cepat. Lihat
// src/context/AccessibilityContext.jsx untuk detail penyimpanannya.
export default function AccessibilityToggle({ className = '' }) {
  const { modeNyaman, toggleModeNyaman } = useAccessibility()

  return (
    <button
      onClick={toggleModeNyaman}
      aria-pressed={modeNyaman}
      aria-label={modeNyaman ? 'Matikan mode nyaman (aktifkan animasi & kursor kustom)' : 'Aktifkan mode nyaman (kurangi animasi & kursor kustom)'}
      title={modeNyaman ? 'Mode Nyaman: Aktif' : 'Mode Nyaman'}
      className={`inline-flex items-center justify-center w-8 h-8 shrink-0 transition-colors ${
        modeNyaman ? 'text-naskah-leather' : 'text-naskah-inksoft/70 hover:text-naskah-ink'
      } ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        {modeNyaman ? (
          // Dicoret — animasi/gerakan dimatikan
          <path d="M8 8l8 8M16 8l-8 8" />
        ) : (
          // Ikon "denyut" — merepresentasikan animasi/gerakan yang masih aktif
          <path d="M7 12h2.5l1.5-4 3 8 1.5-4H17" />
        )}
      </svg>
    </button>
  )
}
