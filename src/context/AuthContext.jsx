import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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

  async function login(username, password, captchaToken) {
    const res = await api.post('/auth/login', { username, password, captchaToken })
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
  }

  // Langkah 1: kirim data pendaftaran, server bikin akun (belum aktif) dan
  // kirim kode verifikasi ke email. Belum ada token di sini — user belum
  // "login" sampai kodenya diverifikasi lewat verifyEmail().
  async function register(username, email, password, captchaToken) {
    const res = await api.post('/auth/register', { username, email, password, captchaToken })
    return res.data
  }

  // Langkah 2: user masukkan kode 6 digit dari email. Kalau cocok, server
  // balikin token — di sinilah user benar-benar login.
  async function verifyEmail(email, kode) {
    const res = await api.post('/auth/verify-email', { email, kode })
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
  }

  async function resendCode(email) {
    const res = await api.post('/auth/resend-code', { email })
    return res.data
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, resendCode, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
