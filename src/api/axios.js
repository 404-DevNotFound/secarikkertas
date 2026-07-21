import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // ganti sesuai alamat back-end kamu nanti
})

// Setiap request otomatis kirim token JWT kalau ada (FR-01.1)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
