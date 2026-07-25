// Pensil dekoratif yang "tergeletak" melintang di lipatan tengah buku
// (jilid-tengah), disamakan tampil di semua halaman karena diletakkan
// di level App.jsx — bukan bagian dari BookSpread. pointer-events-none
// supaya tidak mengganggu klik konten di baliknya.
export default function Pencil() {
  return (
    <div
      className="hidden md:block absolute left-1/2 top-1/2 z-20 pointer-events-none select-none"
      style={{
        transform: 'translate(-50%, -50%) rotate(-32deg)',
        filter: 'drop-shadow(0 6px 8px rgba(28,28,19,0.35))',
      }}
    >
      <svg width="260" height="34" viewBox="0 0 260 34" xmlns="http://www.w3.org/2000/svg">
        {/* Penghapus */}
        <rect x="0" y="4" width="26" height="26" rx="4" fill="#E7A6AE" />
        <rect x="0" y="4" width="26" height="7" rx="3" fill="#F0BFC5" />

        {/* Klip logam (ferrule) */}
        <rect x="24" y="4" width="16" height="26" fill="#D8D3C4" />
        <rect x="24" y="9" width="16" height="2.5" fill="#B9B29C" />
        <rect x="24" y="18" width="16" height="2.5" fill="#B9B29C" />

        {/* Badan kayu pensil */}
        <rect x="38" y="4" width="178" height="26" fill="#F0BE4A" />
        <rect x="38" y="4" width="178" height="6" fill="#F6D372" />
        <rect x="38" y="24" width="178" height="6" fill="#D89F2E" />

        {/* Ujung kayu diraut */}
        <polygon points="216,4 246,15.5 216,30" fill="#E8C68C" />
        {/* Ujung grafit */}
        <polygon points="240,10 260,15.5 240,21" fill="#3A322B" />
      </svg>
    </div>
  )
}
