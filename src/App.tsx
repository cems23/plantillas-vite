import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './lib/AuthContext'
import { Login } from './pages/Login'
import { Layout } from './components/layout/Layout'
import { Home } from './pages/Home'
import { NewTemplate } from './pages/NewTemplate'
import { EditTemplate } from './pages/EditTemplate'
import { TemplateDetail } from './pages/TemplateDetail'
import { Admin } from './pages/Admin'
import { AdminUsers } from './pages/AdminUsers'
import { AdminAudit } from './pages/AdminAudit'
import { AdminImport } from './pages/AdminImport'
import { Settings } from './pages/Settings'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  if (profile?.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <>
      <Toaster position="bottom-right" toastOptions={{
        style: { background: '#1e293b', color: '#f1f5f9', borderRadius: '12px', fontSize: '14px' },
      }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Home />} />
          <Route path="templates/new" element={<NewTemplate />} />
          <Route path="templates/:id" element={<TemplateDetail />} />
          <Route path="templates/:id/edit" element={<EditTemplate />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="admin/audit" element={<AdminRoute><AdminAudit /></AdminRoute>} />
          <Route path="admin/import" element={<AdminImport />} />
        </Route>
      </Routes>
    </>
  )
}
