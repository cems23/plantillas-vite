import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutGrid, PlusCircle, Shield, Upload, Clock, Users, Settings, LogOut, Moon, Sun } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { useApp } from '../../lib/AppContext'

export function Sidebar() {
  const { profile, signOut } = useAuth()
  const { darkMode, toggleDarkMode } = useApp()
  const navigate = useNavigate()
  const isAdmin = profile?.role === 'admin'
  const canEdit = profile?.role === 'admin' || profile?.role === 'editor'

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ' +
    (isActive
      ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-sm shadow-blue-200 dark:shadow-blue-900/30'
      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-white/5')

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    editor: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    viewer: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
  }
  const roleBadge = roleColors[profile?.role || 'viewer']

  return (
    <aside className="w-64 bg-white dark:bg-[#0d1829] border-r border-blue-50 dark:border-white/5 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-blue-50 dark:border-white/5">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-xl grad-btn flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-200 dark:shadow-blue-900/40">
            <span className="text-white text-xs font-bold tracking-tight">CS</span>
          </div>
          <div>
            <p className="font-bold text-[#0d1f3c] dark:text-white text-sm tracking-tight">
              <span className="text-blue-600">CMCS</span>HUB
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Customer Support</p>
          </div>
        </div>
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-white/5 transition-all"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        <div>
          <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest px-3 mb-2">Main</p>
          <div className="space-y-0.5">
            <NavLink to="/" end className={linkClass}>
              <LayoutGrid className="w-4 h-4 flex-shrink-0" />Templates
            </NavLink>
            {canEdit && (
              <NavLink to="/templates/new" className={linkClass}>
                <PlusCircle className="w-4 h-4 flex-shrink-0" />New template
              </NavLink>
            )}
            <NavLink to="/settings" className={linkClass}>
              <Settings className="w-4 h-4 flex-shrink-0" />Settings
            </NavLink>
          </div>
        </div>

        {(isAdmin || canEdit) && (
          <div>
            <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest px-3 mb-2">Tools</p>
            <div className="space-y-0.5">
              <NavLink to="/admin/import" className={linkClass}>
                <Upload className="w-4 h-4 flex-shrink-0" />Import from Keep
              </NavLink>
              {isAdmin && <>
                <NavLink to="/admin" end className={linkClass}>
                  <Shield className="w-4 h-4 flex-shrink-0" />Admin panel
                </NavLink>
                <NavLink to="/admin/users" className={linkClass}>
                  <Users className="w-4 h-4 flex-shrink-0" />Users
                </NavLink>
                <NavLink to="/admin/audit" className={linkClass}>
                  <Clock className="w-4 h-4 flex-shrink-0" />Audit log
                </NavLink>
              </>}
            </div>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-blue-50 dark:border-white/5">
        <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl bg-blue-50/50 dark:bg-white/3">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-blue-100 dark:ring-white/10" />
            : <div className="w-8 h-8 rounded-full grad-btn flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {(profile?.full_name?.[0] || profile?.email?.[0] || '?').toUpperCase()}
              </div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 dark:text-white truncate">{profile?.full_name || profile?.email}</p>
            <span className={'text-[10px] px-1.5 py-0.5 rounded-full font-semibold ' + roleBadge}>{profile?.role}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
        >
          <LogOut className="w-4 h-4" />Sign out
        </button>
      </div>
    </aside>
  )
}
