export default function InputField({ label, error, ...props }) {
  return (
    <div className="mb-5">
      {label && (
        <label className="block font-mono text-[11px] uppercase tracking-widest text-tinta-faint mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full px-0 py-2 bg-transparent border-0 border-b-2 outline-none font-baca text-tinta placeholder:text-tinta-faint/60 focus:border-stempel transition-colors ${
          error ? 'border-stabilo' : 'border-kertas-line'
        }`}
        {...props}
      />
      {error && <p className="font-mono text-xs text-stabilo mt-1.5">{error}</p>}
    </div>
  )
}
