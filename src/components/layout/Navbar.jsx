import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="border-b border-kertas-line bg-kertas/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          {/* Signature mark: pena + secarik kertas, bukan logo generik */}
          <svg width="26" height="26" viewBox="0 0 26 26" className="shrink-0">
            <path d="M4 3 L20 3 L22 6 L22 23 L4 23 Z" fill="#FAF6EC" stroke="#2B2A28" strokeWidth="1.3" />
            <path d="M20 3 L20 6 L22 6 Z" fill="#DDD5C0" stroke="#2B2A28" strokeWidth="1" />
            <line x1="7" y1="10" x2="17" y2="10" stroke="#3F6C51" strokeWidth="1.2" />
            <line x1="7" y1="14" x2="17" y2="14" stroke="#3F6C51" strokeWidth="1.2" />
            <line x1="7" y1="18" x2="13" y2="18" stroke="#3F6C51" strokeWidth="1.2" />
          </svg>
          <span className="font-judul text-xl font-semibold tracking-tight text-tinta">
            secarikkertas
          </span>
        </Link>

        <div className="flex items-center gap-6 font-mono text-[13px] uppercase tracking-wide">
          <Link to="/" className="text-tinta-soft hover:text-stempel transition-colors">Beranda</Link>

          {user ? (
            <>
              <Link to="/dashboard" className="text-tinta-soft hover:text-stempel transition-colors">Dasbor</Link>
              <Link to="/profile" className="text-tinta-soft hover:text-stempel transition-colors">Profil</Link>
              <button onClick={logout} className="text-tinta-soft hover:text-stabilo transition-colors">
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-tinta-soft hover:text-stempel transition-colors">Masuk</Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-tinta text-kertas rounded-none hover:bg-stempel-dark transition-colors normal-case font-baca text-sm not-italic"
              >
                Mulai Menulis
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
