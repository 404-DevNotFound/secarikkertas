export default function Footer() {
  return (
    <footer className="mt-20 border-t border-kertas-line">
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col items-center gap-3 text-center">
        <p className="font-judul text-lg text-tinta">secarikkertas</p>
        <p className="font-baca text-sm text-tinta-soft italic max-w-sm">
          Bukan sekadar komunitas melainkan ruang untuk bernapas.
        </p>
        <p className="font-mono text-[11px] uppercase tracking-widest text-tinta-faint mt-3">
          © {new Date().getFullYear()} secarikkertas.com
        </p>
      </div>
    </footer>
  )
}
