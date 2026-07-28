import { useState } from 'react'

const ALASAN = [
  'Konten tidak pantas / vulgar',
  'Ujaran kebencian atau pelecehan',
  'Plagiarisme / bukan karya sendiri',
  'Spam atau iklan',
  'Lainnya',
]

// Modal generik untuk melaporkan naskah ATAU komentar — pemanggil cukup
// kasih tahu onSubmit(alasan, detail) mau ngapain (POST ke endpoint mana).
export default function ReportModal({ open, title = 'Laporkan Konten', onSubmit, onCancel }) {
  const [alasan, setAlasan] = useState(ALASAN[0])
  const [detail, setDetail] = useState('')
  const [mengirim, setMengirim] = useState(false)

  if (!open) return null

  async function handleSubmit() {
    setMengirim(true)
    try {
      await onSubmit(alasan, detail)
      setDetail('')
    } finally {
      setMengirim(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/50 backdrop-blur-sm px-4">
      <div className="bg-kertas max-w-sm w-full p-6 shadow-xl border border-kertas-line">
        <h3 className="font-judul text-lg font-semibold text-tinta mb-4">{title}</h3>

        <label className="block font-mono text-[11px] uppercase tracking-widest text-tinta-faint mb-1.5">
          Alasan
        </label>
        <select
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
          className="w-full mb-4 px-2 py-2 bg-white border border-kertas-line text-sm font-baca outline-none focus:border-stempel"
        >
          {ALASAN.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <label className="block font-mono text-[11px] uppercase tracking-widest text-tinta-faint mb-1.5">
          Detail (opsional)
        </label>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={3}
          placeholder="Jelaskan lebih lanjut kalau perlu..."
          className="w-full mb-6 px-2 py-2 bg-white border border-kertas-line text-sm font-baca outline-none focus:border-stempel resize-none"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="font-mono text-xs uppercase px-4 py-2 border border-kertas-line text-tinta-soft hover:bg-kertas-soft transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={mengirim}
            className="font-mono text-xs uppercase px-4 py-2 text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {mengirim ? 'Mengirim...' : 'Kirim Laporan'}
          </button>
        </div>
      </div>
    </div>
  )
}
