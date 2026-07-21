import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
      <Link to="/" className="text-xl font-bold text-slate-800">
        SecarikKertas
      </Link>

      <div className="flex items-center gap-4">
        <Link to="/" className="text-slate-600 hover:text-slate-900">Beranda</Link>

        {user ? (
          <>
            <Link to="/dashboard" className="text-slate-600 hover:text-slate-900">Dashboard</Link>
            <Link to="/profile" className="text-slate-600 hover:text-slate-900">Profil</Link>
            <button onClick={logout} className="text-red-500 hover:text-red-700">
              Keluar
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-slate-600 hover:text-slate-900">Masuk</Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
            >
              Daftar
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
