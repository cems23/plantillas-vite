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
      ? 'bg-[#1a1a1a] text-white dark:bg-white dark:text-[#1a1a1a]'
      : 'text-[#666] hover:text-[#1a1a1a] hover:bg-black/5 dark:text-[#888] dark:hover:text-white dark:hover:bg-white/5')

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    editor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    viewer: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
  }
  const roleBadge = roleColors[profile?.role || 'viewer']

  return (
    <aside className="w-64 bg-[#faf9f7] dark:bg-[#141414] border-r border-black/6 dark:border-white/6 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-black/6 dark:border-white/6">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 bg-[#1a1a1a] dark:bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white dark:text-[#1a1a1a] text-xs font-bold tracking-tight">CS</span>
          </div>
          <div>
            <p className="font-semibold text-[#1a1a1a] dark:text-white text-sm tracking-tight">CMCSHUB</p>
            <p className="text-xs text-[#999] dark:text-[#666]">Customer Support</p>
          </div>
        </div>
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-lg text-[#999] hover:text-[#1a1a1a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        <div>
          <p className="text-[10px] font-semibold text-[#bbb] dark:text-[#555] uppercase tracking-widest px-3 mb-2">Main</p>
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
            <p className="text-[10px] font-semibold text-[#bbb] dark:text-[#555] uppercase tracking-widest px-3 mb-2">Tools</p>
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
      <div className="p-3 border-t border-black/6 dark:border-white/6">
        <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
            : <div className="w-8 h-8 rounded-full bg-[#1a1a1a] dark:bg-white flex items-center justify-center text-xs font-bold text-white dark:text-[#1a1a1a] flex-shrink-0">
                {(profile?.full_name?.[0] || profile?.email?.[0] || '?').toUpperCase()}
              </div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#1a1a1a] dark:text-white truncate">{profile?.full_name || profile?.email}</p>
            <span className={'text-[10px] px-1.5 py-0.5 rounded-full font-medium ' + roleBadge}>{profile?.role}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#999] dark:text-[#666] hover:text-[#1a1a1a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
        >
          <LogOut className="w-4 h-4" />Sign out
        </button>
      </div>
    </aside>
  )
}
