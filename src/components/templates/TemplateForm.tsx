import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, X, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { extractVariables } from '../../lib/utils'
import type { Template } from '../../types'
import toast from 'react-hot-toast'

interface Props {
  template?: Template
}

const LANGS = [
  { code: 'es', flag: '🇪🇸', label: 'Spanish' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'fr', flag: '🇫🇷', label: 'French' },
  { code: 'de', flag: '🇩🇪', label: 'German' },
  { code: 'it', flag: '🇮🇹', label: 'Italian' },
]

export function TemplateForm({ template }: Props) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const isEditing = !!template
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [activeLang, setActiveLang] = useState('es')

  // Each language content is stored separately
  const [contents, setContents] = useState<Record<string, string>>({
    es: template?.content_es || '',
    en: template?.content_en || '',
    fr: template?.content_fr || '',
    de: template?.content_de || '',
    it: template?.content_it || '',
  })

  const [title, setTitle] = useState(template?.title || '')
  const [shortcut, setShortcut] = useState(template?.shortcut || '')
  const [tags, setTags] = useState<string[]>(template?.tags || [])

  const detectedVars = extractVariables(contents[activeLang] || '')

  function addTag() {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) setTags(prev => [...prev, tag])
    setTagInput('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { toast.error('Title is required'); return }

    if (isEditing) {
      // When editing: only update the active language + title/shortcut/tags
      // ALL other language fields are taken directly from the original template
      const activeField = 'content_' + activeLang
      const updatePayload: Record<string, any> = {
        title: title.trim(),
        shortcut: shortcut.trim() || null,
        tags,
        // Preserve ALL language fields from original
        content_es: template!.content_es ?? null,
        content_en: template!.content_en ?? null,
        content_fr: template!.content_fr ?? null,
        content_de: template!.content_de ?? null,
        content_it: template!.content_it ?? null,
      }
      // Only overwrite the active language
      updatePayload[activeField] = contents[activeLang] || null

      // Update main content to reflect the active language or fallback
      const mainContent = updatePayload[activeField] ||
        template!.content_es || template!.content_en ||
        template!.content_fr || template!.content_de ||
        template!.content_it || template!.content
      updatePayload.content = mainContent
      updatePayload.variables = extractVariables(mainContent || '')

      setSaving(true)
      const { error } = await supabase.from('templates').update(updatePayload).eq('id', template!.id)
      if (error) { toast.error('Error saving: ' + error.message); setSaving(false); return }
      toast.success('Template updated')
      navigate(`/templates/${template!.id}`)

    } else {
      // When creating: save all filled languages
      const mainContent = contents.es || contents.en || contents.fr || contents.de || contents.it
      if (!mainContent) { toast.error('At least one language content is required'); return }

      setSaving(true)
      const { error, data } = await supabase.from('templates').insert({
        title: title.trim(),
        content: mainContent,
        content_es: contents.es || null,
        content_en: contents.en || null,
        content_fr: contents.fr || null,
        content_de: contents.de || null,
        content_it: contents.it || null,
        shortcut: shortcut.trim() || null,
        tags,
        variables: extractVariables(mainContent),
        category_id: null,
        created_by: profile?.id,
        owner_id: profile?.id,
      }).select().single()

      if (error) { toast.error('Error saving: ' + error.message); setSaving(false); return }
      toast.success('Template created')
      navigate(`/templates/${data.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title *</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g. Refund confirmation" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Shortcut <span className="text-xs font-normal text-slate-400">(optional, e.g. /refund)</span></label>
        <input type="text" value={shortcut} onChange={e => { let v = e.target.value; if (v && !v.startsWith('/')) v = '/' + v; setShortcut(v) }} placeholder="/shortcut" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-slate-700">
            {isEditing ? `Editing: ${LANGS.find(l => l.code === activeLang)?.label}` : 'Content by language'}
          </label>
          <span className="text-xs text-slate-400">Use {"{variable}"} for dynamic fields</span>
        </div>
        <div className="flex gap-1 mb-3 flex-wrap">
          {LANGS.map(l => {
            const hasContent = !!(contents[l.code])
            const isActive = activeLang === l.code
            return (
              <button key={l.code} type="button" onClick={() => setActiveLang(l.code)}
                className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border " +
                  (isActive
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : hasContent
                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50')}>
                {l.flag} {l.label}
                {hasContent && !isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-0.5" />}
              </button>
            )
          })}
        </div>
        {isEditing && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            ✏️ Only the <strong>{LANGS.find(l => l.code === activeLang)?.label}</strong> version will be saved. Switch tabs to edit other languages separately.
          </p>
        )}
        <textarea
          value={contents[activeLang]}
          onChange={e => setContents(prev => ({ ...prev, [activeLang]: e.target.value }))}
          placeholder={"Write the " + LANGS.find(l => l.code === activeLang)?.label + " version here..."}
          rows={10}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
        />
        {detectedVars.length > 0 && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400">Variables:</span>
            {detectedVars.map(v => <span key={v} className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-mono">{'{' + v + '}'}</span>)}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tags</label>
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
              {tag}<button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }} placeholder="Add tag... (Enter)" className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="button" onClick={addTag} className="px-3 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"><Plus className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 shadow-sm">
          <Save className="w-4 h-4" />{saving ? 'Saving...' : isEditing ? `Save ${LANGS.find(l => l.code === activeLang)?.label}` : 'Create template'}
        </button>
      </div>
    </form>
  )
}
