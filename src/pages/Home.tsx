import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, FileText, Search, X, Tag, Zap, Copy, Check, Eye, Pencil, EyeOff, Loader2, Pin, PinOff } from 'lucide-react'
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
  { label: 'Red', bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', ring: 'ring-red-300' },
  { label: 'Orange', bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', ring: 'ring-orange-300' },
  { label: 'Yellow', bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300', ring: 'ring-yellow-300' },
  { label: 'Green', bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300', ring: 'ring-green-300' },
  { label: 'Blue', bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', ring: 'ring-blue-300' },
  { label: 'Purple', bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', ring: 'ring-purple-300' },
  { label: 'Indigo', bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300', ring: 'ring-indigo-300' },
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
      const { data: t } = await supabase.from('templates').select('*, category:categories(*)').eq('is_active', true).order('updated_at', { ascending: false })
      setTemplates(t || [])
      const key = 'hidden_' + profile?.id
      const stored = localStorage.getItem(key)
      if (stored) setHiddenIds(new Set(JSON.parse(stored)))
      const colorKey = 'tagcolors_' + profile?.id
      const storedColors = localStorage.getItem(colorKey)
      if (storedColors) setTagColors(JSON.parse(storedColors))
      setLoading(false)
    }
    load()
  }, [profile?.id])

  function hideTemplate(id: string) {
    const next = new Set(hiddenIds)
    next.add(id)
    setHiddenIds(next)
    localStorage.setItem('hidden_' + profile?.id, JSON.stringify(Array.from(next)))
    toast.success('Template hidden from your view')
  }

  function unhideAll() {
    setHiddenIds(new Set())
    localStorage.removeItem('hidden_' + profile?.id)
    toast.success('All templates restored')
  }

  function setTagColor(tag: string, colorIdx: number) {
    const next = { ...tagColors, [tag]: colorIdx }
    setTagColors(next)
    localStorage.setItem('tagcolors_' + profile?.id, JSON.stringify(next))
  }

  const allTags = useMemo(() => {
    const set = new Set<string>()
    templates.forEach(t => t.tags?.forEach(tag => set.add(tag)))
    return Array.from(set).sort()
  }, [templates])

  const filtered = useMemo(() => {
    const visible = templates.filter(t => {
      if (hiddenIds.has(t.id)) return false
      if (search) {
        const q = search.toLowerCase()
        if (!t.title.toLowerCase().includes(q) && !t.content.toLowerCase().includes(q) && !t.shortcut?.toLowerCase().includes(q) && !t.tags?.some(tag => tag.toLowerCase().includes(q))) return false
      }
      if (language !== 'ALL' && t.language !== language) return false
      if (selectedTags.length > 0 && !selectedTags.every(tag => t.tags?.includes(tag))) return false
      return true
    })
    // Pinned first
    return [...visible.filter(t => isPinned(t.id)), ...visible.filter(t => !isPinned(t.id))]
  }, [templates, hiddenIds, pinnedIds, search, language, selectedTags])

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Templates</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {filtered.length} of {templates.length - hiddenIds.size} templates
            {hiddenIds.size > 0 && <button onClick={unhideAll} className="ml-2 text-indigo-500 hover:text-indigo-700 underline">restore {hiddenIds.size} hidden</button>}
          </p>
        </div>
        {canEdit && (
          <button onClick={() => navigate('/templates/new')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
            <PlusCircle className="w-4 h-4" />New template
          </button>
        )}
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, content, /shortcut or tag..." className="w-full pl-10 pr-9 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <select value={language} onChange={e => setLanguage(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="ALL">All languages</option>
          {LANGS.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
        </select>
        {allTags.slice(0, 10).map(tag => {
          const colorIdx = tagColors[tag]
          const color = colorIdx !== undefined ? TAG_COLORS[colorIdx] : null
          return (
            <button key={tag} onClick={() => toggleTag(tag)} className={"text-xs px-2.5 py-1 rounded-full border transition-colors " + (selectedTags.includes(tag) ? 'bg-indigo-600 text-white border-indigo-600' : color ? color.bg + ' ' + color.text + ' border-transparent' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-300')}>
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
              onSetTagColor={setTagColor}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TemplateCard({ template, canEdit, pinned, tagColors, onEdit, onView, onHide, onTogglePin, onSetTagColor }: {
  template: Template; canEdit?: boolean; pinned: boolean; tagColors: Record<string, number>
  onEdit: () => void; onView: () => void; onHide: () => void; onTogglePin: () => void; onSetTagColor: (tag: string, idx: number) => void
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
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2500)
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

  const displayContent = translations[activeLang] || template.content
  const preview = displayContent.length > 150 ? displayContent.substring(0, 150) + '...' : displayContent

  return (
    <>
      <div
        className={"bg-white dark:bg-slate-800 rounded-xl border p-4 flex flex-col gap-3 hover:shadow-md transition-all fade-in cursor-pointer " + (pinned ? 'border-indigo-300 dark:border-indigo-500 ring-1 ring-indigo-200 dark:ring-indigo-700' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-200')}
        onClick={onView}
      >
        <div className="flex items-start gap-2" onClick={e => e.stopPropagation()}>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onView}>
            <div className="flex items-center gap-1.5">
              {pinned && <Pin className="w-3 h-3 text-indigo-500 flex-shrink-0" />}
              <h3 className="font-semibold text-slate-900 dark:text-white truncate hover:text-indigo-600">{template.title}</h3>
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {template.category && <span className="text-xs text-slate-400 dark:text-slate-500">{template.category.name}</span>}
              {template.shortcut && <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" />{template.shortcut}</span>}
            </div>
          </div>
          <button onClick={handleCopy} className={"flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 " + (copied ? 'bg-green-100 text-green-700' : 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100')}>
            {copied ? <><Check className="w-3.5 h-3.5" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
          </button>
        </div>

        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {LANGS.map(l => (
            <button key={l.code} onClick={e => translate(e, l.code)} title={l.label} className={"text-base leading-none px-1 py-0.5 rounded transition-all " + (activeLang === l.code ? 'ring-2 ring-indigo-400 scale-110' : 'opacity-40 hover:opacity-80') + (translating ? ' pointer-events-none' : '')}>
              {l.flag}
            </button>
          ))}
          {translating && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin ml-1" />}
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line flex-1">{preview}</p>

        {template.variables?.length > 0 && activeLang === template.language && (
          <div className="flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
            {template.variables.map(v => <span key={v} className="text-xs bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700 px-1.5 py-0.5 rounded font-mono">{'{' + v + '}'}</span>)}
          </div>
        )}

        {template.tags?.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap" onClick={e => e.stopPropagation()}>
            <Tag className="w-3 h-3 text-slate-300" />
            {template.tags.slice(0, 5).map(tag => {
              const colorIdx = tagColors[tag]
              const color = colorIdx !== undefined ? TAG_COLORS[colorIdx] : null
              return (
                <div key={tag} className="relative">
                  <span
                    onClick={() => setColorPickerTag(colorPickerTag === tag ? null : tag)}
                    className={"text-xs px-1.5 py-0.5 rounded cursor-pointer transition-colors " + (color ? color.bg + ' ' + color.text : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400')}
                  >{tag}</span>
                  {colorPickerTag === tag && (
                    <div className="absolute bottom-full left-0 mb-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 p-1.5 flex gap-1 z-10">
                      <button onClick={() => { onSetTagColor(tag, -1 as any); setColorPickerTag(null) }} className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-600 ring-1 ring-slate-300" title="Default" />
                      {TAG_COLORS.map((c, i) => (
                        <button key={i} onClick={() => { onSetTagColor(tag, i); setColorPickerTag(null) }} className={"w-4 h-4 rounded-full " + c.bg + " ring-1 " + c.ring} title={c.label} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {template.tags.length > 5 && <span className="text-xs text-slate-400">+{template.tags.length - 5}</span>}
          </div>
        )}

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
}

function VariableModal({ template, onCopy, onClose }: { template: Template; onCopy: (c: string) => Promise<void>; onClose: () => void }) {
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(template.variables.map(v => [v, ''])))
  const preview = fillVariables(template.content, values)

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg fade-in" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Customize template</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Fill in the fields to personalize the message</p>
          <div className="space-y-3 mb-5">
            {template.variables.map(v => (
              <div key={v}>
                <label className="block text-xs font-mono text-yellow-700 dark:text-yellow-400 mb-1">{'{' + v + '}'}</label>
                <input type="text" value={values[v]} onChange={e => setValues(p => ({ ...p, [v]: e.target.value }))} placeholder={"Enter " + v + "..."} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            ))}
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-5 max-h-36 overflow-y-auto">
            <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Preview</p>
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{preview}</p>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800">Cancel</button>
            <button onClick={() => onCopy(preview)} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">
              <Copy className="w-4 h-4" />Copy customized
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
