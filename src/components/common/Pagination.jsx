// Nomor halaman yang ditampilkan: selalu ada 1, halaman terakhir, dan
// halaman di sekitar halaman aktif — sisanya dipotong jadi "...".
function buatDaftarNomor(page, total) {
  const tampilkan = new Set([1, total, page - 1, page, page + 1])
  const daftar = []
  let sebelumnya = null

  for (let i = 1; i <= total; i++) {
    if (!tampilkan.has(i)) continue
    if (sebelumnya !== null && i - sebelumnya > 1) daftar.push('...')
    daftar.push(i)
    sebelumnya = i
  }
  return daftar
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const nomor = buatDaftarNomor(page, totalPages)

  return (
    <nav className="flex flex-wrap items-center gap-1.5 mt-8 mb-2" aria-label="Navigasi halaman">
      {nomor.map((n, i) =>
        n === '...' ? (
          <span
            key={`titik-${i}`}
            className="w-8 h-8 flex items-center justify-center font-mono text-xs text-naskah-inksoft/50"
          >
            &hellip;
          </span>
        ) : (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-current={n === page ? 'page' : undefined}
            className={`w-8 h-8 flex items-center justify-center font-mono text-xs transition-colors ${
              n === page
                ? 'bg-naskah-ink text-naskah-bg'
                : 'bg-naskah-moss text-naskah-bg hover:bg-naskah-leather'
            }`}
          >
            {n}
          </button>
        )
      )}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="h-8 px-3 flex items-center justify-center font-mono text-xs bg-naskah-moss text-naskah-bg hover:bg-naskah-leather disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        Next page
      </button>
    </nav>
  )
}
