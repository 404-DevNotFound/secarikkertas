import app from '../server.js'

// Vercel butuh file di folder /api yang meng-export handler.
// Kita tinggal pakai ulang express app yang sudah ada di server.js.
export default app
