import { NavLink, useNavigate } from 'react-router-dom'
import { BookOpen, LayoutDashboard, PlusCircle, Shield, Upload, Clock, Users, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'

export function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const isAdmin = profile?.role === 'admin'
  const canEdit = profile?.role === 'admin' || profile?.role === 'editor'

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`

  const roleColors = { admin: 'bg-red-100 text-red-700', editor: 'bg-indigo-100 text-indigo-700', viewer: 'bg-slate-100 text-slate-600' }
  const roleBadge = roleColors[profile?.role || 'viewer']

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">Plantillas CS</p>
            <p className="text-xs text-slate-400">Atención al cliente</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1">Principal</p>
          <div className="space-y-0.5">
            <NavLink to="/" end className={linkClass}>
              <LayoutDashboard className="w-4 h-4" />Inicio
            </NavLink>
            {canEdit && (
              <NavLink to="/templates/new" className={linkClass}>
                <PlusCircle className="w-4 h-4" />Nueva plantilla
              </NavLink>
            )}
            <NavLink to="/settings" className={linkClass}>
              <Settings className="w-4 h-4" />Ajustes
            </NavLink>
          </div>
        </div>

        {(isAdmin || canEdit) && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1">Herramientas</p>
            <div className="space-y-0.5">
              <NavLink to="/admin/import" className={linkClass}>
                <Upload className="w-4 h-4" />Importar Keep
              </NavLink>
              {isAdmin && <>
                <NavLink to="/admin" end className={linkClass}>
                  <Shield className="w-4 h-4" />Panel admin
                </NavLink>
                <NavLink to="/admin/users" className={linkClass}>
                  <Users className="w-4 h-4" />Usuarios
                </NavLink>
                <NavLink to="/admin/audit" className={linkClass}>
                  <Clock className="w-4 h-4" />Auditoría
                </NavLink>
              </>}
            </div>
          </div>
        )}
      </nav>

      {/* Usuario */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full" />
            : <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                {(profile?.full_name?.[0] || profile?.email?.[0] || '?').toUpperCase()}
              </div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{profile?.full_name || profile?.email}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleBadge}`}>{profile?.role}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-50 transition-colors">
          <LogOut className="w-4 h-4" />Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
