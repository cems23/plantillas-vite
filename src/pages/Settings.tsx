import { useAuth } from '../lib/AuthContext'

const roleDescriptions: Record<string, string> = {
  admin: 'Full access: create, edit, delete templates and manage users.',
  editor: 'Can create and edit your own templates.',
  viewer: 'Can view and copy templates only.',
}

export function Settings() {
  const { profile } = useAuth()

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Your profile and permissions</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 flex items-center gap-4 border-b border-slate-100">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full ring-4 ring-slate-100" />
            : <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700">{(profile?.full_name?.[0] || profile?.email?.[0] || '?').toUpperCase()}</div>
          }
          <div>
            <p className="text-lg font-bold text-slate-900">{profile?.full_name || 'No name'}</p>
            <p className="text-slate-500 text-sm">{profile?.email}</p>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="px-6 py-4 flex justify-between items-center">
            <span className="text-sm text-slate-500">Role</span>
            <span className="text-sm font-semibold text-slate-900 capitalize">{profile?.role}</span>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-slate-500 mb-1">Permissions</p>
            <p className="text-sm text-slate-700">{roleDescriptions[profile?.role || 'viewer']}</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-4 text-center">To change your role, contact an administrator.</p>
    </div>
  )
}
