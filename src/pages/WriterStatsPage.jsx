import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import MiniBarChart from '../components/common/MiniBarChart'

const LABEL_STATUS = {
  draft: 'Draf',
  diajukan: 'Dalam Antrean',
  ditinjau: 'Sedang Diperiksa',
  siap_terbit: 'Siap Terbit',
  terbit: 'Terbit',
  ditolak: 'Ditolak',
}

function KartuRingkasan({ label, nilai }) {
  return (
    <div className="bg-naskah-surface/50 p-4 border border-naskah-aged text-center">
      <p className="font-naskah text-2xl text-naskah-ink">{nilai}</p>
      <p className="font-ketik text-[10px] uppercase tracking-wide text-naskah-inksoft/70 mt-1">{label}</p>
    </div>
  )
}

export default function WriterStatsPage() {
  const [data, setData] = useState(null)
  const [gagal, setGagal] = useState(false)

  useEffect(() => {
    api.get('/posts/saya/statistik')
      .then((res) => setData(res.data))
      .catch(() => setGagal(true))
  }, [])

  if (gagal) {
    return (
      <div className="p-6 sm:p-10 md:p-14">
        <p className="font-ketik text-sm text-naskah-inksoft">Gagal memuat statistik. Coba muat ulang halaman.</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 sm:p-10 md:p-14">
        <p className="font-ketik text-sm text-naskah-inksoft/70 italic">Memuat statistik...</p>
      </div>
    )
  }

  const chartData = data.aktivitasHarian.map((h) => ({
    label: new Date(h.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    values: { suka: h.suka, komentar: h.komentar },
  }))

  return (
    <div className="p-6 sm:p-10 md:p-14 max-w-4xl mx-auto">
      <Link to="/dashboard" className="font-ketik text-xs uppercase text-naskah-leather underline">
        &larr; Kembali ke Dasbor
      </Link>

      <span className="font-ketik text-[11px] uppercase tracking-[0.25em] text-naskah-leather mt-6 mb-3 block">
        Meja Kerja
      </span>
      <h1 className="font-naskah text-3xl sm:text-4xl leading-tight text-naskah-ink mb-2">
        Statistik &amp; Insight
      </h1>
      <p className="font-ketik text-sm text-naskah-inksoft leading-relaxed mb-8">
        Gambaran performa semua naskahmu — total pembaca, apresiasi, dan aktivitas 14 hari terakhir.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
        <KartuRingkasan label="Tulisan" nilai={data.ringkasan.totalTulisan} />
        <KartuRingkasan label="Terbit" nilai={data.ringkasan.totalTerbit} />
        <KartuRingkasan label="Dibaca" nilai={data.ringkasan.totalDibaca} />
        <KartuRingkasan label="Disukai" nilai={data.ringkasan.totalSuka} />
        <KartuRingkasan label="Komentar" nilai={data.ringkasan.totalKomentar} />
        <KartuRingkasan label="Tersimpan" nilai={data.ringkasan.totalTersimpan} />
      </div>

      <div className="mb-10">
        <h3 className="font-ketik text-[11px] uppercase tracking-[0.2em] text-naskah-inksoft/70 mb-4">
          Aktivitas 14 Hari Terakhir
        </h3>
        {data.ringkasan.totalTulisan === 0 ? (
          <p className="font-ketik italic text-sm text-naskah-inksoft/70">Belum ada tulisan untuk ditampilkan.</p>
        ) : (
          <MiniBarChart
            data={chartData}
            series={[
              { key: 'suka', nama: 'Suka', warna: 'fill-naskah-leather' },
              { key: 'komentar', nama: 'Komentar', warna: 'fill-biru' },
            ]}
          />
        )}
      </div>

      <div>
        <h3 className="font-ketik text-[11px] uppercase tracking-[0.2em] text-naskah-inksoft/70 mb-4">
          Performa per Naskah
        </h3>
        {data.perNaskah.length === 0 ? (
          <p className="font-ketik italic text-sm text-naskah-inksoft/70">Belum ada naskah.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-baca min-w-[560px]">
              <thead>
                <tr className="text-left font-ketik text-[10px] uppercase text-naskah-inksoft/70 border-b border-naskah-aged">
                  <th className="py-2 pr-2">Judul</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2 text-right">Dibaca</th>
                  <th className="py-2 pr-2 text-right">Suka</th>
                  <th className="py-2 pr-2 text-right">Komentar</th>
                  <th className="py-2 text-right">Tersimpan</th>
                </tr>
              </thead>
              <tbody>
                {data.perNaskah.map((p) => (
                  <tr key={p.id} className="border-b border-naskah-aged/60">
                    <td className="py-2 pr-2">
                      <Link to={`/dashboard/tulis/${p.id}`} className="text-naskah-ink hover:text-naskah-leather truncate block max-w-[220px]">
                        {p.judul}
                      </Link>
                    </td>
                    <td className="py-2 pr-2 font-ketik text-[11px] text-naskah-inksoft/70">{LABEL_STATUS[p.status] || p.status}</td>
                    <td className="py-2 pr-2 text-right">{p.viewCount}</td>
                    <td className="py-2 pr-2 text-right">{p.jumlahSuka}</td>
                    <td className="py-2 pr-2 text-right">{p.jumlahKomentar}</td>
                    <td className="py-2 text-right">{p.jumlahTersimpan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
