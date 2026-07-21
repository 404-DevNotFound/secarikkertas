import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

// FR-02.1: state login pengguna disimpan global di front-end
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Saat app pertama kali dibuka, cek apakah ada token tersimpan
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get('/auth/me')
        .then((res) => setUser(res.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
  }

  async function register(nama, email, password) {
    const res = await api.post('/auth/register', { nama, email, password })
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook biar dipakainya tinggal: const { user, login } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}
