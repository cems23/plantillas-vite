import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { fillVariables } from '../lib/utils'
import type { Template } from '../types'
import toast from 'react-hot-toast'

const LANGS = [
  { code: 'es', flag: '🇪🇸', label: 'Spanish' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'fr', flag: '🇫🇷', label: 'French' },
  { code: 'de', flag: '🇩🇪', label: 'German' },
  { code: 'it', flag: '🇮🇹', label: 'Italian' },
]

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
  const [activeLang, setActiveLang] = useState('es')
  const [varValues, setVarValues] = useState<Record<string, string>>({})

  useEffect(() => {
    supabase.from('templates')
      .select('id,title,content,content_es,content_en,content_fr,content_de,content_it,language,tags,shortcut,variables,use_count,updated_at,category:categories(*)')
      .eq('id', id!).single()
      .then(({ data }) => {
        setTemplate(data)
        if (data?.variables) setVarValues(Object.fromEntries(data.variables.map((v: string) => [v, ''])))
        // Set active lang to the first one that has content
        if (data) {
          const first = LANGS.find(l => !!(data as any)['content_' + l.code])
          if (first) setActiveLang(first.code)
        }
        setLoading(false)
      })
  }, [id])

  function getContent() {
    if (!template) return ''
    const key = 'content_' + activeLang
    return (template as any)[key] || template.content || ''
  }

  async function handleCopy() {
    const content = fillVariables(getContent(), varValues)
    try { await navigator.clipboard.writeText(content) } catch {
      const el = document.createElement('textarea'); el.value = content; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2500)
    supabase.from('templates').update({ use_count: (template!.use_count || 0) + 1 }).eq('id', id!).then()
  }

  async function handleDelete() {
    if (!confirm(`Delete "${template?.title}"?`)) return
    setDeleting(true)
    const { error } = await supabase.from('templates').update({ is_active: false }).eq('id', id!)
    if (error) { toast.error('Error deleting'); setDeleting(false); return }
    toast.success('Template deleted')
    navigate('/')
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!template) return <div className="text-center py-20 text-slate-500">Template not found</div>

  const previewContent = fillVariables(getContent(), varValues)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-[#8896b3] hover:text-[#0d1f3c] dark:hover:text-white hover:bg-blue-50 dark:hover:bg-white/5 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0d1f3c] dark:text-white tracking-tight">{template.title}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {template.shortcut && (
                <span className="text-xs font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-md font-bold">
                  {template.shortcut}
                </span>
              )}
              <span className="text-xs text-[#8896b3] dark:text-slate-500 font-semibold">{template.use_count || 0} uses</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <button
              onClick={() => navigate(`/templates/${id}/edit`)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-[#4a5878] dark:text-slate-400 border border-blue-100 dark:border-white/8 rounded-xl hover:bg-blue-50 dark:hover:bg-white/5 transition-all"
            >
              <Pencil className="w-4 h-4" />Edit
            </button>
          )}
          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-red-600 border border-red-200 dark:border-red-900/30 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 disabled:opacity-50 transition-all"
            >
              <Trash2 className="w-4 h-4" />{deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Language tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {LANGS.map(l => {
              const hasContent = !!(template as any)['content_' + l.code]
              if (!hasContent) return null
              return (
                <button
                  key={l.code}
                  onClick={() => setActiveLang(l.code)}
                  className={"flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border " +
                    (activeLang === l.code
                      ? 'grad-btn text-white border-transparent shadow-sm'
                      : 'bg-white dark:bg-[#0d1829] text-[#4a5878] dark:text-slate-400 border-blue-100 dark:border-white/8 hover:border-blue-400')}
                >
                  {l.flag} {l.label}
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-[#0d1829] rounded-2xl border border-blue-100 dark:border-white/8 p-6">
            <pre className="text-sm text-[#0d1f3c] dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans font-medium">{previewContent}</pre>
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${copied ? 'bg-teal-500 text-white' : 'grad-btn text-white'}`}
          >
            {copied ? <><Check className="w-5 h-5" />Copied!</> : <><Copy className="w-5 h-5" />Copy template</>}
          </button>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {template.variables?.length > 0 && (
            <div className="bg-white dark:bg-[#0d1829] rounded-2xl border border-blue-100 dark:border-white/8 p-4">
              <h3 className="text-sm font-extrabold text-[#0d1f3c] dark:text-white mb-3">Variables</h3>
              <div className="space-y-2">
                {template.variables.map(v => (
                  <div key={v}>
                    <label className="block text-xs font-mono text-amber-600 dark:text-amber-400 mb-1 font-bold">{'{' + v + '}'}</label>
                    <input
                      type="text"
                      value={varValues[v] || ''}
                      onChange={e => setVarValues(p => ({ ...p, [v]: e.target.value }))}
                      placeholder={v}
                      className="w-full border border-blue-100 dark:border-white/8 rounded-lg px-2.5 py-1.5 text-sm bg-blue-50/40 dark:bg-[#080f1e] text-[#0d1f3c] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-[#0d1829] rounded-2xl border border-blue-100 dark:border-white/8 p-4">
            <h3 className="text-sm font-extrabold text-[#0d1f3c] dark:text-white mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-[#8896b3] dark:text-slate-500 font-bold uppercase tracking-wider">Updated</dt>
                <dd className="text-[#4a5878] dark:text-slate-300 font-semibold mt-0.5">
                  {new Date(template.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </dd>
              </div>
            </dl>
          </div>

          {template.tags?.length > 0 && (
            <div className="bg-white dark:bg-[#0d1829] rounded-2xl border border-blue-100 dark:border-white/8 p-4">
              <h3 className="text-sm font-extrabold text-[#0d1f3c] dark:text-white mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {template.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
