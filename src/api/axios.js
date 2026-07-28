import axios from 'axios'

// Buang trailing slash kalau ada, supaya tidak pernah dobel slash
// walau env variable-nya kebetulan diisi dengan atau tanpa "/" di akhir.
function bersihkanUrl(url) {
  return (url || '').replace(/\/+$/, '')
}

const baseURL = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : `${bersihkanUrl(import.meta.env.VITE_API_URL)}/api`

const api = axios.create({ baseURL })

// Token disimpan di sessionStorage (bukan localStorage) — sengaja, supaya
// sesi login otomatis berakhir begitu tab/window browser ditutup. Lihat
// juga AuthContext.jsx yang baca/simpan token dengan cara yang sama.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
