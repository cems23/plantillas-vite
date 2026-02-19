import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { AuditLog } from '../types'

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  COPY: 'bg-slate-100 text-slate-600',
  IMPORT: 'bg-purple-100 text-purple-700',
  TRANSLATE: 'bg-orange-100 text-orange-700',
}

export function AdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => { setLogs(data || []); setLoading(false) })
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Historial de auditoría</h1>
        <p className="text-slate-500 text-sm mt-1">Registro de todas las acciones</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Cuándo', 'Usuario', 'Acción', 'Plantilla'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-5 py-3 text-sm text-slate-600">{log.user_email?.split('@')[0] || 'Sistema'}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${actionColors[log.action] || 'bg-slate-100 text-slate-600'}`}>{log.action}</span>
                </td>
                <td className="px-5 py-3 text-sm text-slate-700 max-w-xs truncate">{log.entity_title || log.entity_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div className="text-center py-12 text-slate-400">No hay registros todavía</div>}
      </div>
    </div>
  )
}
