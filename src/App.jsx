import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'

import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'

import HomePage from './pages/HomePage'
import ReadPostPage from './pages/ReadPostPage'
import WriterDashboard from './pages/WriterDashboard'
import WriteEditorPage from './pages/WriteEditorPage'
import UserProfilePage from './pages/UserProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/post/:id" element={<ReadPostPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* FR-01.2: halaman ini butuh login */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <WriterDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/tulis/:id"
                element={
                  <ProtectedRoute>
                    <WriteEditorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfilePage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
