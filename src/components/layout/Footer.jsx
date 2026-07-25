export default function Footer() {
  return (
    <footer className="mt-20 bg-naskah-bg border-t border-naskah-aged">
      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col items-center gap-4 text-center">
        <p className="font-judul italic text-2xl sm:text-3xl text-naskah-ink">secarikkertas</p>

        <p className="font-baca text-sm text-naskah-inksoft/80 italic max-w-md leading-relaxed">
          "Orang boleh pandai setinggi langit, tapi selama ia tidak menulis, ia akan hilang
          di dalam masyarakat dan dari sejarah." — Pramoedya Ananta Toer
        </p>

        <div className="w-12 h-px bg-naskah-aged my-2" />

        <p className="font-mono text-[11px] uppercase tracking-widest text-naskah-inksoft/60">
          © {new Date().getFullYear()} secarikkertas.my.id — Dipersembahkan bagi mereka
          yang percaya bahwa kata-kata adalah pusaka.
        </p>
      </div>
    </footer>
  )
}
