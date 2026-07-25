// Footer — garis tipis di bagian bawah buku, isinya kutipan Pramoedya
// (dipertahankan sebagai identitas situs) + nama & imprint kecil di bawahnya.
export default function Footer() {
  return (
    <footer className="border-t border-naskah-aged px-4 sm:px-8 py-3 flex flex-col items-center justify-center gap-1.5 text-center shrink-0">
      <p className="font-baca text-[11px] sm:text-xs italic text-naskah-inksoft/75 max-w-lg leading-relaxed">
        "Orang boleh pandai setinggi langit, tapi selama ia tidak menulis, ia akan hilang
        di dalam masyarakat dan dari sejarah." — Pramoedya Ananta Toer
      </p>
      <div className="flex items-center gap-2">
        <span className="font-judul italic text-sm text-naskah-inksoft/70">secarikkertas</span>
        <span className="w-1 h-1 rounded-full bg-naskah-aged" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-naskah-inksoft/50">Est. MMXXVI</span>
      </div>
    </footer>
  )
}
