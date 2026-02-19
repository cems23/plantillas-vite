import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, FileText, Search, X, Tag, Zap, Copy, Check, Eye, Pencil } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { fillVariables, extractVariables } from '../lib/utils'
import type { Template, Category } from '../types'
import toast from 'react-hot-toast'

export function Home() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const canEdit = profile?.role === 'admin' || profile?.role === 'editor'

  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState<'ALL' | 'ES' | 'EN'>('ALL')
  const [categoryId, setCategoryId] = useState('ALL')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: c }] = await Promise.all([
        supabase.from('templates').select('*, category:categories(*)').eq('is_active', true).order('updated_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ])
      setTemplates(t || [])
      setCategories(c || [])
      setLoading(false)
    }
    load()
  }, [])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    templates.forEach(t => t.tags?.forEach(tag => set.add(tag)))
    return Array.from(set).sort()
  }, [templates])

  const filtered = useMemo(() => {
    return templates.filter(t => {
      if (search) {
        const q = search.toLowerCase()
        if (!t.title.toLowerCase().includes(q) && !t.content.toLowerCase().includes(q) && !t.shortcut?.toLowerCase().includes(q) && !t.tags?.some(tag => tag.toLowerCase().includes(q))) return false
      }
      if (language !== 'ALL' && t.language !== language) return false
      if (categoryId !== 'ALL' && t.category_id !== categoryId) return false
      if (selectedTags.length > 0 && !selectedTags.every(tag => t.tags?.includes(tag))) return false
      return true
    })
  }, [templates, search, language, categoryId, selectedTags])

  function toggleTag(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plantillas</h1>
          <p className="text-slate-500 text-sm mt-0.5">{filtered.length} de {templates.length} plantillas</p>
        </div>
        {canEdit && (
          <button onClick={() => navigate('/templates/new')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
            <PlusCircle className="w-4 h-4" />Nueva plantilla
          </button>
        )}
      </div>

      {/* Búsqueda */}
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por título, contenido, /shortcut..."
          className="w-full pl-10 pr-9 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <select value={language} onChange={e => setLanguage(e.target.value as any)} className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="ALL">Todos los idiomas</option>
          <option value="ES">🇪🇸 Español</option>
          <option value="EN">🇬🇧 English</option>
        </select>
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="ALL">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {allTags.slice(0, 10).map(tag => (
          <button key={tag} onClick={() => toggleTag(tag)} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selectedTags.includes(tag) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
            {tag}
          </button>
        ))}
        {(search || language !== 'ALL' || categoryId !== 'ALL' || selectedTags.length > 0) && (
          <button onClick={() => { setSearch(''); setLanguage('ALL'); setCategoryId('ALL'); setSelectedTags([]) }} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 px-2">
            <X className="w-3 h-3" />Limpiar
          </button>
        )}
      </div>

      {/* Grid de plantillas */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500">No se encontraron plantillas</p>
          {canEdit && !search && <button onClick={() => navigate('/templates/new')} className="text-sm text-indigo-600 hover:text-indigo-800 mt-2">Crear la primera →</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(template => (
            <TemplateCard key={template.id} template={template} canEdit={canEdit} onEdit={() => navigate(`/templates/${template.id}/edit`)} onView={() => navigate(`/templates/${template.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

function TemplateCard({ template, canEdit, onEdit, onView }: { template: Template; canEdit?: boolean; onEdit: () => void; onView: () => void }) {
  const [copied, setCopied] = useState(false)
  const [showModal, setShowModal] = useState(false)

  async function handleCopy() {
    if (template.variables?.length > 0) { setShowModal(true); return }
    await doCopy(template.content)
  }

  async function doCopy(content: string) {
    try { await navigator.clipboard.writeText(content) } catch {
      const el = document.createElement('textarea')
      el.value = content; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true)
    toast.success('¡Copiado al portapapeles!')
    setTimeout(() => setCopied(false), 2500)
    supabase.from('templates').update({ use_count: (template.use_count || 0) + 1 }).eq('id', template.id).then()
  }

  const preview = template.content.length > 160 ? template.content.substring(0, 160) + '...' : template.content

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3 hover:border-indigo-200 hover:shadow-md transition-all fade-in">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate cursor-pointer hover:text-indigo-600" onClick={onView}>{template.title}</h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${template.language === 'ES' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{template.language}</span>
              {template.category && <span className="text-xs text-slate-400">{template.category.name}</span>}
              {template.shortcut && <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" />{template.shortcut}</span>}
            </div>
          </div>
          <button onClick={handleCopy} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${copied ? 'bg-green-100 text-green-700' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
            {copied ? <><Check className="w-3.5 h-3.5" />Copiado</> : <><Copy className="w-3.5 h-3.5" />Copiar</>}
          </button>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line flex-1">{preview}</p>

        {template.variables?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.variables.map(v => <span key={v} className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded font-mono">{'{' + v + '}'}</span>)}
          </div>
        )}

        {template.tags?.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Tag className="w-3 h-3 text-slate-300" />
            {template.tags.slice(0, 4).map(tag => <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{tag}</span>)}
            {template.tags.length > 4 && <span className="text-xs text-slate-400">+{template.tags.length - 4}</span>}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          <button onClick={onView} className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors"><Eye className="w-3 h-3" />Ver</button>
          {canEdit && <button onClick={onEdit} className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors"><Pencil className="w-3 h-3" />Editar</button>}
          <span className="text-xs text-slate-300 ml-auto">{template.use_count || 0} usos</span>
        </div>
      </div>

      {showModal && (
        <VariableModal template={template} onCopy={async c => { await doCopy(c); setShowModal(false) }} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}

function VariableModal({ template, onCopy, onClose }: { template: Template; onCopy: (c: string) => Promise<void>; onClose: () => void }) {
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(template.variables.map(v => [v, ''])))
  const preview = fillVariables(template.content, values)

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg fade-in">
        <div className="p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Personalizar plantilla</h2>
          <p className="text-sm text-slate-500 mb-5">Rellena los campos para personalizar el mensaje</p>
          <div className="space-y-3 mb-5">
            {template.variables.map(v => (
              <div key={v}>
                <label className="block text-xs font-mono text-yellow-700 mb-1">{'{' + v + '}'}</label>
                <input type="text" value={values[v]} onChange={e => setValues(p => ({ ...p, [v]: e.target.value }))} placeholder={`Escribe ${v}...`} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-xl p-4 mb-5 max-h-36 overflow-y-auto">
            <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Vista previa</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{preview}</p>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancelar</button>
            <button onClick={() => onCopy(preview)} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">
              <Copy className="w-4 h-4" />Copiar personalizado
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
