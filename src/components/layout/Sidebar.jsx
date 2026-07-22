export default function Sidebar({ kategori = [], populer = [] }) {
  return (
    <aside className="w-full md:w-60 shrink-0 space-y-10">
      <div>
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-tinta-faint mb-3 coret-bawah inline-block">
          Kategori
        </h3>
        <ul className="space-y-2 mt-2">
          {kategori.map((k) => (
            <li key={k} className="font-baca text-tinta-soft hover:text-stempel cursor-pointer transition-colors">
              {k}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-tinta-faint mb-3">
          Cerpen Populer
        </h3>
        <ul className="space-y-3 mt-2">
          {populer.map((p) => (
            <li key={p.id} className="font-baca text-sm text-tinta-soft border-l-2 border-stempel/30 pl-3">
              {p.judul}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
