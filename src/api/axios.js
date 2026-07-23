import axios from 'axios'

// Development (npm run dev di komputermu): backend jalan terpisah di localhost:5000
// Production (sudah live di internet): backend jadi satu domain lewat rewrites di vercel.json,
// jadi cukup panggil "/api" tanpa perlu sebut domain penuh.
const baseURL = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : '/api'

const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
