export default function Sidebar({ kategori = [], populer = [] }) {
  return (
    <aside className="w-full md:w-64 shrink-0 space-y-8">
      <div>
        <h3 className="font-semibold text-slate-800 mb-3">Kategori</h3>
        <ul className="space-y-2 text-slate-600">
          {kategori.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-slate-800 mb-3">Cerpen Populer</h3>
        <ul className="space-y-2 text-slate-600">
          {populer.map((p) => (
            <li key={p.id}>{p.judul}</li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
