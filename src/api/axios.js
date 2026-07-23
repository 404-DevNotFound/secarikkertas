import axios from 'axios'

// Development (npm run dev lokal): backend jalan terpisah di localhost:5000
// Production (project frontend & backend TERPISAH di Vercel): butuh URL lengkap
// backend, diatur lewat environment variable VITE_API_URL di Vercel
// (Settings > Environment Variables project FRONTEND, bukan yang backend).
const baseURL = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : `${import.meta.env.VITE_API_URL}/api`

const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
