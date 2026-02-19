import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, FileText, Search, X, Tag, Zap, Copy, Check, Eye, Pencil, EyeOff, Loader2, Pin, PinOff, Palette } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useApp } from '../lib/AppContext'
import { fillVariables } from '../lib/utils'
import type { Template } from '../types'
import toast from 'react-hot-toast'

const LANGS = [
  { code: 'ES', flag: '🇪🇸', label: 'Spanish' },
  { code: 'EN', flag: '🇬🇧', label: 'English' },
  { code: 'FR', flag: '🇫🇷', label: 'French' },
  { code: 'DE', flag: '🇩🇪', label: 'German' },
  { code: 'IT', flag: '🇮🇹', label: 'Italian' },
]

const TAG_COLORS = [
  { label: 'Gray',   dot: 'bg-slate-400',  bg: 'bg-slate-100 dark:bg-slate-700',   text: 'text-slate-600 dark:text-slate-300' },
  { label: 'Red',    dot: 'bg-red-400',    bg: 'bg-red-100 dark:bg-red-900/50',    text: 'text-red-700 dark:text-red-300' },
  { label: 'Orange', dot: 'bg-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/50', text: 'text-orange-700 dark:text-orange-300' },
  { label: 'Yellow', dot: 'bg-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-700 dark:text-yellow-300' },
  { label: 'Green',  dot: 'bg-green-400',  bg: 'bg-green-100 dark:bg-green-900/50',  text: 'text-green-700 dark:text-green-300' },
  { label: 'Blue',   dot: 'bg-blue-400',   bg: 'bg-blue-100 dark:bg-blue-900/50',   text: 'text-blue-700 dark:text-blue-300' },
  { label: 'Purple', dot: 'bg-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-700 dark:text-purple-300' },
  { label: 'Indigo', dot: 'bg-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/50', text: 'text-indigo-700 dark:text-indigo-300' },
]

export function Home() {
  const { profile } = useAuth()
  const { pinnedIds, togglePin, isPinned } = useApp()
  const navigate = useNavigate()
  const canEdit = profile?.role === 'admin' || profile?.role === 'editor'

  const [templates, setTemplates] = useState<Template[]>([])
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const [tagColors, setTagColors] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState<string>('ALL')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase
        .from('templates')
        .select('id,title,content,language,tags,shortcut,variables,use_count,category_id,is_active,updated_at,category:categories(id,name)')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
      setTemplates(t || [])

      const hidden = localStorage.getItem('hidden_' + profile?.id)
      if (hidden) setHiddenIds(new Set(JSON.parse(hidden)))

      const colors = localStorage.getItem('tagcolors_' + profile?.id)
      if (colors) setTagColors(JSON.parse(colors))

      setLoading(false)
    }
    load()
  }, [profile?.id])

  const hideTemplate = useCallback((id: string) => {
    setHiddenIds(prev => {
      const next = new Set(prev)
      next.add(id)
      localStorage.setItem('hidden_' + profile?.id, JSON.stringify(Array.from(next)))
      return next
    })
    toast.success('Template hidden')
  }, [profile?.id])

  const handleSetTagColor = useCallback((tag: string, colorIdx: number) => {
    setTagColors(prev => {
      const next = { ...prev, [tag]: colorIdx }
      localStorage.setItem('tagcolors_' + profile?.id, JSON.stringify(next))
      return next
    })
  }, [profile?.id])

  const unhideAll = () => {
    setHiddenIds(new Set())
    localStorage.removeItem('hidden_' + profile?.id)
    toast.success('All templates restored')
  }

  const allTags = useMemo(() => {
    const set = new Set<string>()
    templates.forEach(t => t.tags?.forEach(tag => set.add(tag)))
    return Array.from(set).sort()
  }, [templates])

  const filtered = useMemo(() => {
    const visible = templates.filter(t => {
      if (hiddenIds.has(t.id)) return false
      if (language !== 'ALL' && t.language !== language) return false
      if (selectedTags.length > 0 && !selectedTags.every(tag => t.tags?.includes(tag))) return false
      if (search) {
        const q = search.toLowerCase()
        if (!t.title.toLowerCase().includes(q) && !t.content.toLowerCase().includes(q) && !t.shortcut?.toLowerCase().includes(q) && !t.tags?.some(tag => tag.toLowerCase().includes(q))) return false
      }
      return true
    })
    return [...visible.filter(t => isPinned(t.id)), ...visible.filter(t => !isPinned(t.id))]
  }, [templates, hiddenIds, pinnedIds, search, language, selectedTags])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Templates</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {filtered.length} of {templates.length - hiddenIds.size} templates
            {hiddenIds.size > 0 && <button onClick={unhideAll} className="ml-2 text-indigo-500 hover:text-indigo-700 underline">restore {hiddenIds.size} hidden</button>}
          </p>
        </div>
        {canEdit && (
          <button onClick={() => navigate('/templates/new')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            <PlusCircle className="w-4 h-4" />New template
          </button>
        )}
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, content, /shortcut or tag..." className="w-full pl-10 pr-9 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <select value={language} onChange={e => setLanguage(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="ALL">All languages</option>
          {LANGS.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
        </select>
        {allTags.slice(0, 12).map(tag => {
          const colorIdx = tagColors[tag] ?? 0
          const color = TAG_COLORS[colorIdx]
          const isSelected = selectedTags.includes(tag)
          return (
            <button key={tag} onClick={() => setSelectedTags(prev => isSelected ? prev.filter(t => t !== tag) : [...prev, tag])}
              className={"text-xs px-2.5 py-1 rounded-full border transition-colors " + (isSelected ? 'bg-indigo-600 text-white border-indigo-600' : color.bg + ' ' + color.text + ' border-transparent hover:opacity-80')}>
              {tag}
            </button>
          )
        })}
        {(search || language !== 'ALL' || selectedTags.length > 0) && (
          <button onClick={() => { setSearch(''); setLanguage('ALL'); setSelectedTags([]) }} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 px-2">
            <X className="w-3 h-3" />Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">No templates found</p>
          {canEdit && !search && <button onClick={() => navigate('/templates/new')} className="text-sm text-indigo-600 hover:text-indigo-800 mt-2">Create the first one</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              canEdit={canEdit}
              pinned={isPinned(template.id)}
              tagColors={tagColors}
              onEdit={() => navigate('/templates/' + template.id + '/edit')}
              onView={() => navigate('/templates/' + template.id)}
              onHide={() => hideTemplate(template.id)}
              onTogglePin={() => togglePin(template.id)}
              onSetTagColor={handleSetTagColor}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const TemplateCard = memo(function TemplateCard({ template, canEdit, pinned, tagColors, onEdit, onView, onHide, onTogglePin, onSetTagColor }: {
  template: Template; canEdit?: boolean; pinned: boolean; tagColors: Record<string, number>
  onEdit: () => void; onView: () => void; onHide: () => void; onTogglePin: () => void
  onSetTagColor: (tag: string, idx: number) => void
}) {
  const [copied, setCopied] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [activeLang, setActiveLang] = useState<string>(template.language)
  const [colorPickerTag, setColorPickerTag] = useState<string | null>(null)

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    const content = translations[activeLang] || template.content
    if (template.variables?.length > 0 && activeLang === template.language) { setShowModal(true); return }
    await doCopy(content)
  }

  async function doCopy(content: string) {
    try { await navigator.clipboard.writeText(content) } catch {
      const el = document.createElement('textarea')
      el.value = content; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
    supabase.from('templates').update({ use_count: (template.use_count || 0) + 1 }).eq('id', template.id).then()
  }

  async function translate(e: React.MouseEvent, targetLang: string) {
    e.stopPropagation()
    if (targetLang === template.language) { setActiveLang(targetLang); return }
    if (translations[targetLang]) { setActiveLang(targetLang); return }
    setTranslating(true)
    try {
      const res = await fetch('/.netlify/functions/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: template.content, targetLang }),
      })
      const data = await res.json()
      const translated = data.translations?.[0]?.text
      if (translated) { setTranslations(prev => ({ ...prev, [targetLang]: translated })); setActiveLang(targetLang) }
      else toast.error('Translation failed')
    } catch { toast.error('Translation error') }
    setTranslating(false)
  }

  function handleTagClick(e: React.MouseEvent, tag: string) {
    e.stopPropagation()
    setColorPickerTag(prev => prev === tag ? null : tag)
  }

  function handleColorPick(e: React.MouseEvent, tag: string, idx: number) {
    e.stopPropagation()
    onSetTagColor(tag, idx)
    setColorPickerTag(null)
  }

  const displayContent = translations[activeLang] || template.content
  const preview = displayContent.length > 150 ? displayContent.substring(0, 150) + '...' : displayContent

  return (
    <>
      <div
        className={"bg-white dark:bg-slate-800 rounded-xl border p-4 flex flex-col gap-3 hover:shadow-md transition-all fade-in cursor-pointer group " + (pinned ? 'border-indigo-300 dark:border-indigo-600 ring-1 ring-indigo-100 dark:ring-indigo-900' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700')}
        onClick={onView}
      >
        {/* Header */}
        <div className="flex items-start gap-2" onClick={e => e.stopPropagation()}>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onView}>
            <div className="flex items-center gap-1.5">
              {pinned && <Pin className="w-3 h-3 text-indigo-500 flex-shrink-0" />}
              <h3 className="font-semibold text-slate-900 dark:text-white truncate hover:text-indigo-600 dark:hover:text-indigo-400">{template.title}</h3>
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {template.category && <span className="text-xs text-slate-400">{(template.category as any).name}</span>}
              {template.shortcut && <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" />{template.shortcut}</span>}
            </div>
          </div>
          <button onClick={handleCopy} className={"flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 " + (copied ? 'bg-green-100 text-green-700' : 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60')}>
            {copied ? <><Check className="w-3.5 h-3.5" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
          </button>
        </div>

        {/* Language flags */}
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {LANGS.map(l => (
            <button key={l.code} onClick={e => translate(e, l.code)} title={l.label}
              className={"text-sm leading-none px-1 py-0.5 rounded transition-all " + (activeLang === l.code ? 'ring-2 ring-indigo-400 scale-110' : 'opacity-40 hover:opacity-80') + (translating ? ' pointer-events-none' : '')}>
              {l.flag}
            </button>
          ))}
          {translating && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin ml-1" />}
        </div>

        {/* Content preview */}
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line flex-1 line-clamp-4">{preview}</p>

        {/* Variables */}
        {template.variables?.length > 0 && activeLang === template.language && (
          <div className="flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
            {template.variables.map(v => <span key={v} className="text-xs bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800 px-1.5 py-0.5 rounded font-mono">{'{' + v + '}'}</span>)}
          </div>
        )}

        {/* Tags with color picker */}
        {template.tags?.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap" onClick={e => e.stopPropagation()}>
            <Tag className="w-3 h-3 text-slate-300 flex-shrink-0" />
            {template.tags.slice(0, 5).map(tag => {
              const colorIdx = tagColors[tag] ?? 0
              const color = TAG_COLORS[colorIdx]
              return (
                <div key={tag} className="relative">
                  <span
                    onClick={e => handleTagClick(e, tag)}
                    title="Click to change color"
                    className={"text-xs px-1.5 py-0.5 rounded cursor-pointer transition-all hover:opacity-80 select-none " + color.bg + ' ' + color.text}
                  >
                    {tag}
                  </span>
                  {colorPickerTag === tag && (
                    <div className="absolute bottom-full left-0 mb-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 p-2 z-50">
                      <p className="text-xs text-slate-400 mb-1.5 flex items-center gap-1"><Palette className="w-3 h-3" />Tag color</p>
                      <div className="flex gap-1.5">
                        {TAG_COLORS.map((c, i) => (
                          <button key={i} onClick={e => handleColorPick(e, tag, i)}
                            className={"w-5 h-5 rounded-full transition-transform hover:scale-110 " + c.dot + (colorIdx === i ? ' ring-2 ring-offset-1 ring-slate-400' : '')}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {template.tags.length > 5 && <span className="text-xs text-slate-400">+{template.tags.length - 5}</span>}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700" onClick={e => e.stopPropagation()}>
          <button onClick={onView} className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors"><Eye className="w-3 h-3" />View</button>
          {canEdit && <button onClick={onEdit} className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors"><Pencil className="w-3 h-3" />Edit</button>}
          <button onClick={e => { e.stopPropagation(); onTogglePin() }} className={"flex items-center gap-1 text-xs transition-colors " + (pinned ? 'text-indigo-500 hover:text-indigo-700' : 'text-slate-400 hover:text-indigo-500')}>
            {pinned ? <><PinOff className="w-3 h-3" />Unpin</> : <><Pin className="w-3 h-3" />Pin</>}
          </button>
          <button onClick={e => { e.stopPropagation(); onHide() }} className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"><EyeOff className="w-3 h-3" />Hide</button>
          <span className="text-xs text-slate-300 dark:text-slate-600 ml-auto">{template.use_count || 0} uses</span>
        </div>
      </div>

      {showModal && (
        <VariableModal template={template} onCopy={async c => { await doCopy(c); setShowModal(false) }} onClose={() => setShowModal(false)} />
      )}
    </>
  )
})

function VariableModal({ template, onCopy, onClose }: { template: Template; onCopy: (c: string) => Promise<void>; onClose: () => void }) {
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(template.variables.map(v => [v, ''])))
  const preview = fillVariables(template.content, values)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg fade-in" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Customize template</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Fill in the fields to personalize the message</p>
          <div className="space-y-3 mb-5">
            {template.variables.map(v => (
              <div key={v}>
                <label className="block text-xs font-mono text-yellow-700 dark:text-yellow-400 mb-1">{'{' + v + '}'}</label>
                <input type="text" value={values[v]} onChange={e => setValues(p => ({ ...p, [v]: e.target.value }))} placeholder={"Enter " + v + "..."} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus />
              </div>
            ))}
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-5 max-h-40 overflow-y-auto">
            <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Preview</p>
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{preview}</p>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">Cancel</button>
            <button onClick={() => onCopy(preview)} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">
              <Copy className="w-4 h-4" />Copy customized
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
