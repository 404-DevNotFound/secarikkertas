import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// FR-01.2: React harus menyediakan Protected Routes
// Bungkus halaman yang perlu login, contoh pemakaian ada di App.jsx
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <p>Memuat...</p>
  if (!user) return <Navigate to="/login" replace />

  return children
}
