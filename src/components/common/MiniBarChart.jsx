// Grafik batang SVG kecil, dibuat manual (bukan pakai library chart) —
// dipakai di dasbor statistik penulis untuk menampilkan aktivitas harian.
// Menerima beberapa "seri" sekaligus (mis. suka & komentar) supaya bisa
// dibandingkan berdampingan per tanggal.
//
// data: [{ label: string, values: { [namaSeri]: number } }]
// series: [{ key: string, warna: string (kelas Tailwind "fill-..."), nama: string }]
export default function MiniBarChart({ data, series, tinggi = 140 }) {
  const nilaiMaks = Math.max(1, ...data.flatMap((d) => series.map((s) => d.values[s.key] || 0)))
  const lebarSlot = 100 / data.length

  return (
    <div>
      <svg viewBox={`0 0 100 ${tinggi}`} preserveAspectRatio="none" className="w-full" style={{ height: tinggi }} role="img" aria-label="Grafik aktivitas harian">
        {data.map((d, i) => {
          const x0 = i * lebarSlot
          const lebarBar = (lebarSlot * 0.7) / series.length
          return (
            <g key={d.label}>
              {series.map((s, j) => {
                const nilai = d.values[s.key] || 0
                const tinggiBar = nilaiMaks === 0 ? 0 : (nilai / nilaiMaks) * (tinggi - 16)
                const x = x0 + lebarSlot * 0.15 + j * lebarBar
                return (
                  <rect
                    key={s.key}
                    x={x}
                    y={tinggi - 16 - tinggiBar}
                    width={Math.max(0, lebarBar - 0.6)}
                    height={tinggiBar}
                    className={s.warna}
                  >
                    <title>{`${d.label} · ${s.nama}: ${nilai}`}</title>
                  </rect>
                )
              })}
            </g>
          )
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          // Tampilkan cuma sebagian label tanggal (tiap ~3 slot) supaya
          // tidak numpuk berantakan kalau datanya 14 titik.
          <span key={d.label} className="font-ketik text-[9px] text-naskah-inksoft/50" style={{ width: `${lebarSlot}%`, textAlign: 'center' }}>
            {i % 3 === 0 ? d.label : ''}
          </span>
        ))}
      </div>
      <div className="flex gap-4 mt-2">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 font-ketik text-[10px] text-naskah-inksoft/70">
            <span className={`inline-block w-2.5 h-2.5 ${s.warna}`} />
            {s.nama}
          </span>
        ))}
      </div>
    </div>
  )
}
