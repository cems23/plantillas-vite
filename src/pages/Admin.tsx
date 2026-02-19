import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Users, Clock, Upload, FileText, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function Admin() {
  const [stats, setStats] = useState({ templates: 0, users: 0, copies: 0 })

  useEffect(() => {
    async function load() {
      const [{ count: t }, { count: u }, { count: c }] = await Promise.all([
        supabase.from('templates').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('audit_log').select('*', { count: 'exact', head: true }).eq('action', 'COPY'),
      ])
      setStats({ templates: t || 0, users: u || 0, copies: c || 0 })
    }
    load()
  }, [])

  const cards = [
    { label: 'Plantillas activas', value: stats.templates, icon: FileText },
    { label: 'Usuarios', value: stats.users, icon: Users },
    { label: 'Copias realizadas', value: stats.copies, icon: TrendingUp },
  ]

  const links = [
    { to: '/admin/users', label: 'Gestionar usuarios', desc: 'Cambiar roles y permisos', icon: Users },
    { to: '/admin/audit', label: 'Historial de auditoría', desc: 'Ver todos los cambios', icon: Clock },
    { to: '/admin/import', label: 'Importar desde Keep', desc: 'Importar plantillas masivamente', icon: Upload },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Panel de administración</h1>
        <p className="text-slate-500 text-sm mt-1">Gestiona usuarios y configuración</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <card.icon className="w-5 h-5 text-slate-400 mb-3" />
            <p className="text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {links.map(link => (
          <Link key={link.to} to={link.to} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all flex items-start gap-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <link.icon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{link.label}</p>
              <p className="text-sm text-slate-500 mt-0.5">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
