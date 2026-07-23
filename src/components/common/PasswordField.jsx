import { useState } from 'react'

export default function PasswordField({ label, error, ...props }) {
  const [terlihat, setTerlihat] = useState(false)

  return (
    <div className="mb-5">
      {label && (
        <label className="block font-mono text-[11px] uppercase tracking-widest text-tinta-faint mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={terlihat ? 'text' : 'password'}
          className={`w-full px-0 py-2 pr-8 bg-transparent border-0 border-b-2 outline-none font-baca text-tinta placeholder:text-tinta-faint/60 focus:border-stempel transition-colors ${
            error ? 'border-stabilo' : 'border-kertas-line'
          }`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setTerlihat((v) => !v)}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-tinta-faint hover:text-tinta-soft"
          tabIndex={-1}
          aria-label={terlihat ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
        >
          {terlihat ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 9c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5c-1.5 3-4 4.5-7 4.5S3.5 12 2 9Z" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.3" />
              <line x1="2" y1="16" x2="16" y2="2" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 9c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5c-1.5 3-4 4.5-7 4.5S3.5 12 2 9Z" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="font-mono text-xs text-stabilo mt-1.5">{error}</p>}
    </div>
  )
}
