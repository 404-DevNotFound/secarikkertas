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
        <div className="min-h-screen flex flex-col bg-kertas overflow-x-hidden">
          <Navbar />

          <main className="flex-1">
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
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
