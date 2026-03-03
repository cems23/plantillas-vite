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
  initialLang?: string
}

const LANGS = [
  { code: 'es', flag: '🇪🇸', label: 'Spanish' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'fr', flag: '🇫🇷', label: 'French' },
  { code: 'de', flag: '🇩🇪', label: 'German' },
  { code: 'it', flag: '🇮🇹', label: 'Italian' },
]

export function TemplateForm({ template, initialLang = 'es' }: Props) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const isEditing = !!template
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [activeLang, setActiveLang] = useState(initialLang)

  // Load existing content per language from template
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
      // Only save the active language — all others preserved from original template
      const activeField = 'content_' + activeLang
      const updatePayload: Record<string, any> = {
        title: title.trim(),
        shortcut: shortcut.trim() || null,
        tags,
        // Start with all existing language content from original
        content_es: template!.content_es ?? null,
        content_en: template!.content_en ?? null,
        content_fr: template!.content_fr ?? null,
        content_de: template!.content_de ?? null,
        content_it: template!.content_it ?? null,
      }
      // Override only the active language with new content
      updatePayload[activeField] = contents[activeLang] || null

      // Update main content field
      const mainContent = updatePayload[activeField] ||
        template!.content_es || template!.content_en ||
        template!.content_fr || template!.content_de ||
        template!.content_it || template!.content
      updatePayload.content = mainContent
      updatePayload.variables = extractVariables(mainContent || '')

      setSaving(true)
      const { error } = await supabase.from('templates').update(updatePayload).eq('id', template!.id)
      if (error) { toast.error('Error saving: ' + error.message); setSaving(false); return }
      toast.success(`${LANGS.find(l => l.code === activeLang)?.label} version saved!`)
      navigate(`/templates/${template!.id}`)

    } else {
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
      toast.success('Template created!')
      navigate(`/templates/${data.id}`)
    }
  }

  const activeLangLabel = LANGS.find(l => l.code === activeLang)?.label || ''

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0d1829] rounded-2xl border border-blue-100 dark:border-white/8 p-6 space-y-5 shadow-sm">
      <div>
        <label className="block text-sm font-bold text-[#0d1f3c] dark:text-white mb-1.5">Title *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="E.g. Refund confirmation"
          className="w-full border border-blue-100 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm bg-blue-50/40 dark:bg-[#080f1e] text-[#0d1f3c] dark:text-white placeholder-[#8896b3] dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-[#0d1f3c] dark:text-white mb-1.5">
          Shortcut <span className="text-xs font-semibold text-[#8896b3]">(optional, e.g. /refund)</span>
        </label>
        <input
          type="text"
          value={shortcut}
          onChange={e => { let v = e.target.value; if (v && !v.startsWith('/')) v = '/' + v; setShortcut(v) }}
          placeholder="/shortcut"
          className="w-full border border-blue-100 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono bg-blue-50/40 dark:bg-[#080f1e] text-[#0d1f3c] dark:text-white placeholder-[#8896b3] dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-bold text-[#0d1f3c] dark:text-white">
            {isEditing ? `Editing: ${activeLangLabel}` : 'Content by language'}
          </label>
          <span className="text-xs text-[#8896b3] font-semibold">Use {"{variable}"} for dynamic fields</span>
        </div>

        {/* Language tabs */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {LANGS.map(l => {
            const hasContent = !!(contents[l.code])
            const isActive = activeLang === l.code
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => setActiveLang(l.code)}
                className={"flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border " +
                  (isActive
                    ? 'grad-btn text-white border-transparent shadow-sm'
                    : hasContent
                      ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800/40 hover:bg-teal-100'
                      : 'bg-white dark:bg-[#080f1e] text-[#8896b3] dark:text-slate-500 border-blue-100 dark:border-white/8 hover:border-blue-300')}
              >
                {l.flag} {l.label}
                {hasContent && !isActive && <span className="w-1.5 h-1.5 rounded-full bg-teal-500 ml-0.5 flex-shrink-0" />}
              </button>
            )
          })}
        </div>

        {isEditing && (
          <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-3 py-2 mb-3 font-semibold">
            ✏️ Only <strong>{activeLangLabel}</strong> will be saved. Other languages stay untouched.
          </p>
        )}

        <textarea
          value={contents[activeLang]}
          onChange={e => setContents(prev => ({ ...prev, [activeLang]: e.target.value }))}
          placeholder={"Write the " + activeLangLabel + " version here..."}
          rows={12}
          className="w-full border border-blue-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm bg-blue-50/40 dark:bg-[#080f1e] text-[#0d1f3c] dark:text-white placeholder-[#8896b3] dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none font-mono"
        />

        {detectedVars.length > 0 && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#8896b3] font-semibold">Variables:</span>
            {detectedVars.map(v => (
              <span key={v} className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 px-1.5 py-0.5 rounded-md font-mono font-bold">
                {'{' + v + '}'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-bold text-[#0d1f3c] dark:text-white mb-1.5">Tags</label>
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full font-bold">
              {tag}
              <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
            placeholder="Add tag... (Enter)"
            className="flex-1 border border-blue-100 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-blue-50/40 dark:bg-[#080f1e] text-[#0d1f3c] dark:text-white placeholder-[#8896b3] dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-3 py-2 border border-blue-100 dark:border-white/10 rounded-xl text-[#8896b3] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-blue-50 dark:border-white/5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-sm text-[#8896b3] hover:text-[#0d1f3c] dark:hover:text-white transition-colors font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="grad-btn flex items-center gap-2 px-6 py-2.5 text-white text-sm font-bold rounded-xl disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : isEditing ? `Save ${activeLangLabel}` : 'Create template'}
        </button>
      </div>
    </form>
  )
}
