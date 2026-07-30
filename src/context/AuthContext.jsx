import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // sessionStorage (bukan localStorage) — sesi login sengaja tidak
    // "diingat" lintas tab/window. Kalau tabnya ditutup, sessionStorage-nya
    // ikut hilang, jadi begitu situsnya dibuka lagi harus login ulang.
    const token = sessionStorage.getItem('token')
    if (token) {
      api.get('/auth/me')
        .then((res) => setUser(res.data.user))
        .catch(() => sessionStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(username, password, captchaToken) {
    const res = await api.post('/auth/login', { username, password, captchaToken })
    sessionStorage.setItem('token', res.data.token)
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
    sessionStorage.setItem('token', res.data.token)
    setUser(res.data.user)
  }

  async function resendCode(email) {
    const res = await api.post('/auth/resend-code', { email })
    return res.data
  }

  // Lupa kata sandi, langkah 1: minta kode dikirim ke email.
  async function forgotPassword(email) {
    const res = await api.post('/auth/forgot-password', { email })
    return res.data
  }

  // Lupa kata sandi, langkah 2: kirim kode + kata sandi baru. Tidak
  // langsung login otomatis — user diarahkan ke halaman Masuk supaya
  // sadar betul kata sandinya sudah berganti.
  async function resetPassword(email, kode, password) {
    const res = await api.post('/auth/reset-password', { email, kode, password })
    return res.data
  }

  function logout() {
    sessionStorage.removeItem('token')
    setUser(null)
  }

  // Dipakai UserProfilePage setelah berhasil PUT /users/me — supaya nama
  // pena baru langsung kepakai di Navbar dkk tanpa perlu reload halaman.
  function updateUser(data) {
    setUser((prev) => (prev ? { ...prev, ...data } : prev))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, resendCode, forgotPassword, resetPassword, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
