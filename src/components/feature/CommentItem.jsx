export default function CommentItem({ nama, isi, waktu }) {
  return (
    <div className="py-3 border-b last:border-none">
      <div className="flex items-baseline gap-2">
        <span className="font-medium text-slate-800">{nama}</span>
        <span className="text-xs text-slate-400">{waktu}</span>
      </div>
      <p className="text-slate-600 text-sm mt-1">{isi}</p>
    </div>
  )
}
