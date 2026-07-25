// Layout "dua halaman", dipakai oleh HomePage & WriterDashboard & WriteEditorPage.
// Sekarang mengisi penuh area dalam buku besar (dari App.jsx) — bukan lagi
// kartu kecil dengan "meja" & bayangannya sendiri, supaya bagian tengah buku
// terlihat besar & lega begitu buku dibuka.
export default function BookSpread({ kiri, kanan }) {
  return (
    <div className="relative flex flex-col md:flex-row h-full jilid-tengah">
      <div className="flex-1 min-w-0 min-h-0 relative tepi-kiri p-6 sm:p-10 md:p-14 overflow-y-auto">
        {kiri}
      </div>
      <div className="flex-1 min-w-0 min-h-0 relative tepi-kanan p-6 sm:p-10 md:p-14 overflow-y-auto border-t md:border-t-0 border-naskah-aged/60">
        {kanan}
      </div>
    </div>
  )
}
