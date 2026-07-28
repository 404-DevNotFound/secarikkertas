import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../feature/NotificationBell'
import DarkModeToggle from '../common/DarkModeToggle'

const NAMA_BULAN = [
  'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN',
  'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES',
]

function inisialDari(teks) {
  if (!teks) return '?'
  const kata = teks.trim().split(/\s+/)
  if (kata.length === 1) return kata[0].slice(0, 2).toUpperCase()
  return (kata[0][0] + kata[1][0]).toUpperCase()
}

// Halaman sampul bukan route React Router — dia ditampilkan oleh App.jsx
// berdasarkan flag session storage "sk_sudah_dibuka". Jadi buat "balik
// ke sampul", hapus flag itu lalu hard-navigate ke "/" supaya App
// mengevaluasi ulang dan menampilkan CoverPage lagi.
function kembaliKeSampul() {
  sessionStorage.removeItem('sk_sudah_dibuka')
  window.location.href = '/'
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const [menuBuka, setMenuBuka] = useState(false)
  const { pathname } = useLocation()

  const hariIni = new Date()

  const tautan = (to) =>
    `font-mono text-[12px] uppercase tracking-[0.12em] px-1 py-0.5 border-b-2 transition-colors ${
      pathname === to
        ? 'border-naskah-leather text-naskah-ink'
        : 'border-transparent text-naskah-inksoft/70 hover:text-naskah-ink'
    }`

  return (
    <header className="border-b border-naskah-aged">
      <div className="px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-4">
        {/* Kiri: kotak "tanggal & bulan" ala buku catatan/jurnal, + logo */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex flex-col items-center leading-none border border-naskah-aged px-2.5 py-1.5 shrink-0">
            <span className="font-mono text-[9px] uppercase tracking-widest text-naskah-leather">
              {NAMA_BULAN[hariIni.getMonth()]}
            </span>
            <span className="font-judul text-lg text-naskah-ink">
              {String(hariIni.getDate()).padStart(2, '0')}
            </span>
          </div>
          <Link to="/" className="min-w-0" onClick={() => setMenuBuka(false)}>
            <span className="font-judul italic text-lg sm:text-2xl text-naskah-leather truncate block">
              secarikkertas
            </span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-5 shrink-0">
          <button
            onClick={kembaliKeSampul}
            className="font-mono text-[12px] uppercase tracking-[0.12em] text-naskah-inksoft/70 hover:text-naskah-ink transition-colors inline-flex items-center gap-1"
            title="Kembali ke sampul buku"
          >
            <span aria-hidden>←</span> Sampul
          </button>
          <Link to="/" className={tautan('/')}>Beranda</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className={tautan('/admin')}>Admin</Link>
          )}
          {user && (
            <>
              <Link to="/dashboard" className={tautan('/dashboard')}>Dasbor</Link>
              <Link to="/tersimpan" className={tautan('/tersimpan')}>Tersimpan</Link>
              <Link to="/profile" className={tautan('/profile')}>Profil</Link>
              <NotificationBell />
            </>
          )}

          <DarkModeToggle />

          {user ? (
            <>
              <button
                onClick={logout}
                className="font-mono text-[12px] uppercase tracking-[0.12em] text-naskah-inksoft/70 hover:text-naskah-ink transition-colors"
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

        <div className="flex items-center gap-1 md:hidden shrink-0">
          <DarkModeToggle />
          <button className="p-2 -mr-2" onClick={() => setMenuBuka((v) => !v)} aria-label="Buka menu">
            <svg width="22" height="22" viewBox="0 0 22 22" className="text-naskah-ink">
              <line x1="2" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="1.8" />
              <line x1="2" y1="11" x2="20" y2="11" stroke="currentColor" strokeWidth="1.8" />
              <line x1="2" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </button>
        </div>
      </div>

      {menuBuka && (
        <div className="md:hidden border-t border-naskah-aged px-4 py-4 flex flex-col gap-4 font-mono text-sm uppercase tracking-wide">
          <button onClick={kembaliKeSampul} className="text-left text-naskah-inksoft">← Sampul</button>
          <Link to="/" onClick={() => setMenuBuka(false)} className="text-naskah-inksoft">Beranda</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" onClick={() => setMenuBuka(false)} className="text-naskah-leather">Admin</Link>
          )}
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuBuka(false)} className="text-naskah-inksoft">Dasbor</Link>
              <Link to="/tersimpan" onClick={() => setMenuBuka(false)} className="text-naskah-inksoft">Tersimpan</Link>
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
    </header>
  )
}
