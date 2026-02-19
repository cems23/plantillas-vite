import { NavLink, useNavigate } from 'react-router-dom'
import { BookOpen, LayoutDashboard, PlusCircle, Shield, Upload, Clock, Users, Settings, LogOut, Moon, Sun } from 'lucide-react'
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
    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ' +
    (isActive
      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100')

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    editor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    viewer: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
  }
  const roleBadge = roleColors[profile?.role || 'viewer']

  return (
    <aside className="w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0">
      <div className="h-16 flex items-center px-5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-sm">CMCSHUB</p>
            <p className="text-xs text-slate-400">Customer Support</p>
          </div>
        </div>
        <button onClick={toggleDarkMode} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1">Main</p>
          <div className="space-y-0.5">
            <NavLink to="/" end className={linkClass}><LayoutDashboard className="w-4 h-4" />Templates</NavLink>
            {canEdit && <NavLink to="/templates/new" className={linkClass}><PlusCircle className="w-4 h-4" />New template</NavLink>}
            <NavLink to="/settings" className={linkClass}><Settings className="w-4 h-4" />Settings</NavLink>
          </div>
        </div>

        {(isAdmin || canEdit) && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1">Tools</p>
            <div className="space-y-0.5">
              <NavLink to="/admin/import" className={linkClass}><Upload className="w-4 h-4" />Import from Keep</NavLink>
              {isAdmin && <>
                <NavLink to="/admin" end className={linkClass}><Shield className="w-4 h-4" />Admin panel</NavLink>
                <NavLink to="/admin/users" className={linkClass}><Users className="w-4 h-4" />Users</NavLink>
                <NavLink to="/admin/audit" className={linkClass}><Clock className="w-4 h-4" />Audit log</NavLink>
              </>}
            </div>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full" />
            : <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-sm font-bold text-indigo-700 dark:text-indigo-300">
                {(profile?.full_name?.[0] || profile?.email?.[0] || '?').toUpperCase()}
              </div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{profile?.full_name || profile?.email}</p>
            <span className={"text-xs px-1.5 py-0.5 rounded-full font-medium " + roleBadge}>{profile?.role}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <LogOut className="w-4 h-4" />Sign out
        </button>
      </div>
    </aside>
  )
}
