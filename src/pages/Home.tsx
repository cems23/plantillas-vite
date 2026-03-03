import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, FileText, Search, X, Tag, Zap, Copy, Check, Eye, Pencil, EyeOff, Pin, PinOff, Trash2, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useApp } from '../lib/AppContext'
import { fillVariables } from '../lib/utils'
import type { Template } from '../types'
import toast from 'react-hot-toast'

const LANGS = [
  { code: 'ES', field: 'content_es', flag: '🇪🇸', label: 'Spanish' },
  { code: 'EN', field: 'content_en', flag: '🇬🇧', label: 'English' },
  { code: 'FR', field: 'content_fr', flag: '🇫🇷', label: 'French' },
  { code: 'DE', field: 'content_de', flag: '🇩🇪', label: 'German' },
  { code: 'IT', field: 'content_it', flag: '🇮🇹', label: 'Italian' },
]

function getUserData(userId: string) {
  try { return JSON.parse(localStorage.getItem('userdata_' + userId) || '{}') } catch { return {} }
}
function saveUserData(userId: string, data: any) {
  localStorage.setItem('userdata_' + userId, JSON.stringify(data))
}

// ── Preview Drawer ──────────────────────────────────────────────────────────
function PreviewDrawer({ template, initialLang, onClose, onEdit }: {
  template: any
  initialLang: string
  onClose: () => void
  onEdit: () => void
}) {
  const navigate = useNavigate()
  const [activeLang, setActiveLang] = useState(initialLang)
  const [copied, setCopied] = useState(false)
  const [varValues, setVarValues] = useState<Record<string, string>>(
    Object.fromEntries((template.variables || []).map((v: string) => [v, '']))
  )

  function getContent() {
    const key = 'content_' + activeLang.toLowerCase()
    return template[key] || template.content || ''
  }

  const preview = fillVariables(getContent(), varValues)

  async function handleCopy() {
    try { await navigator.clipboard.writeText(preview) } catch {
      const el = document.createElement('textarea')
      el.value = preview; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
    supabase.from('templates').update({ use_count: (template.use_count || 0) + 1 }).eq('id', template.id).then()
  }

  const availableLangs = LANGS.filter(l => !!(template['content_' + l.code.toLowerCase()]))

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-[#0d1829] z-50 shadow-2xl flex flex-col"
        style={{ animation: 'slideIn 0.25s ease-out' }}>

        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-blue-50 dark:border-white/5">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg font-extrabold text-[#0d1f3c] dark:text-white truncate">{template.title}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {template.shortcut && (
                <span className="text-xs font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-md font-bold">
                  {template.shortcut}
                </span>
              )}
              {template.tags?.slice(0, 3).map((tag: string) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8896b3] hover:text-[#0d1f3c] dark:hover:text-white hover:bg-blue-50 dark:hover:bg-white/5 transition-all flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language tabs */}
        {availableLangs.length > 0 && (
          <div className="flex gap-1.5 px-6 pt-4 flex-wrap">
            {availableLangs.map(l => (
              <button
                key={l.code}
                onClick={() => setActiveLang(l.code)}
                className={"flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border " +
                  (activeLang === l.code
                    ? 'grad-btn text-white border-transparent shadow-sm'
                    : 'bg-blue-50/50 dark:bg-white/5 text-[#4a5878] dark:text-slate-400 border-blue-100 dark:border-white/8 hover:border-blue-400')}
              >
                {l.flag} {l.label}
              </button>
            ))}
          </div>
        )}

        {/* Variables */}
        {template.variables?.length > 0 && (
          <div className="px-6 pt-4 space-y-2">
            <p className="text-xs font-extrabold text-[#8896b3] uppercase tracking-wider">Variables</p>
            <div className="flex flex-wrap gap-2">
              {template.variables.map((v: string) => (
                <div key={v} className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">{'{' + v + '}'}</span>
                  <input
                    type="text"
                    value={varValues[v] || ''}
                    onChange={e => setVarValues(p => ({ ...p, [v]: e.target.value }))}
                    placeholder={v}
                    className="border border-blue-100 dark:border-white/10 rounded-lg px-2 py-1 text-xs bg-blue-50/40 dark:bg-[#080f1e] text-[#0d1f3c] dark:text-white w-28 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-2">
          <div className="bg-blue-50/40 dark:bg-[#080f1e] rounded-2xl border border-blue-100 dark:border-white/5 p-5 min-h-full">
            <pre className="text-sm text-[#0d1f3c] dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans font-medium">
              {preview || <span className="text-[#8896b3] italic">No content for this language yet</span>}
            </pre>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-blue-50 dark:border-white/5 flex gap-3">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#4a5878] dark:text-slate-400 border border-blue-100 dark:border-white/8 hover:bg-blue-50 dark:hover:bg-white/5 transition-all"
          >
            <Pencil className="w-4 h-4" />Edit
          </button>
          <button
            onClick={handleCopy}
            className={"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all " +
              (copied ? 'bg-teal-500 text-white' : 'grad-btn text-white')}
          >
            {copied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Main Home ───────────────────────────────────────────────────────────────
export function Home() {
  const { profile } = useAuth()
  const { pinnedIds, togglePin, isPinned } = useApp()
  const navigate = useNavigate()

  const [templates, setTemplates] = useState<Template[]>([])
  const [userData, setUserData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState<string>('ALL')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [preview, setPreview] = useState<{ template: any; lang: string } | null>(null)

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase
        .from('templates')
        .select('id,title,content,content_es,content_en,content_fr,content_de,content_it,language,tags,shortcut,variables,use_count,category_id,is_active,updated_at,created_by,category:categories(id,name)')
        .eq('is_active', true)
        .eq('owner_id', profile?.id)
        .order('updated_at', { ascending: false })
      setTemplates(t || [])
      setUserData(getUserData(profile?.id || ''))
      setLoading(false)
    }
    load()
  }, [profile?.id])

  function refreshUserData() {
    setUserData(getUserData(profile?.id || ''))
  }

  const hideTemplate = useCallback((id: string) => {
    const data = getUserData(profile?.id || '')
    data[id] = { ...(data[id] || {}), hidden: true }
    saveUserData(profile?.id || '', data)
    refreshUserData()
    toast.success('Template hidden')
  }, [profile?.id])

  const deleteTemplate = useCallback((id: string) => {
    const data = getUserData(profile?.id || '')
    data[id] = { ...(data[id] || {}), deleted: true }
    saveUserData(profile?.id || '', data)
    refreshUserData()
    toast.success('Template removed')
  }, [profile?.id])

  const unhideAll = () => {
    const data = getUserData(profile?.id || '')
    Object.keys(data).forEach(id => { if (data[id]) { delete data[id].hidden; delete data[id].deleted } })
    saveUserData(profile?.id || '', data)
    refreshUserData()
    toast.success('All templates restored')
  }

  const mergedTemplates = useMemo(() => templates.map(t => {
    const local = userData[t.id]
    if (!local?.localEdit) return t
    return { ...t, ...local.localEdit }
  }), [templates, userData])

  const hiddenCount = useMemo(() => Object.values(userData).filter((d: any) => d?.hidden || d?.deleted).length, [userData])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    mergedTemplates.forEach(t => t.tags?.forEach((tag: string) => set.add(tag)))
    return Array.from(set).sort()
  }, [mergedTemplates])

  const filtered = useMemo(() => {
    const visible = mergedTemplates.filter(t => {
      const local = userData[t.id]
      if (local?.hidden || local?.deleted) return false
      if (language !== 'ALL' && t.language !== language) return false
      if (selectedTags.length > 0 && !selectedTags.every(tag => t.tags?.includes(tag))) return false
      if (search) {
        const q = search.toLowerCase()
        if (!t.title.toLowerCase().includes(q) && !t.content?.toLowerCase().includes(q) && !t.shortcut?.toLowerCase().includes(q) && !t.tags?.some((tag: string) => tag.toLowerCase().includes(q))) return false
      }
      return true
    })
    return [...visible.filter(t => isPinned(t.id)), ...visible.filter(t => !isPinned(t.id))]
  }, [mergedTemplates, userData, pinnedIds, search, language, selectedTags])

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-7 h-7 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight grad-text">Templates</h1>
          <p className="text-[#4a5878] dark:text-slate-500 text-sm mt-1.5 font-semibold">
            {filtered.length} {filtered.length === 1 ? 'template' : 'templates'}
            {hiddenCount > 0 && (
              <button onClick={unhideAll} className="ml-2 text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors">
                restore {hiddenCount} hidden
              </button>
            )}
          </p>
        </div>
        <button onClick={() => navigate('/templates/new')} className="grad-btn flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-bold">
          <PlusCircle className="w-4 h-4" />New template
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8896b3] dark:text-slate-600" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
          className="w-full pl-11 pr-10 py-3 bg-white dark:bg-[#0d1829] border border-blue-100 dark:border-white/6 rounded-xl text-sm text-[#0d1f3c] dark:text-slate-200 placeholder-[#8896b3] dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm font-medium" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8896b3] hover:text-[#0d1f3c]"><X className="w-4 h-4" /></button>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <select value={language} onChange={e => setLanguage(e.target.value)}
          className="text-xs font-bold border border-blue-100 dark:border-white/6 rounded-lg px-3 py-1.5 bg-white dark:bg-[#0d1829] text-[#4a5878] dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer">
          <option value="ALL">All languages</option>
          {LANGS.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
        </select>
        {allTags.slice(0, 15).map(tag => {
          const isSelected = selectedTags.includes(tag)
          return (
            <button key={tag} onClick={() => setSelectedTags(prev => isSelected ? prev.filter(t => t !== tag) : [...prev, tag])}
              className={"text-xs px-3 py-1.5 rounded-lg border font-bold transition-all " +
                (isSelected ? 'grad-btn text-white border-transparent' : 'bg-white dark:bg-[#0d1829] text-[#4a5878] dark:text-slate-400 border-blue-100 dark:border-white/6 hover:border-blue-400 hover:text-blue-600')}>
              {tag}
            </button>
          )
        })}
        {(search || language !== 'ALL' || selectedTags.length > 0) && (
          <button onClick={() => { setSearch(''); setLanguage('ALL'); setSelectedTags([]) }}
            className="text-xs text-[#8896b3] hover:text-red-500 flex items-center gap-1 px-2 font-semibold">
            <X className="w-3 h-3" />Clear
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-32">
          <div className="w-16 h-16 rounded-2xl grad-btn flex items-center justify-center mx-auto mb-5 opacity-40">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <p className="text-[#4a5878] dark:text-slate-600 font-semibold">No templates found</p>
          <button onClick={() => navigate('/templates/new')} className="text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2 mt-2 font-semibold">Create the first one</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 card-grid">
          {filtered.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              pinned={isPinned(template.id)}
              onPreview={(lang) => setPreview({ template, lang })}
              onEdit={() => navigate('/templates/' + template.id + '/edit')}
              onHide={() => hideTemplate(template.id)}
              onDelete={() => deleteTemplate(template.id)}
              onTogglePin={() => togglePin(template.id)}
            />
          ))}
        </div>
      )}

      {/* Preview Drawer */}
      {preview && (
        <PreviewDrawer
          template={preview.template}
          initialLang={preview.lang}
          onClose={() => setPreview(null)}
          onEdit={() => { navigate('/templates/' + preview.template.id + '/edit?lang=' + preview.lang.toLowerCase()); setPreview(null) }}
        />
      )}
    </div>
  )
}

// ── Template Card ───────────────────────────────────────────────────────────
const TemplateCard = memo(function TemplateCard({ template, pinned, onPreview, onEdit, onHide, onDelete, onTogglePin }: {
  template: any; pinned: boolean
  onPreview: (lang: string) => void
  onEdit: () => void; onHide: () => void; onDelete: () => void; onTogglePin: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [activeLang, setActiveLang] = useState<string>(template.language || 'ES')
  const [confirmDelete, setConfirmDelete] = useState(false)

  function getContent() {
    const key = 'content_' + activeLang.toLowerCase()
    return template[key] || template.content
  }

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    const content = getContent()
    try { await navigator.clipboard.writeText(content) } catch {
      const el = document.createElement('textarea')
      el.value = content; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
    supabase.from('templates').update({ use_count: (template.use_count || 0) + 1 }).eq('id', template.id).then()
  }

  function switchLang(e: React.MouseEvent, langCode: string) {
    e.stopPropagation()
    const key = 'content_' + langCode.toLowerCase()
    if (template[key] || langCode === template.language) setActiveLang(langCode)
  }

  const displayContent = getContent()
  const preview = displayContent?.length > 120 ? displayContent.substring(0, 120) + '...' : displayContent

  return (
    <div className={"bg-white dark:bg-[#0d1829] rounded-2xl border p-5 flex flex-col gap-3.5 card-hover " +
      (pinned ? 'border-blue-400 dark:border-blue-500 shadow-md shadow-blue-100 dark:shadow-blue-900/20' : 'border-blue-100 dark:border-white/5')}>

      {/* Title row */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onPreview(activeLang)}>
          <div className="flex items-center gap-2 mb-0.5">
            {pinned && <Pin className="w-3 h-3 text-blue-500 flex-shrink-0" />}
            <h3 className="font-extrabold text-[#0d1f3c] dark:text-white truncate text-[15px] hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{template.title}</h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            {template.shortcut && (
              <span className="text-xs font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-md flex items-center gap-1 font-bold">
                <Zap className="w-2.5 h-2.5" />{template.shortcut}
              </span>
            )}
          </div>
        </div>
        <button onClick={handleCopy}
          className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 " +
            (copied ? 'bg-teal-500 text-white' : 'grad-btn text-white')}>
          {copied ? <><Check className="w-3.5 h-3.5" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
        </button>
      </div>

      {/* Language flags */}
      <div className="flex items-center gap-0.5">
        {LANGS.map(l => {
          const key = 'content_' + l.code.toLowerCase()
          const hasContent = !!(template[key])
          const isActive = activeLang === l.code
          return (
            <button key={l.code} onClick={e => switchLang(e, l.code)} disabled={!hasContent && l.code !== template.language} title={l.label}
              className={"text-base leading-none p-1 rounded-lg transition-all " +
                (isActive ? 'bg-blue-100 dark:bg-blue-900/30 scale-110 ring-2 ring-blue-300 dark:ring-blue-700'
                  : hasContent ? 'opacity-70 hover:opacity-100 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  : 'opacity-15 cursor-not-allowed')}>
              {l.flag}
            </button>
          )
        })}
      </div>

      {/* Preview text — click opens drawer */}
      <p onClick={() => onPreview(activeLang)}
        className="text-sm text-[#4a5878] dark:text-slate-400 leading-relaxed whitespace-pre-line flex-1 line-clamp-4 font-medium cursor-pointer hover:text-[#0d1f3c] dark:hover:text-slate-200 transition-colors">
        {preview}
      </p>

      {/* Variables */}
      {template.variables?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {template.variables.map((v: string) => (
            <span key={v} className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 px-1.5 py-0.5 rounded-md font-mono font-bold">
              {'{' + v + '}'}
            </span>
          ))}
        </div>
      )}

      {/* Tags */}
      {template.tags?.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="w-3 h-3 text-blue-200 dark:text-slate-700 flex-shrink-0" />
          {template.tags.slice(0, 5).map((tag: string) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold">{tag}</span>
          ))}
          {template.tags.length > 5 && <span className="text-xs text-[#8896b3] font-semibold">+{template.tags.length - 5}</span>}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-0.5 pt-3 border-t border-blue-50 dark:border-white/5">
        <button onClick={() => onPreview(activeLang)}
          className="flex items-center gap-1.5 text-xs text-[#8896b3] dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors px-2 py-1.5 rounded-lg font-semibold">
          <Eye className="w-3 h-3" />View
        </button>
        <button onClick={onEdit}
          className="flex items-center gap-1.5 text-xs text-[#8896b3] dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors px-2 py-1.5 rounded-lg font-semibold">
          <Pencil className="w-3 h-3" />Edit
        </button>
        <button onClick={e => { e.stopPropagation(); onTogglePin() }}
          className={"flex items-center gap-1.5 text-xs transition-colors px-2 py-1.5 rounded-lg font-semibold " +
            (pinned ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10' : 'text-[#8896b3] dark:text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10')}>
          {pinned ? <><PinOff className="w-3 h-3" />Unpin</> : <><Pin className="w-3 h-3" />Pin</>}
        </button>
        <button onClick={e => { e.stopPropagation(); onHide() }}
          className="flex items-center gap-1.5 text-xs text-[#8896b3] dark:text-slate-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors px-2 py-1.5 rounded-lg font-semibold">
          <EyeOff className="w-3 h-3" />Hide
        </button>
        <div className="ml-auto">
          {confirmDelete
            ? <span className="flex items-center gap-1">
                <button onClick={e => { e.stopPropagation(); onDelete() }} className="text-xs text-red-600 font-bold px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10">Confirm</button>
                <button onClick={e => { e.stopPropagation(); setConfirmDelete(false) }} className="text-xs text-[#8896b3] px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 font-semibold">Cancel</button>
              </span>
            : <button onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
                className="flex items-center gap-1.5 text-xs text-[#8896b3] dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors px-2 py-1.5 rounded-lg font-semibold">
                <Trash2 className="w-3 h-3" />Delete
              </button>
          }
        </div>
      </div>
    </div>
  )
})
