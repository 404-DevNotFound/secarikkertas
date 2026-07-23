export default function Sidebar({ kategori = [], kategoriAktif, onPilihKategori, populer = [] }) {
  return (
    <aside className="w-full md:w-60 shrink-0 space-y-10">
      <div>
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-tinta-faint mb-3 coret-bawah inline-block">
          Kategori
        </h3>
        <ul className="space-y-1 mt-2 flex md:block gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          <li>
            <button
              onClick={() => onPilihKategori?.(null)}
              className={`stabilo-hover font-baca text-left whitespace-nowrap px-1 py-0.5 transition-colors ${
                !kategoriAktif ? 'text-tinta font-medium bg-stabilo-light' : 'text-tinta-soft'
              }`}
            >
              Semua
            </button>
          </li>
          {kategori.map((k) => (
            <li key={k}>
              <button
                onClick={() => onPilihKategori?.(k)}
                className={`stabilo-hover font-baca text-left whitespace-nowrap px-1 py-0.5 transition-colors ${
                  kategoriAktif === k ? 'text-tinta font-medium bg-stabilo-light' : 'text-tinta-soft'
                }`}
              >
                {k}
              </button>
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
