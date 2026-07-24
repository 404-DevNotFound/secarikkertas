export default function CommentItem({ nama, isi, waktu, anonim }) {
  return (
    <div className="py-4 border-b border-kertas-line last:border-none">
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
    </div>
  )
}
