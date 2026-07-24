export default function Footer() {
  return (
    <footer className="mt-20 bg-tinta">
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col items-center gap-3 text-center">
        <p className="font-judul text-lg text-kertas">secarikkertas</p>
        <p className="font-baca text-sm text-kertas/70 italic max-w-sm">
          Bukan sekadar komunitas biasa — melainkan ruang untuk bercerita.
        </p>
        <p className="font-mono text-[11px] uppercase tracking-widest text-kertas/50 mt-3">
          © {new Date().getFullYear()} secarikkertas.my.id
        </p>
      </div>
    </footer>
  )
}
