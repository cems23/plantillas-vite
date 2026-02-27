import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, FileText, Search, X, Tag, Zap, Copy, Check, Eye, Pencil, EyeOff, Pin, PinOff, Trash2 } from 'lucide-react'
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

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase
        .from('templates')
        .select('id,title,content,content_es,content_en,content_fr,content_de,content_it,language,tags,shortcut,variables,use_count,category_id,is_active,updated_at,created_by,category:categories(id,name)')
        .eq('is_active', true)
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

  const mergedTemplates = useMemo(() => {
    return templates.map(t => {
      const local = userData[t.id]
      if (!local?.localEdit) return t
      return { ...t, ...local.localEdit }
    })
  }, [templates, userData])

  const allTemplates = useMemo(() => mergedTemplates, [mergedTemplates])
  const hiddenCount = useMemo(() => Object.values(userData).filter((d: any) => d?.hidden || d?.deleted).length, [userData])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    allTemplates.forEach(t => t.tags?.forEach((tag: string) => set.add(tag)))
    return Array.from(set).sort()
  }, [allTemplates])

  const filtered = useMemo(() => {
    const visible = allTemplates.filter(t => {
      const local = userData[t.id]
      if (local?.hidden || local?.deleted) return false
      if (language !== 'ALL' && t.language !== language) return false
      if (selectedTags.length > 0 && !selectedTags.every(tag => t.tags?.includes(tag))) return false
      if (search) {
        const q = search.toLowerCase()
        if (!t.title.toLowerCase().includes(q) && !t.content.toLowerCase().includes(q) && !t.shortcut?.toLowerCase().includes(q) && !t.tags?.some((tag: string) => tag.toLowerCase().includes(q))) return false
      }
      return true
    })
    return [...visible.filter(t => isPinned(t.id)), ...visible.filter(t => !isPinned(t.id))]
  }, [allTemplates, userData, pinnedIds, search, language, selectedTags])

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-6 h-6 border-2 border-[#1a1a1a] dark:border-white border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-4xl font-semibold text-[#1a1a1a] dark:text-white tracking-tight">Templates</h1>
          <p className="text-[#999] dark:text-[#666] text-sm mt-1.5">
            {filtered.length} {filtered.length === 1 ? 'template' : 'templates'}
            {hiddenCount > 0 && (
              <button onClick={unhideAll} className="ml-2 text-[#1a1a1a] dark:text-white underline underline-offset-2">
                restore {hiddenCount} hidden
              </button>
            )}
          </p>
        </div>
        <button
          onClick={() => navigate('/templates/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
        >
          <PlusCircle className="w-4 h-4" />New template
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb] dark:text-[#555]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search templates..."
          className="w-full pl-11 pr-10 py-3 bg-white dark:bg-[#1a1a1a] border border-black/8 dark:border-white/8 rounded-xl text-sm text-[#1a1a1a] dark:text-white placeholder-[#bbb] dark:placeholder-[#555] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] dark:focus:ring-white transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#666]">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          className="text-xs font-medium border border-black/8 dark:border-white/8 rounded-lg px-3 py-1.5 bg-white dark:bg-[#1a1a1a] text-[#666] dark:text-[#888] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] dark:focus:ring-white"
        >
          <option value="ALL">All languages</option>
          {LANGS.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
        </select>
        {allTags.slice(0, 15).map(tag => {
          const isSelected = selectedTags.includes(tag)
          return (
            <button
              key={tag}
              onClick={() => setSelectedTags(prev => isSelected ? prev.filter(t => t !== tag) : [...prev, tag])}
              className={"text-xs px-3 py-1.5 rounded-lg border font-medium transition-all " +
                (isSelected
                  ? 'bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] border-[#1a1a1a] dark:border-white'
                  : 'bg-white dark:bg-[#1a1a1a] text-[#666] dark:text-[#888] border-black/8 dark:border-white/8 hover:border-[#1a1a1a] dark:hover:border-white')}
            >
              {tag}
            </button>
          )
        })}
        {(search || language !== 'ALL' || selectedTags.length > 0) && (
          <button
            onClick={() => { setSearch(''); setLanguage('ALL'); setSelectedTags([]) }}
            className="text-xs text-[#999] hover:text-red-500 flex items-center gap-1 px-2 transition-colors"
          >
            <X className="w-3 h-3" />Clear
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-32">
          <FileText className="w-10 h-10 text-[#ddd] dark:text-[#333] mx-auto mb-4" />
          <p className="text-[#999] dark:text-[#666] text-sm">No templates found</p>
          <button onClick={() => navigate('/templates/new')} className="text-sm text-[#1a1a1a] dark:text-white underline underline-offset-2 mt-2">
            Create the first one
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 card-grid">
          {filtered.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              pinned={isPinned(template.id)}
              onEdit={() => navigate('/templates/' + template.id + '/edit')}
              onView={() => navigate('/templates/' + template.id)}
              onHide={() => hideTemplate(template.id)}
              onDelete={() => deleteTemplate(template.id)}
              onTogglePin={() => togglePin(template.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const TemplateCard = memo(function TemplateCard({ template, pinned, onEdit, onView, onHide, onDelete, onTogglePin }: {
  template: any; pinned: boolean
  onEdit: () => void; onView: () => void; onHide: () => void; onDelete: () => void
  onTogglePin: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [activeLang, setActiveLang] = useState<string>(template.language || 'ES')
  const [confirmDelete, setConfirmDelete] = useState(false)

  function getContent() {
    const key = 'content_' + activeLang.toLowerCase()
    return template[key] || template.content
  }

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    if (template.variables?.length > 0) { setShowModal(true); return }
    await doCopy(getContent())
  }

  async function doCopy(content: string) {
    try { await navigator.clipboard.writeText(content) } catch {
      const el = document.createElement('textarea')
      el.value = content; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
    if (!String(template.id).startsWith('local_')) {
      supabase.from('templates').update({ use_count: (template.use_count || 0) + 1 }).eq('id', template.id).then()
    }
  }

  function switchLang(e: React.MouseEvent, langCode: string) {
    e.stopPropagation()
    const key = 'content_' + langCode.toLowerCase()
    if (template[key] || langCode === template.language) {
      setActiveLang(langCode)
    }
  }

  const displayContent = getContent()
  const preview = displayContent?.length > 140 ? displayContent.substring(0, 140) + '...' : displayContent

  return (
    <>
      <div
        onClick={onView}
        className={"bg-white dark:bg-[#1a1a1a] rounded-2xl border p-5 flex flex-col gap-4 cursor-pointer card-hover " +
          (pinned
            ? 'border-[#1a1a1a] dark:border-white'
            : 'border-black/8 dark:border-white/8')}
      >
        {/* Title row */}
        <div className="flex items-start gap-3" onClick={e => e.stopPropagation()}>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onView}>
            <div className="flex items-center gap-2 mb-0.5">
              {pinned && <Pin className="w-3 h-3 text-[#1a1a1a] dark:text-white flex-shrink-0" />}
              <h3 className="font-semibold text-[#1a1a1a] dark:text-white truncate text-[15px] leading-snug">{template.title}</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {template.category && (
                <span className="text-xs text-[#999] dark:text-[#666]">{template.category?.name}</span>
              )}
              {template.shortcut && (
                <span className="text-xs font-mono bg-[#f4f3f0] dark:bg-[#252525] text-[#666] dark:text-[#888] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" />{template.shortcut}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleCopy}
            className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 " +
              (copied
                ? 'bg-green-500 text-white'
                : 'bg-[#f4f3f0] dark:bg-[#252525] text-[#1a1a1a] dark:text-white hover:bg-[#1a1a1a] dark:hover:bg-white hover:text-white dark:hover:text-[#1a1a1a]')}
          >
            {copied ? <><Check className="w-3.5 h-3.5" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
          </button>
        </div>

        {/* Language flags */}
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {LANGS.map(l => {
            const key = 'content_' + l.code.toLowerCase()
            const hasContent = !!(template[key])
            const isActive = activeLang === l.code
            return (
              <button
                key={l.code}
                onClick={e => switchLang(e, l.code)}
                disabled={!hasContent && l.code !== template.language}
                title={l.label}
                className={"text-base leading-none p-1 rounded-lg transition-all " +
                  (isActive
                    ? 'bg-[#f4f3f0] dark:bg-[#252525] scale-110'
                    : hasContent
                      ? 'opacity-60 hover:opacity-100 hover:bg-[#f4f3f0] dark:hover:bg-[#252525]'
                      : 'opacity-15 cursor-not-allowed')}
              >
                {l.flag}
              </button>
            )
          })}
        </div>

        {/* Preview */}
        <p className="text-sm text-[#666] dark:text-[#888] leading-relaxed whitespace-pre-line flex-1 line-clamp-4">
          {preview}
        </p>

        {/* Variables */}
        {template.variables?.length > 0 && (
          <div className="flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
            {template.variables.map((v: string) => (
              <span key={v} className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 px-1.5 py-0.5 rounded-md font-mono">
                {'{' + v + '}'}
              </span>
            ))}
          </div>
        )}

        {/* Tags */}
        {template.tags?.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap" onClick={e => e.stopPropagation()}>
            <Tag className="w-3 h-3 text-[#ccc] dark:text-[#444] flex-shrink-0" />
            {template.tags.slice(0, 5).map((tag: string) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[#f4f3f0] dark:bg-[#252525] text-[#666] dark:text-[#888]">
                {tag}
              </span>
            ))}
            {template.tags.length > 5 && (
              <span className="text-xs text-[#bbb] dark:text-[#555]">+{template.tags.length - 5}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 pt-3 border-t border-black/5 dark:border-white/5" onClick={e => e.stopPropagation()}>
          <button onClick={onView} className="flex items-center gap-1.5 text-xs text-[#999] dark:text-[#666] hover:text-[#1a1a1a] dark:hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-[#f4f3f0] dark:hover:bg-[#252525]">
            <Eye className="w-3 h-3" />View
          </button>
          <button onClick={onEdit} className="flex items-center gap-1.5 text-xs text-[#999] dark:text-[#666] hover:text-[#1a1a1a] dark:hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-[#f4f3f0] dark:hover:bg-[#252525]">
            <Pencil className="w-3 h-3" />Edit
          </button>
          <button
            onClick={e => { e.stopPropagation(); onTogglePin() }}
            className={"flex items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded-lg " +
              (pinned
                ? 'text-[#1a1a1a] dark:text-white hover:bg-[#f4f3f0] dark:hover:bg-[#252525]'
                : 'text-[#999] dark:text-[#666] hover:text-[#1a1a1a] dark:hover:text-white hover:bg-[#f4f3f0] dark:hover:bg-[#252525]')}
          >
            {pinned ? <><PinOff className="w-3 h-3" />Unpin</> : <><Pin className="w-3 h-3" />Pin</>}
          </button>
          <button onClick={e => { e.stopPropagation(); onHide() }} className="flex items-center gap-1.5 text-xs text-[#999] dark:text-[#666] hover:text-orange-500 transition-colors px-2 py-1 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/10">
            <EyeOff className="w-3 h-3" />Hide
          </button>
          <div className="ml-auto">
            {confirmDelete
              ? <span className="flex items-center gap-1">
                  <button onClick={e => { e.stopPropagation(); onDelete() }} className="text-xs text-red-600 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10">Confirm</button>
                  <button onClick={e => { e.stopPropagation(); setConfirmDelete(false) }} className="text-xs text-[#999] px-2 py-1 rounded-lg hover:bg-[#f4f3f0] dark:hover:bg-[#252525]">Cancel</button>
                </span>
              : <button onClick={e => { e.stopPropagation(); setConfirmDelete(true) }} className="flex items-center gap-1.5 text-xs text-[#999] dark:text-[#666] hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10">
                  <Trash2 className="w-3 h-3" />Delete
                </button>
            }
          </div>
        </div>
      </div>

      {showModal && (
        <VariableModal template={template} activeContent={getContent()} onCopy={async c => { await doCopy(c); setShowModal(false) }} onClose={() => setShowModal(false)} />
      )}
    </>
  )
})

function VariableModal({ template, activeContent, onCopy, onClose }: { template: any; activeContent: string; onCopy: (c: string) => Promise<void>; onClose: () => void }) {
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries((template.variables || []).map((v: string) => [v, ''])))
  const preview = fillVariables(activeContent, values)

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-lg border border-black/8 dark:border-white/8" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-[#1a1a1a] dark:text-white mb-1">Fill in variables</h2>
          <p className="text-sm text-[#999] dark:text-[#666] mb-5">Personalize the message before copying</p>
          <div className="space-y-3 mb-5">
            {(template.variables || []).map((v: string) => (
              <div key={v}>
                <label className="block text-xs font-mono text-amber-600 dark:text-amber-400 mb-1">{'{' + v + '}'}</label>
                <input
                  type="text"
                  value={values[v]}
                  onChange={e => setValues(p => ({ ...p, [v]: e.target.value }))}
                  placeholder={'Enter ' + v + '...'}
                  className="w-full border border-black/8 dark:border-white/8 rounded-xl px-3 py-2 text-sm bg-[#f8f7f4] dark:bg-[#252525] text-[#1a1a1a] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] dark:focus:ring-white"
                  autoFocus
                />
              </div>
            ))}
          </div>
          <div className="bg-[#f8f7f4] dark:bg-[#252525] rounded-xl p-4 mb-5 max-h-40 overflow-y-auto">
            <p className="text-[10px] font-semibold text-[#bbb] dark:text-[#555] mb-1.5 uppercase tracking-wider">Preview</p>
            <p className="text-sm text-[#1a1a1a] dark:text-white whitespace-pre-wrap">{preview}</p>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-[#999] dark:text-[#666] hover:text-[#1a1a1a] dark:hover:text-white transition-colors">Cancel</button>
            <button
              onClick={() => onCopy(preview)}
              className="flex items-center gap-2 px-5 py-2 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] text-sm font-semibold rounded-xl hover:opacity-80 transition-opacity"
            >
              <Copy className="w-4 h-4" />Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
