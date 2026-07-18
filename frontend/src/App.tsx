import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Users } from './pages/Users'
import { Lists } from './pages/Lists'
import { ListDetail } from './pages/ListDetail'
import { Reports } from './pages/Reports'
import { EstadoCirugia } from './pages/EstadoCirugia'
import { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  if (!user) return <Navigate to="/login" />
  return <Layout>{children}</Layout>
}

function RoleRoute({ children, roles }: { children: ReactNode; roles: string[] }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  if (!user) return <Navigate to="/login" />
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" />
  return <Layout>{children}</Layout>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/users" element={<RoleRoute roles={['admin']}><Users /></RoleRoute>} />
          <Route path="/lists" element={<ProtectedRoute><Lists /></ProtectedRoute>} />
          <Route path="/lists/:id" element={<ProtectedRoute><ListDetail /></ProtectedRoute>} />
          <Route path="/reports" element={<RoleRoute roles={['admin', 'direccion']}><Reports /></RoleRoute>} />
          <Route path="/estado-cirugia" element={<RoleRoute roles={['admin', 'direccion']}><EstadoCirugia /></RoleRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
