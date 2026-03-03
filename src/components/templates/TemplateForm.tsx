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
  { code: 'es', field: 'content_es', flag: '🇪🇸', label: 'Spanish' },
  { code: 'en', field: 'content_en', flag: '🇬🇧', label: 'English' },
  { code: 'fr', field: 'content_fr', flag: '🇫🇷', label: 'French' },
  { code: 'de', field: 'content_de', flag: '🇩🇪', label: 'German' },
  { code: 'it', field: 'content_it', flag: '🇮🇹', label: 'Italian' },
]

export function TemplateForm({ template }: Props) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const isEditing = !!template
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [activeLang, setActiveLang] = useState('es')
  const [form, setForm] = useState({
    title: template?.title || '',
    content: template?.content || '',
    content_es: template?.content_es || '',
    content_en: template?.content_en || '',
    content_fr: template?.content_fr || '',
    content_de: template?.content_de || '',
    content_it: template?.content_it || '',

    shortcut: template?.shortcut || '',
    tags: template?.tags || [] as string[],
  })

  const detectedVars = extractVariables(form['content_' + activeLang as keyof typeof form] as string || form.content)

  function set(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !form.tags.includes(tag)) set('tags', [...form.tags, tag])
    setTagInput('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }
    const mainContent = form.content_es || form.content_en || form.content_fr || form.content_de || form.content_it
    if (!mainContent) { toast.error('At least one language content is required'); return }
    setSaving(true)

    // When editing, only save the active language tab - never overwrite others
    const langPayload: Record<string, string | null> = {}
    if (isEditing) {
      // Only update the language that the user is currently editing
      const activeField = 'content_' + activeLang
      langPayload[activeField] = (form as any)[activeField] || null
      // Preserve all other language fields from original template
      for (const l of ['es','en','fr','de','it']) {
        const field = 'content_' + l
        if (field !== activeField) {
          langPayload[field] = (template as any)?.[field] ?? null
        }
      }
    } else {
      // When creating, save all filled languages
      langPayload.content_es = form.content_es || null
      langPayload.content_en = form.content_en || null
      langPayload.content_fr = form.content_fr || null
      langPayload.content_de = form.content_de || null
      langPayload.content_it = form.content_it || null
    }

    const payload = {
      title: form.title.trim(),
      content: mainContent,
      ...langPayload,
      category_id: null,
      shortcut: form.shortcut.trim() || null,
      tags: form.tags,
      variables: extractVariables(mainContent),
    }

    let error, data
    if (isEditing) {
      const res = await supabase.from('templates').update(payload).eq('id', template!.id).select().single()
      error = res.error; data = res.data
    } else {
      const res = await supabase.from('templates').insert({ ...payload, created_by: profile?.id, owner_id: profile?.id }).select().single()
      error = res.error; data = res.data
    }

    if (error) { toast.error('Error saving: ' + error.message); setSaving(false); return }
    toast.success(isEditing ? 'Template updated' : 'Template created')
    navigate(`/templates/${data.id}`)
  }

  const activeField = ('content_' + activeLang) as keyof typeof form

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title *</label>
        <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="E.g. Refund confirmation" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Shortcut <span className="text-xs font-normal text-slate-400">(optional, e.g. /refund)</span></label>
        <input type="text" value={form.shortcut} onChange={e => { let v = e.target.value; if (v && !v.startsWith('/')) v = '/' + v; set('shortcut', v) }} placeholder="/shortcut" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-slate-700">Content by language</label>
          <span className="text-xs text-slate-400">Use {"{variable}"} for dynamic fields</span>
        </div>
        <div className="flex gap-1 mb-3">
          {LANGS.map(l => {
            const hasContent = !!(form['content_' + l.code as keyof typeof form] as string)
            return (
              <button key={l.code} type="button" onClick={() => setActiveLang(l.code)}
                className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border " +
                  (activeLang === l.code
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : hasContent
                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50')}>
                {l.flag} {l.label}
                {hasContent && activeLang !== l.code && <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-0.5" />}
              </button>
            )
          })}
        </div>
        <textarea
          value={form[activeField] as string}
          onChange={e => set(activeField, e.target.value)}
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
          {form.tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
              {tag}<button type="button" onClick={() => set('tags', form.tags.filter(t => t !== tag))}><X className="w-3 h-3" /></button>
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
          <Save className="w-4 h-4" />{saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create template'}
        </button>
      </div>
    </form>
  )
}
