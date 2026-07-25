import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Ambil 1-2 huruf inisial dari nama pena / username, untuk avatar bulat
function inisialDari(teks) {
  if (!teks) return '?'
  const kata = teks.trim().split(/\s+/)
  if (kata.length === 1) return kata[0].slice(0, 2).toUpperCase()
  return (kata[0][0] + kata[1][0]).toUpperCase()
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const [menuBuka, setMenuBuka] = useState(false)
  const { pathname } = useLocation()

  const tautan = (to) =>
    `font-mono text-[13px] uppercase tracking-[0.12em] px-1 py-0.5 border-b-2 transition-colors ${
      pathname === to
        ? 'border-naskah-leather text-naskah-ink'
        : 'border-transparent text-naskah-inksoft/70 hover:text-naskah-ink'
    }`

  return (
    <nav className="bg-naskah-bg sticky top-0 z-20 border-b border-naskah-aged">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <Link to="/" className="shrink-0" onClick={() => setMenuBuka(false)}>
          <span className="font-judul italic text-xl sm:text-2xl text-naskah-leather">
            secarikkertas
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-5">
          <Link to="/" className={tautan('/')}>Beranda</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className={tautan('/admin')}>Admin</Link>
          )}
          {user && (
            <>
              <Link to="/dashboard" className={tautan('/dashboard')}>Dasbor</Link>
              <Link to="/profile" className={tautan('/profile')}>Profil</Link>
            </>
          )}

          {user ? (
            <>
              <button
                onClick={logout}
                className="font-mono text-[13px] uppercase tracking-[0.12em] text-naskah-inksoft/70 hover:text-naskah-ink transition-colors"
              >
                Keluar
              </button>
              <Link
                to="/profile"
                className="w-8 h-8 rounded-full bg-naskah-leather text-naskah-bg flex items-center justify-center font-ketik text-xs shrink-0"
                title={user.namaPena || user.username}
              >
                {inisialDari(user.namaPena || user.username)}
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className={tautan('/login')}>Masuk</Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-naskah-leather text-naskah-bg hover:bg-naskah-leatherdark transition-colors font-mono text-xs uppercase tracking-wide"
              >
                Mulai Menulis
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2 -mr-2" onClick={() => setMenuBuka((v) => !v)} aria-label="Buka menu">
          <svg width="22" height="22" viewBox="0 0 22 22">
            <line x1="2" y1="6" x2="20" y2="6" stroke="#1C1C13" strokeWidth="1.8" />
            <line x1="2" y1="11" x2="20" y2="11" stroke="#1C1C13" strokeWidth="1.8" />
            <line x1="2" y1="16" x2="20" y2="16" stroke="#1C1C13" strokeWidth="1.8" />
          </svg>
        </button>
      </div>

      {menuBuka && (
        <div className="md:hidden border-t border-naskah-aged bg-naskah-bg px-4 py-4 flex flex-col gap-4 font-mono text-sm uppercase tracking-wide">
          <Link to="/" onClick={() => setMenuBuka(false)} className="text-naskah-inksoft">Beranda</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" onClick={() => setMenuBuka(false)} className="text-naskah-leather">Admin</Link>
          )}
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuBuka(false)} className="text-naskah-inksoft">Dasbor</Link>
              <Link to="/profile" onClick={() => setMenuBuka(false)} className="text-naskah-inksoft">Profil</Link>
              <button onClick={() => { logout(); setMenuBuka(false) }} className="text-left text-naskah-inksoft">Keluar</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuBuka(false)} className="text-naskah-inksoft">Masuk</Link>
              <Link to="/register" onClick={() => setMenuBuka(false)} className="text-naskah-leather">Mulai Menulis</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
