import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { fillVariables } from '../lib/utils'
import type { Template } from '../types'
import toast from 'react-hot-toast'

export function TemplateDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const canEdit = profile?.role === 'admin' || profile?.role === 'editor'
  const isAdmin = profile?.role === 'admin'

  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [varValues, setVarValues] = useState<Record<string, string>>({})

  useEffect(() => {
    supabase.from('templates').select('*, category:categories(*)').eq('id', id!).single()
      .then(({ data }) => {
        setTemplate(data)
        if (data?.variables) setVarValues(Object.fromEntries(data.variables.map((v: string) => [v, ''])))
        setLoading(false)
      })
  }, [id])

  async function handleCopy() {
    const content = fillVariables(template!.content, varValues)
    try { await navigator.clipboard.writeText(content) } catch {
      const el = document.createElement('textarea'); el.value = content; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2500)
    supabase.from('templates').update({ use_count: (template!.use_count || 0) + 1 }).eq('id', id!).then()
  }

  async function handleDelete() {
    if (!confirm(`¿Delete "${template?.title}"?`)) return
    setDeleting(true)
    const { error } = await supabase.from('templates').update({ is_active: false }).eq('id', id!)
    if (error) { toast.error('Error deleting'); setDeleting(false); return }
    toast.success('Template deleted')
    navigate('/')
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
  if (!template) return <div className="text-center py-20 text-slate-500">Template not found</div>

  const previewContent = fillVariables(template.content, varValues)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{template.title}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${template.language === 'ES' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{template.language}</span>
              {template.category && <span className="text-xs text-slate-500">{template.category.name}</span>}
              {template.shortcut && <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{template.shortcut}</span>}
              <span className="text-xs text-slate-400">{template.use_count || 0} uses</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && <button onClick={() => navigate(`/templates/${id}/edit`)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"><Pencil className="w-4 h-4" />Edit</button>}
          {isAdmin && <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"><Trash2 className="w-4 h-4" />{deleting ? 'Deleting...' : 'Delete'}</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <pre className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">{previewContent}</pre>
          </div>
          <button onClick={handleCopy} className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${copied ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
            {copied ? <><Check className="w-5 h-5" />Copied!</> : <><Copy className="w-5 h-5" />Copy template</>}
          </button>
        </div>

        <div className="space-y-4">
          {template.variables?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Variables</h3>
              <div className="space-y-2">
                {template.variables.map(v => (
                  <div key={v}>
                    <label className="block text-xs font-mono text-yellow-700 mb-1">{'{' + v + '}'}</label>
                    <input type="text" value={varValues[v] || ''} onChange={e => setVarValues(p => ({ ...p, [v]: e.target.value }))} placeholder={v} className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-xs text-slate-400">Updated</dt><dd className="text-slate-700">{new Date(template.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</dd></div>
            </dl>
          </div>

          {template.tags?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {template.tags.map(tag => <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{tag}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
