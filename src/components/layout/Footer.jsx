// Footer — sengaja dibikin minimal, cuma nama situs + tautan RSS. Kutipan
// Pramoedya sudah dipindah ke halaman Beranda (jadi gak dobel muncul di
// dua tempat).
function urlBackend() {
  return import.meta.env.DEV
    ? 'http://localhost:5000'
    : (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
}

export default function Footer() {
  return (
    <footer className="border-t border-naskah-aged px-4 sm:px-8 py-3 flex items-center justify-center gap-4 shrink-0">
      <span className="font-judul italic text-sm text-naskah-inksoft/70">develop by Richard Dante</span>
      <a
        href={`${urlBackend()}/rss.xml`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-[10px] uppercase tracking-widest text-naskah-inksoft/50 hover:text-naskah-leather transition-colors"
        title="Berlangganan lewat RSS"
      >
        RSS
      </a>
    </footer>
  )
}
