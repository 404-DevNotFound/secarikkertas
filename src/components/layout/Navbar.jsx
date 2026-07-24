import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [menuBuka, setMenuBuka] = useState(false)

  return (
    <nav className="bg-tinta sticky top-0 z-20 shadow-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group" onClick={() => setMenuBuka(false)}>
          <svg width="26" height="26" viewBox="0 0 26 26" className="shrink-0">
            <path d="M4 3 L20 3 L22 6 L22 23 L4 23 Z" fill="#FAF6EC" stroke="#FAF6EC" strokeWidth="1.3" />
            <path d="M20 3 L20 6 L22 6 Z" fill="#DDD5C0" stroke="#FAF6EC" strokeWidth="1" />
            <line x1="7" y1="10" x2="17" y2="10" stroke="#3F6C51" strokeWidth="1.2" />
            <line x1="7" y1="14" x2="17" y2="14" stroke="#3F6C51" strokeWidth="1.2" />
            <line x1="7" y1="18" x2="13" y2="18" stroke="#3F6C51" strokeWidth="1.2" />
          </svg>
          <span className="font-judul text-xl font-semibold tracking-tight text-kertas">
            secarikkertas
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 font-mono text-[13px] uppercase tracking-wide">
          <Link to="/" className="stabilo-hover text-kertas/80 hover:text-stabilo transition-colors px-1 py-0.5">
            Beranda
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="stabilo-hover text-stabilo hover:opacity-70 transition-colors px-1 py-0.5">
              Admin
            </Link>
          )}
          {user ? (
            <>
              <Link to="/dashboard" className="stabilo-hover text-kertas/80 hover:text-stabilo transition-colors px-1 py-0.5">
                Dasbor
              </Link>
              <Link to="/profile" className="stabilo-hover text-kertas/80 hover:text-stabilo transition-colors px-1 py-0.5">
                Profil
              </Link>
              <button onClick={logout} className="stabilo-hover text-kertas/80 hover:text-stabilo transition-colors px-1 py-0.5">
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="stabilo-hover text-kertas/80 hover:text-stabilo transition-colors px-1 py-0.5">
                Masuk
              </Link>
              <Link to="/register" className="px-4 py-2 bg-stempel text-kertas hover:bg-stempel-dark transition-colors normal-case font-baca text-sm not-italic">
                Mulai Menulis
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2 -mr-2" onClick={() => setMenuBuka((v) => !v)} aria-label="Buka menu">
          <svg width="22" height="22" viewBox="0 0 22 22">
            <line x1="2" y1="6" x2="20" y2="6" stroke="#FAF6EC" strokeWidth="1.8" />
            <line x1="2" y1="11" x2="20" y2="11" stroke="#FAF6EC" strokeWidth="1.8" />
            <line x1="2" y1="16" x2="20" y2="16" stroke="#FAF6EC" strokeWidth="1.8" />
          </svg>
        </button>
      </div>

      {menuBuka && (
        <div className="md:hidden border-t border-tinta-soft/30 bg-tinta px-4 py-4 flex flex-col gap-4 font-mono text-sm uppercase tracking-wide">
          <Link to="/" onClick={() => setMenuBuka(false)} className="text-kertas/80">Beranda</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" onClick={() => setMenuBuka(false)} className="text-stabilo">Admin</Link>
          )}
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuBuka(false)} className="text-kertas/80">Dasbor</Link>
              <Link to="/profile" onClick={() => setMenuBuka(false)} className="text-kertas/80">Profil</Link>
              <button onClick={() => { logout(); setMenuBuka(false) }} className="text-left text-kertas/80">Keluar</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuBuka(false)} className="text-kertas/80">Masuk</Link>
              <Link to="/register" onClick={() => setMenuBuka(false)} className="text-stabilo">Mulai Menulis</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
