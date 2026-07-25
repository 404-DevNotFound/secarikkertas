// Layout "buku terbuka dua halaman", dipakai oleh HomePage & WriterDashboard.
// Di layar lebar: dua halaman bersebelahan dengan bayangan jilid di tengah.
// Di layar sempit (HP): satu buku fisik gak muat ditampilkan sebagai spread,
// jadi otomatis ditumpuk jadi satu kolom (halaman kiri di atas, kanan di bawah).
export default function BookSpread({ kiri, kanan }) {
  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-12">
      {/* "Meja" — latar di balik buku, memberi ruang & bayangan ambient */}
      <div className="relative bg-naskah-surface rounded-lg p-2 sm:p-6">
        <div
          className="relative flex flex-col md:flex-row bg-naskah-bg rounded-md overflow-hidden
                     shadow-[0_18px_45px_rgba(28,28,19,0.22)] jilid-tengah"
        >
          <div className="flex-1 min-w-0 relative tepi-kiri p-6 sm:p-10 md:p-12">
            {kiri}
          </div>
          <div className="flex-1 min-w-0 relative tepi-kanan p-6 sm:p-10 md:p-12 border-t md:border-t-0 border-naskah-aged/60">
            {kanan}
          </div>
        </div>
      </div>
    </div>
  )
}
