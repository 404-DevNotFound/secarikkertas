import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import AdminRoute from './routes/AdminRoute'

import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'

import CoverPage from './pages/CoverPage'
import HomePage from './pages/HomePage'
import ReadPostPage from './pages/ReadPostPage'
import WriterDashboard from './pages/WriterDashboard'
import WriteEditorPage from './pages/WriteEditorPage'
import UserProfilePage from './pages/UserProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminDashboard from './pages/AdminDashboard'

// Cover hanya tampil kalau: (a) user membuka path root "/", dan
// (b) belum pernah menekan "Buka Buku" di sesi browser ini.
// Kalau user masuk lewat deep link (mis. dibagikan link /post/123),
// cover dilewati supaya link share tetap langsung ke kontennya.
function perluTampilkanCover() {
  const diPathRoot = window.location.pathname === '/'
  const sudahDibuka = sessionStorage.getItem('sk_sudah_dibuka') === '1'
  return diPathRoot && !sudahDibuka
}

function App() {
  const [tampilkanCover, setTampilkanCover] = useState(perluTampilkanCover)

  if (tampilkanCover) {
    return (
      <CoverPage
        onOpen={() => {
          sessionStorage.setItem('sk_sudah_dibuka', '1')
          setTampilkanCover(false)
        }}
      />
    )
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Buku mengisi penuh layar — tanpa "meja"/latar di sekelilingnya,
            tanpa padding, tanpa batas lebar maksimum, tanpa sudut
            membulat/bayangan mengambang. Struktur di dalamnya (navbar,
            spread dua halaman, footer) tidak berubah. */}
        <div className="relative w-full min-h-screen bg-naskah-bg overflow-x-hidden">
          {/* Pita pembatas buku (bookmark ribbon), menggantung dari tengah atas */}
          <div
            className="absolute left-1/2 top-0 z-30 pointer-events-none"
            style={{
              width: '24px',
              height: '94px',
              background: 'linear-gradient(180deg, #B4405C 0%, #8A2C43 100%)',
              clipPath: 'polygon(0 0, 100% 0, 100% 76%, 50% 100%, 0 76%)',
              transform: 'translateX(-50%) rotate(-1.3deg)',
              boxShadow: '1px 2px 5px rgba(28,28,19,0.3)',
            }}
          >
            <div className="absolute inset-y-0 left-1/2 w-px bg-black/20" style={{ transform: 'translateX(-50%)' }} />
          </div>

          {/* Buku besar — sekarang mengisi seluruh viewport (100vh),
              bukan lagi kartu mengambang di atas latar. */}
          <div className="w-full h-screen flex flex-col overflow-hidden">
            <Navbar />

            <main className="flex-1 min-h-0 overflow-y-auto scroll-halus">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/post/:id" element={<ReadPostPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route path="/dashboard" element={<ProtectedRoute><WriterDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/tulis/:id" element={<ProtectedRoute><WriteEditorPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />

                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              </Routes>
            </main>

            <Footer />
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
