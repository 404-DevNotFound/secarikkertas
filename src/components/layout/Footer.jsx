// Footer sekarang jadi "merek buku" — garis tipis di bagian paling bawah
// buku, kayak imprint/colophon penerbit di halaman terakhir buku fisik.
// Bukan lagi seksi terpisah yang besar dengan latar sendiri.
export default function Footer() {
  return (
    <footer className="border-t border-naskah-aged px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-center gap-2 shrink-0">
      <span className="font-judul italic text-sm text-naskah-inksoft/80">secarikkertas</span>
      <span className="w-1 h-1 rounded-full bg-naskah-aged" />
      <span className="font-mono text-[10px] uppercase tracking-widest text-naskah-inksoft/50">
        Est. MMXXVI
      </span>
    </footer>
  )
}
