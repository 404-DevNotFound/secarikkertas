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
        {/* "Meja" — latar penuh layar di belakang buku */}
        <div className="min-h-screen bg-naskah-surface flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-x-hidden">
          {/* Buku besar — mengisi hampir seluruh layar, bukan cuma kartu kecil di tengah */}
          <div className="w-full max-w-[1600px] h-[95vh] sm:h-[93vh] bg-naskah-bg rounded-lg shadow-[0_30px_70px_rgba(28,28,19,0.32)] flex flex-col overflow-hidden">
            <Navbar />

            <main className="flex-1 min-h-0 overflow-y-auto">
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
