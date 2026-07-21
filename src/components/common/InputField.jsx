// FR-02.2: form interaktif dengan validasi langsung
export default function InputField({ label, error, ...props }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 ${
          error ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:ring-slate-200'
        }`}
        {...props}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}
