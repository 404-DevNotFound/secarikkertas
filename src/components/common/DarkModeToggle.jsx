import { useTheme } from '../../context/ThemeContext'

// Tombol kecil ikon matahari/bulan — ditaruh di Navbar (versi desktop &
// menu mobile). Sengaja pakai SVG inline (bukan icon library) supaya tidak
// nambah dependency baru cuma buat satu tombol ini.
export default function DarkModeToggle({ className = '' }) {
  const { tema, toggleTema } = useTheme()
  const gelap = tema === 'gelap'

  return (
    <button
      onClick={toggleTema}
      aria-label={gelap ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      title={gelap ? 'Mode Terang' : 'Mode Gelap'}
      className={`inline-flex items-center justify-center w-8 h-8 shrink-0 text-naskah-inksoft/70 hover:text-naskah-ink transition-colors ${className}`}
    >
      {gelap ? (
        // Ikon matahari — muncul saat sedang gelap, tekan buat balik ke terang
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="4.2" />
          <line x1="12" y1="1.5" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22.5" />
          <line x1="1.5" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22.5" y2="12" />
          <line x1="4.4" y1="4.4" x2="6.1" y2="6.1" />
          <line x1="17.9" y1="17.9" x2="19.6" y2="19.6" />
          <line x1="4.4" y1="19.6" x2="6.1" y2="17.9" />
          <line x1="17.9" y1="6.1" x2="19.6" y2="4.4" />
        </svg>
      ) : (
        // Ikon bulan — muncul saat sedang terang, tekan buat pindah ke gelap
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
        </svg>
      )}
    </button>
  )
}
