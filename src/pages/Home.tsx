import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlusCircle, FileText, Search, X, Tag, Zap, Copy, Check,
  Eye, Pencil, EyeOff, Pin, PinOff, Trash2, Star, LayoutGrid,
  List, Rows3, Download, CopyPlus
} from 'lucide-react'
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

// ── Shortcut listener ────────────────────────────────────────────────────────
function useShortcutListener(templates: any[], onCopied: (title: string) => void) {
  const bufferRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'Backspace') { bufferRef.current = bufferRef.current.slice(0, -1); return }
      if (e.key.length > 1) return

      bufferRef.current += e.key
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => { bufferRef.current = '' }, 1200)

      const buf = bufferRef.current
      if (!buf.startsWith('/')) return

      const match = templates.find(t => t.shortcut && t.shortcut.toLowerCase() === buf.toLowerCase())
      if (match) {
        const content = match.content_es || match.content_en || match.content_fr || match.content_de || match.content_it || match.content
        navigator.clipboard.writeText(content).catch(() => {
          const el = document.createElement('textarea'); el.value = content
          document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
        })
        onCopied(match.title)
        bufferRef.current = ''
        clearTimeout(timerRef.current)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [templates, onCopied])
}

// ── Preview Drawer ────────────────────────────────────────────────────────────
function PreviewDrawer({ template, initialLang, onClose, onEdit, onDuplicate }: {
  template: any; initialLang: string
  onClose: () => void; onEdit: () => void; onDuplicate: () => void
}) {
  const [activeLang, setActiveLang] = useState(initialLang)
  const [copied, setCopied] = useState(false)
  const [varValues, setVarValues] = useState<Record<string, string>>(
    Object.fromEntries((template.variables || []).map((v: string) => [v, '']))
  )
  const preview = fillVariables((template['content_' + activeLang.toLowerCase()] || template.content || ''), varValues)
  const availableLangs = LANGS.filter(l => !!(template['content_' + l.code.toLowerCase()]))

  async function handleCopy() {
    try { await navigator.clipboard.writeText(preview) } catch {
      const el = document.createElement('textarea'); el.value = preview
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true); toast.success('Copied!'); setTimeout(() => setCopied(false), 2000)
    supabase.from('templates').update({ use_count: (template.use_count || 0) + 1 }).eq('id', template.id).then()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-[#0d1829] z-50 shadow-2xl flex flex-col"
        style={{ animation: 'slideIn 0.25s ease-out' }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity:0 } to { transform: translateX(0); opacity:1 } }`}</style>

        <div className="flex items-start justify-between p-6 border-b border-blue-50 dark:border-white/5">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg font-extrabold text-[#0d1f3c] dark:text-white truncate">{template.title}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {template.shortcut && <span className="text-xs font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-md font-bold">{template.shortcut}</span>}
              {template.tags?.slice(0, 3).map((tag: string) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold">{tag}</span>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[#8896b3] hover:text-[#0d1f3c] dark:hover:text-white hover:bg-blue-50 dark:hover:bg-white/5 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {availableLangs.length > 0 && (
          <div className="flex gap-1.5 px-6 pt-4 flex-wrap">
            {availableLangs.map(l => (
              <button key={l.code} onClick={() => setActiveLang(l.code)}
                className={"flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border " +
                  (activeLang === l.code ? 'grad-btn text-white border-transparent shadow-sm' : 'bg-blue-50/50 dark:bg-white/5 text-[#4a5878] dark:text-slate-400 border-blue-100 dark:border-white/8 hover:border-blue-400')}>
                {l.flag} {l.label}
              </button>
            ))}
          </div>
        )}

        {template.variables?.length > 0 && (
          <div className="px-6 pt-4 space-y-2">
            <p className="text-xs font-extrabold text-[#8896b3] uppercase tracking-wider">Variables</p>
            <div className="flex flex-wrap gap-2">
              {template.variables.map((v: string) => (
                <div key={v} className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">{'{' + v + '}'}</span>
                  <input type="text" value={varValues[v] || ''} onChange={e => setVarValues(p => ({ ...p, [v]: e.target.value }))}
                    placeholder={v} className="border border-blue-100 dark:border-white/10 rounded-lg px-2 py-1 text-xs bg-blue-50/40 dark:bg-[#080f1e] text-[#0d1f3c] dark:text-white w-28 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-2">
          <div className="bg-blue-50/40 dark:bg-[#080f1e] rounded-2xl border border-blue-100 dark:border-white/5 p-5 min-h-full">
            <pre className="text-sm text-[#0d1f3c] dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans font-medium">{preview || <span className="text-[#8896b3] italic">No content for this language yet</span>}</pre>
          </div>
        </div>

        <div className="p-6 border-t border-blue-50 dark:border-white/5 flex gap-3">
          <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#4a5878] dark:text-slate-400 border border-blue-100 dark:border-white/8 hover:bg-blue-50 dark:hover:bg-white/5 transition-all">
            <Pencil className="w-4 h-4" />Edit
          </button>
          <button onClick={onDuplicate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#4a5878] dark:text-slate-400 border border-blue-100 dark:border-white/8 hover:bg-blue-50 dark:hover:bg-white/5 transition-all">
            <CopyPlus className="w-4 h-4" />Duplicate
          </button>
          <button onClick={handleCopy} className={"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all " + (copied ? 'bg-teal-500 text-white' : 'grad-btn text-white')}>
            {copied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Home ─────────────────────────────────────────────────────────────────────
export function Home() {
  const { profile } = useAuth()
  const { pinnedIds, togglePin, isPinned, favoriteIds, toggleFavorite, isFavorite, viewMode, setViewMode } = useApp()
  const navigate = useNavigate()

  const [templates, setTemplates] = useState<Template[]>([])
  const [userData, setUserData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState('ALL')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [preview, setPreview] = useState<{ template: any; lang: string } | null>(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase
        .from('templates')
        .select('id,title,content,content_es,content_en,content_fr,content_de,content_it,language,tags,shortcut,variables,use_count,category_id,is_active,updated_at,created_by,category:categories(id,name)')
        .eq('is_active', true).eq('owner_id', profile?.id).order('updated_at', { ascending: false })
      setTemplates(t || [])
      setUserData(getUserData(profile?.id || ''))
      setLoading(false)
    }
    load()
  }, [profile?.id])

  const refreshUserData = useCallback(() => setUserData(getUserData(profile?.id || '')), [profile?.id])

  const hideTemplate = useCallback((id: string) => {
    const data = getUserData(profile?.id || '')
    data[id] = { ...(data[id] || {}), hidden: true }
    saveUserData(profile?.id || '', data); refreshUserData()
    toast.success('Template hidden')
  }, [profile?.id])

  const deleteTemplate = useCallback((id: string) => {
    const data = getUserData(profile?.id || '')
    data[id] = { ...(data[id] || {}), deleted: true }
    saveUserData(profile?.id || '', data); refreshUserData()
    toast.success('Template removed')
  }, [profile?.id])

  const duplicateTemplate = useCallback(async (t: any) => {
    const { data, error } = await supabase.from('templates').insert({
      title: t.title + ' (copy)',
      content: t.content, content_es: t.content_es, content_en: t.content_en,
      content_fr: t.content_fr, content_de: t.content_de, content_it: t.content_it,
      language: t.language, tags: t.tags, shortcut: null, variables: t.variables,
      category_id: t.category_id, is_active: true,
      created_by: profile?.id, owner_id: profile?.id,
    }).select().single()
    if (error) { toast.error('Error duplicating'); return }
    setTemplates(prev => [data, ...prev])
    toast.success('Template duplicated!')
  }, [profile?.id])

  const exportTemplates = useCallback(() => {
    const rows = [
      ['title', 'shortcut', 'tags', 'content_es', 'content_en', 'content_fr', 'content_de', 'content_it'],
      ...mergedTemplates.map(t => [
        t.title, t.shortcut || '', (t.tags || []).join(';'),
        t.content_es || '', t.content_en || '', t.content_fr || '', t.content_de || '', t.content_it || ''
      ])
    ]
    const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'templates.csv'
    a.click(); URL.revokeObjectURL(url)
    toast.success('Templates exported!')
  }, [])

  const unhideAll = () => {
    const data = getUserData(profile?.id || '')
    Object.keys(data).forEach(id => { if (data[id]) { delete data[id].hidden; delete data[id].deleted } })
    saveUserData(profile?.id || '', data); refreshUserData()
    toast.success('All templates restored')
  }

  const mergedTemplates = useMemo(() => templates.map(t => {
    const local = userData[t.id]
    return local?.localEdit ? { ...t, ...local.localEdit } : t
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
      if (showFavoritesOnly && !isFavorite(t.id)) return false
      if (language !== 'ALL' && t.language !== language) return false
      if (selectedTags.length > 0 && !selectedTags.every(tag => t.tags?.includes(tag))) return false
      if (search) {
        const q = search.toLowerCase()
        if (!t.title.toLowerCase().includes(q) && !t.content?.toLowerCase().includes(q) &&
          !t.shortcut?.toLowerCase().includes(q) && !t.tags?.some((tag: string) => tag.toLowerCase().includes(q))) return false
      }
      return true
    })
    return [
      ...visible.filter(t => isPinned(t.id)),
      ...visible.filter(t => !isPinned(t.id) && isFavorite(t.id)),
      ...visible.filter(t => !isPinned(t.id) && !isFavorite(t.id)),
    ]
  }, [mergedTemplates, userData, pinnedIds, favoriteIds, showFavoritesOnly, search, language, selectedTags])

  const onShortcutCopied = useCallback((title: string) => {
    toast.success(`Copied: ${title}`, { icon: '⚡' })
  }, [])
  useShortcutListener(mergedTemplates.filter(t => !userData[t.id]?.hidden && !userData[t.id]?.deleted), onShortcutCopied)

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-7 h-7 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  )

  const gridClass = viewMode === 'grid'
    ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 card-grid'
    : viewMode === 'compact'
    ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 card-grid'
    : 'flex flex-col gap-2 card-grid'

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight grad-text">Templates</h1>
          <p className="text-[#4a5878] dark:text-slate-500 text-sm mt-1.5 font-semibold">
            {filtered.length} {filtered.length === 1 ? 'template' : 'templates'}
            {hiddenCount > 0 && <button onClick={unhideAll} className="ml-2 text-blue-600 hover:text-blue-800 underline underline-offset-2">restore {hiddenCount} hidden</button>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export */}
          <button onClick={exportTemplates} title="Export CSV"
            className="p-2.5 rounded-xl text-[#8896b3] border border-blue-100 dark:border-white/8 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all bg-white dark:bg-[#0d1829]">
            <Download className="w-4 h-4" />
          </button>
          {/* View mode */}
          <div className="flex items-center bg-white dark:bg-[#0d1829] border border-blue-100 dark:border-white/8 rounded-xl overflow-hidden">
            {([['grid', LayoutGrid], ['list', List], ['compact', Rows3]] as const).map(([mode, Icon]) => (
              <button key={mode} onClick={() => setViewMode(mode)} title={mode}
                className={"p-2.5 transition-all " + (viewMode === mode ? 'grad-btn text-white' : 'text-[#8896b3] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-white/5')}>
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <button onClick={() => navigate('/templates/new')} className="grad-btn flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-bold">
            <PlusCircle className="w-4 h-4" />New
          </button>
        </div>
      </div>

      {/* Search + shortcut hint */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8896b3] dark:text-slate-600" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates... or type /shortcut anywhere to auto-copy"
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

        {/* Favorites filter */}
        <button onClick={() => setShowFavoritesOnly(f => !f)}
          className={"flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-bold transition-all " +
            (showFavoritesOnly ? 'bg-amber-500 text-white border-transparent' : 'bg-white dark:bg-[#0d1829] text-[#4a5878] dark:text-slate-400 border-blue-100 dark:border-white/6 hover:border-amber-400 hover:text-amber-600')}>
          <Star className="w-3 h-3" />Favorites
        </button>

        {allTags.slice(0, 12).map(tag => {
          const isSelected = selectedTags.includes(tag)
          return (
            <button key={tag} onClick={() => setSelectedTags(prev => isSelected ? prev.filter(t => t !== tag) : [...prev, tag])}
              className={"text-xs px-3 py-1.5 rounded-lg border font-bold transition-all " +
                (isSelected ? 'grad-btn text-white border-transparent' : 'bg-white dark:bg-[#0d1829] text-[#4a5878] dark:text-slate-400 border-blue-100 dark:border-white/6 hover:border-blue-400 hover:text-blue-600')}>
              {tag}
            </button>
          )
        })}
        {(search || language !== 'ALL' || selectedTags.length > 0 || showFavoritesOnly) && (
          <button onClick={() => { setSearch(''); setLanguage('ALL'); setSelectedTags([]); setShowFavoritesOnly(false) }}
            className="text-xs text-[#8896b3] hover:text-red-500 flex items-center gap-1 px-2 font-semibold">
            <X className="w-3 h-3" />Clear
          </button>
        )}
      </div>

      {/* Grid / List */}
      {filtered.length === 0 ? (
        <div className="text-center py-32">
          <div className="w-16 h-16 rounded-2xl grad-btn flex items-center justify-center mx-auto mb-5 opacity-40">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <p className="text-[#4a5878] dark:text-slate-600 font-semibold">No templates found</p>
          <button onClick={() => navigate('/templates/new')} className="text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2 mt-2 font-semibold">Create the first one</button>
        </div>
      ) : (
        <div className={gridClass}>
          {filtered.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              pinned={isPinned(template.id)}
              favorite={isFavorite(template.id)}
              viewMode={viewMode}
              onPreview={(lang) => setPreview({ template, lang })}
              onEdit={() => navigate('/templates/' + template.id + '/edit')}
              onHide={() => hideTemplate(template.id)}
              onDelete={() => deleteTemplate(template.id)}
              onTogglePin={() => togglePin(template.id)}
              onToggleFavorite={() => toggleFavorite(template.id)}
              onDuplicate={() => duplicateTemplate(template)}
            />
          ))}
        </div>
      )}

      {preview && (
        <PreviewDrawer
          template={preview.template}
          initialLang={preview.lang}
          onClose={() => setPreview(null)}
          onEdit={() => { navigate('/templates/' + preview.template.id + '/edit?lang=' + preview.lang.toLowerCase()); setPreview(null) }}
          onDuplicate={() => { duplicateTemplate(preview.template); setPreview(null) }}
        />
      )}
    </div>
  )
}

// ── Template Card ─────────────────────────────────────────────────────────────
const TemplateCard = memo(function TemplateCard({ template, pinned, favorite, viewMode, onPreview, onEdit, onHide, onDelete, onTogglePin, onToggleFavorite, onDuplicate }: {
  template: any; pinned: boolean; favorite: boolean; viewMode: 'grid' | 'list' | 'compact'
  onPreview: (lang: string) => void; onEdit: () => void; onHide: () => void
  onDelete: () => void; onTogglePin: () => void; onToggleFavorite: () => void; onDuplicate: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [activeLang, setActiveLang] = useState<string>(template.language || 'ES')
  const [confirmDelete, setConfirmDelete] = useState(false)

  function getContent() {
    return template['content_' + activeLang.toLowerCase()] || template.content
  }

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    const content = getContent()
    try { await navigator.clipboard.writeText(content) } catch {
      const el = document.createElement('textarea'); el.value = content
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true); toast.success('Copied!'); setTimeout(() => setCopied(false), 2000)
    supabase.from('templates').update({ use_count: (template.use_count || 0) + 1 }).eq('id', template.id).then()
  }

  function switchLang(e: React.MouseEvent, langCode: string) {
    e.stopPropagation()
    if (template['content_' + langCode.toLowerCase()] || langCode === template.language) setActiveLang(langCode)
  }

  const displayContent = getContent()
  const previewText = displayContent?.length > (viewMode === 'compact' ? 60 : 120)
    ? displayContent.substring(0, viewMode === 'compact' ? 60 : 120) + '...'
    : displayContent

  // LIST view
  if (viewMode === 'list') {
    return (
      <div className={"bg-white dark:bg-[#0d1829] rounded-xl border px-5 py-3 flex items-center gap-4 card-hover cursor-pointer " +
        (pinned ? 'border-blue-400 dark:border-blue-500' : 'border-blue-100 dark:border-white/5')}
        onClick={() => onPreview(activeLang)}>
        <div className="flex items-center gap-2 flex-shrink-0">
          {favorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
          {pinned && <Pin className="w-3.5 h-3.5 text-blue-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[#0d1f3c] dark:text-white text-sm hover:text-blue-600 transition-colors">{template.title}</span>
          {template.shortcut && <span className="ml-2 text-xs font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-md font-bold"><Zap className="w-2.5 h-2.5 inline mr-0.5" />{template.shortcut}</span>}
        </div>
        <p className="text-xs text-[#8896b3] truncate max-w-xs hidden lg:block font-medium">{previewText}</p>
        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {LANGS.map(l => {
            const has = !!(template['content_' + l.code.toLowerCase()])
            return has ? <span key={l.code} onClick={e => switchLang(e, l.code)} className={"text-sm p-0.5 rounded cursor-pointer " + (activeLang === l.code ? 'bg-blue-100 dark:bg-blue-900/30 scale-110' : 'opacity-60 hover:opacity-100')}>{l.flag}</span> : null
          })}
        </div>
        <button onClick={handleCopy} className={"flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 " + (copied ? 'bg-teal-500 text-white' : 'grad-btn text-white')}>
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </button>
        <button onClick={e => { e.stopPropagation(); onEdit() }} className="p-1.5 rounded-lg text-[#8896b3] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={e => { e.stopPropagation(); onToggleFavorite() }} className={"p-1.5 rounded-lg transition-all " + (favorite ? 'text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10' : 'text-[#8896b3] hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10')}>
          <Star className={"w-3.5 h-3.5 " + (favorite ? 'fill-amber-400' : '')} />
        </button>
      </div>
    )
  }

  // GRID / COMPACT view
  const isCompact = viewMode === 'compact'
  return (
    <div className={"bg-white dark:bg-[#0d1829] rounded-2xl border flex flex-col card-hover " +
      (isCompact ? 'p-3.5 gap-2' : 'p-5 gap-3.5') + ' ' +
      (pinned ? 'border-blue-400 dark:border-blue-500 shadow-md shadow-blue-100 dark:shadow-blue-900/20' : 'border-blue-100 dark:border-white/5')}>

      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onPreview(activeLang)}>
          <div className="flex items-center gap-1.5 mb-0.5">
            {favorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
            {pinned && <Pin className="w-3 h-3 text-blue-500 flex-shrink-0" />}
            <h3 className={"font-extrabold text-[#0d1f3c] dark:text-white truncate hover:text-blue-600 transition-colors " + (isCompact ? 'text-xs' : 'text-[15px]')}>{template.title}</h3>
          </div>
          {!isCompact && template.shortcut && (
            <span className="text-xs font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-md flex items-center gap-1 font-bold w-fit">
              <Zap className="w-2.5 h-2.5" />{template.shortcut}
            </span>
          )}
        </div>
        <button onClick={handleCopy} className={"flex items-center gap-1 rounded-lg font-bold transition-all flex-shrink-0 " +
          (isCompact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs') + ' ' +
          (copied ? 'bg-teal-500 text-white' : 'grad-btn text-white')}>
          {copied ? <Check className="w-3 h-3" /> : <><Copy className="w-3 h-3" />{!isCompact && 'Copy'}</>}
        </button>
      </div>

      {/* Lang flags */}
      <div className="flex items-center gap-0.5">
        {LANGS.map(l => {
          const hasContent = !!(template['content_' + l.code.toLowerCase()])
          const isActive = activeLang === l.code
          return (
            <button key={l.code} onClick={e => switchLang(e, l.code)} disabled={!hasContent && l.code !== template.language} title={l.label}
              className={"leading-none rounded-lg transition-all " + (isCompact ? 'text-sm p-0.5' : 'text-base p-1') + ' ' +
                (isActive ? 'bg-blue-100 dark:bg-blue-900/30 scale-110 ring-2 ring-blue-300 dark:ring-blue-700'
                  : hasContent ? 'opacity-70 hover:opacity-100 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  : 'opacity-15 cursor-not-allowed')}>
              {l.flag}
            </button>
          )
        })}
      </div>

      {/* Preview */}
      <p onClick={() => onPreview(activeLang)}
        className={"text-[#4a5878] dark:text-slate-400 leading-relaxed whitespace-pre-line flex-1 cursor-pointer hover:text-[#0d1f3c] dark:hover:text-slate-200 transition-colors font-medium " +
          (isCompact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-4')}>
        {previewText}
      </p>

      {/* Tags */}
      {!isCompact && template.tags?.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="w-3 h-3 text-blue-200 dark:text-slate-700 flex-shrink-0" />
          {template.tags.slice(0, 4).map((tag: string) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold">{tag}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className={"flex items-center gap-0.5 border-t border-blue-50 dark:border-white/5 " + (isCompact ? 'pt-2' : 'pt-3')}>
        {!isCompact && (
          <button onClick={() => onPreview(activeLang)} className="flex items-center gap-1.5 text-xs text-[#8896b3] dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 px-2 py-1.5 rounded-lg font-semibold transition-colors">
            <Eye className="w-3 h-3" />View
          </button>
        )}
        <button onClick={onEdit} className="flex items-center gap-1.5 text-xs text-[#8896b3] dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 px-2 py-1.5 rounded-lg font-semibold transition-colors">
          <Pencil className="w-3 h-3" />{!isCompact && 'Edit'}
        </button>
        <button onClick={onDuplicate} className="flex items-center gap-1.5 text-xs text-[#8896b3] dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 px-2 py-1.5 rounded-lg font-semibold transition-colors">
          <CopyPlus className="w-3 h-3" />{!isCompact && 'Duplicate'}
        </button>
        <button onClick={e => { e.stopPropagation(); onToggleFavorite() }}
          className={"flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg font-semibold transition-colors " +
            (favorite ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10' : 'text-[#8896b3] dark:text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10')}>
          <Star className={"w-3 h-3 " + (favorite ? 'fill-amber-400' : '')} />{!isCompact && (favorite ? 'Unfav' : 'Fav')}
        </button>
        <button onClick={e => { e.stopPropagation(); onTogglePin() }}
          className={"flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg font-semibold transition-colors " +
            (pinned ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10' : 'text-[#8896b3] dark:text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10')}>
          {pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
        </button>
        <div className="ml-auto">
          {confirmDelete
            ? <span className="flex items-center gap-1">
                <button onClick={e => { e.stopPropagation(); onDelete() }} className="text-xs text-red-600 font-bold px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10">Yes</button>
                <button onClick={e => { e.stopPropagation(); setConfirmDelete(false) }} className="text-xs text-[#8896b3] px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 font-semibold">No</button>
              </span>
            : <button onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
                className="flex items-center gap-1.5 text-xs text-[#8896b3] dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 px-2 py-1.5 rounded-lg font-semibold transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
          }
        </div>
      </div>
    </div>
  )
})
