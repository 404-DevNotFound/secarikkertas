import { useState } from 'react'

function BarisKomentar({ nama, isi, waktu, anonim, onKlikBalas, onKlikLapor }) {
  return (
    <div className="py-4">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-baca font-semibold text-tinta">{nama}</span>
        {anonim && (
          <span className="font-mono text-[10px] uppercase text-tinta-faint bg-kertas-soft px-1.5 py-0.5">
            Tamu
          </span>
        )}
        <span className="font-mono text-[11px] text-tinta-faint">
          {new Date(waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
      <p className="font-baca text-tinta-soft text-[15px] mt-1">{isi}</p>
      <div className="flex items-center gap-3 mt-1.5">
        {onKlikBalas && (
          <button onClick={onKlikBalas} className="font-mono text-[10px] uppercase tracking-wide text-stempel-dark hover:underline">
            Balas
          </button>
        )}
        <button onClick={onKlikLapor} className="font-mono text-[10px] uppercase tracking-wide text-tinta-faint hover:text-red-500">
          Laporkan
        </button>
      </div>
    </div>
  )
}

// comment: { id, nama, isi, waktu, anonim, balasan: [...] (satu tingkat) }
export default function CommentItem({ comment, butuhNamaTamu, onBalas, onLaporkan }) {
  const [formBalasBuka, setFormBalasBuka] = useState(false)
  const [teksBalasan, setTeksBalasan] = useState('')
  const [namaTamuBalasan, setNamaTamuBalasan] = useState('')
  const [mengirim, setMengirim] = useState(false)

  async function kirimBalasan(e) {
    e.preventDefault()
    if (!teksBalasan.trim()) return
    setMengirim(true)
    try {
      await onBalas(comment.id, teksBalasan, namaTamuBalasan)
      setTeksBalasan('')
      setFormBalasBuka(false)
    } finally {
      setMengirim(false)
    }
  }

  return (
    <div className="border-b border-kertas-line last:border-none">
      <BarisKomentar
        nama={comment.nama}
        isi={comment.isi}
        waktu={comment.waktu}
        anonim={comment.anonim}
        onKlikBalas={() => setFormBalasBuka((v) => !v)}
        onKlikLapor={() => onLaporkan(comment.id)}
      />

      {formBalasBuka && (
        <form onSubmit={kirimBalasan} className="pl-6 pb-4 space-y-2">
          {butuhNamaTamu && (
            <input
              value={namaTamuBalasan}
              onChange={(e) => setNamaTamuBalasan(e.target.value)}
              placeholder="Nama (opsional)"
              className="w-full px-3 py-1.5 border border-kertas-line text-sm font-baca outline-none focus:border-stempel"
            />
          )}
          <div className="flex gap-2">
            <input
              value={teksBalasan}
              onChange={(e) => setTeksBalasan(e.target.value)}
              placeholder="Tulis balasan..."
              className="flex-1 px-3 py-1.5 border border-kertas-line text-sm font-baca outline-none focus:border-stempel"
              autoFocus
            />
            <button
              type="submit"
              disabled={mengirim}
              className="px-3 py-1.5 bg-tinta text-kertas font-baca text-sm hover:bg-stempel-dark transition-colors disabled:opacity-60"
            >
              Kirim
            </button>
          </div>
        </form>
      )}

      {comment.balasan?.length > 0 && (
        <div className="pl-6 border-l-2 border-kertas-line/70 ml-1 mb-2">
          {comment.balasan.map((b) => (
            <BarisKomentar
              key={b.id}
              nama={b.nama}
              isi={b.isi}
              waktu={b.waktu}
              anonim={b.anonim}
              onKlikLapor={() => onLaporkan(b.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
