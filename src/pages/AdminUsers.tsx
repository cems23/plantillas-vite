import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import type { Profile, UserRole } from '../types'
import toast from 'react-hot-toast'

const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700',
  editor: 'bg-indigo-100 text-indigo-700',
  viewer: 'bg-slate-100 text-slate-600',
}

export function AdminUsers() {
  const { profile: me } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setUsers(data || []); setLoading(false) })
  }, [])

  async function updateRole(userId: string, role: UserRole) {
    if (userId === me?.id) { toast.error('No puedes cambiar tu propio rol'); return }
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (error) { toast.error('Error al actualizar'); return }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    toast.success('Rol actualizado')
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
        <p className="text-slate-500 text-sm mt-1">Gestiona los roles del equipo</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Usuario', 'Email', 'Rol', 'Desde'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    {user.avatar_url
                      ? <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                      : <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">{(user.full_name?.[0] || user.email[0]).toUpperCase()}</div>
                    }
                    <span className="text-sm font-medium text-slate-900">{user.full_name || 'Sin nombre'}{user.id === me?.id && <span className="ml-1 text-xs text-slate-400">(tú)</span>}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-slate-500">{user.email}</td>
                <td className="px-5 py-3">
                  {user.id === me?.id
                    ? <span className={`text-xs font-semibold px-2 py-1 rounded-full ${roleColors[user.role]}`}>{user.role}</span>
                    : <select value={user.role} onChange={e => updateRole(user.id, e.target.value as UserRole)} className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${roleColors[user.role]}`}>
                        {(['admin', 'editor', 'viewer'] as UserRole[]).map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                  }
                </td>
                <td className="px-5 py-3 text-sm text-slate-400">{new Date(user.created_at).toLocaleDateString('es-ES')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
