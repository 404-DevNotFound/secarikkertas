import { useState } from 'react'
import api from '../../api/axios'

const JENIS_REAKSI = [
  { tipe: 'terharu', emoji: '🥲', label: 'Terharu' },
  { tipe: 'terinspirasi', emoji: '✨', label: 'Terinspirasi' },
  { tipe: 'lucu', emoji: '😄', label: 'Lucu' },
  { tipe: 'mikir', emoji: '🤔', label: 'Bikin Mikir' },
]

// Reaksi ekspresif di akhir tulisan — terpisah dari "suka" (yang dipakai
// di kartu tulisan/daftar), disimpan lewat model Reaction sendiri di
// backend. Satu pembaca cuma bisa pilih SATU jenis; klik jenis yang lagi
// aktif untuk membatalkannya, klik jenis lain untuk menggantinya.
export default function ReactionBar({ postId, reaksiCountAwal, reaksiSayaAwal, butuhLogin, onButuhLogin }) {
  const [count, setCount] = useState(reaksiCountAwal || {})
  const [aktif, setAktif] = useState(reaksiSayaAwal || null)
  const [memproses, setMemproses] = useState(false)

  async function pilih(tipe) {
    if (butuhLogin) {
      onButuhLogin?.()
      return
    }
    if (memproses) return
    setMemproses(true)

    const tipeBaru = aktif === tipe ? null : tipe
    const countSebelum = count
    const aktifSebelum = aktif

    // Optimistic update — hitung ulang count di sisi klien dulu supaya
    // terasa instan, dikoreksi lagi kalau request-nya ternyata gagal.
    const countBaru = { ...countSebelum }
    if (aktifSebelum) countBaru[aktifSebelum] = Math.max(0, (countBaru[aktifSebelum] || 0) - 1)
    if (tipeBaru) countBaru[tipeBaru] = (countBaru[tipeBaru] || 0) + 1
    setCount(countBaru)
    setAktif(tipeBaru)

    try {
      const res = await api.post(`/posts/${postId}/reaksi`, { tipe: tipeBaru })
      setCount(res.data.reaksiCount)
      setAktif(res.data.reaksiSaya)
    } catch {
      setCount(countSebelum)
      setAktif(aktifSebelum)
    } finally {
      setMemproses(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {JENIS_REAKSI.map((r) => (
        <button
          key={r.tipe}
          onClick={() => pilih(r.tipe)}
          aria-pressed={aktif === r.tipe}
          aria-label={`Reaksi ${r.label}${count[r.tipe] ? `, ${count[r.tipe]} orang` : ''}`}
          className={`font-mono text-xs px-2.5 py-1.5 border rounded-full inline-flex items-center gap-1.5 transition-colors ${
            aktif === r.tipe
              ? 'bg-mustard-light border-mustard text-mustard'
              : 'border-kertas-line text-tinta-faint hover:border-mustard hover:text-mustard'
          }`}
        >
          <span aria-hidden>{r.emoji}</span>
          {r.label}
          {count[r.tipe] > 0 && <span className="opacity-70">{count[r.tipe]}</span>}
        </button>
      ))}
    </div>
  )
}
