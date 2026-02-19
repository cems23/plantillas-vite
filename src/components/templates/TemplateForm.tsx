import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, X, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { extractVariables } from '../../lib/utils'
import type { Template, Category } from '../../types'
import toast from 'react-hot-toast'

interface Props {
  template?: Template
  categories: Category[]
}

export function TemplateForm({ template, categories }: Props) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const isEditing = !!template
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [form, setForm] = useState({
    title: template?.title || '',
    content: template?.content || '',
    language: template?.language || 'ES',
    category_id: template?.category_id || '',
    shortcut: template?.shortcut || '',
    tags: template?.tags || [] as string[],
  })

  const detectedVars = extractVariables(form.content)

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
    if (!form.title.trim() || !form.content.trim()) { toast.error('Title and content are required'); return }
    setSaving(true)

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      language: form.language,
      category_id: form.category_id || null,
      shortcut: form.shortcut.trim() || null,
      tags: form.tags,
      updated_by: profile?.id,
    }

    let error, data
    if (isEditing) {
      const res = await supabase.from('templates').update(payload).eq('id', template!.id).select().single()
      error = res.error; data = res.data
    } else {
      const res = await supabase.from('templates').insert({ ...payload, created_by: profile?.id }).select().single()
      error = res.error; data = res.data
    }

    if (error) { toast.error('Error saving: ' + error.message); setSaving(false); return }
    toast.success(isEditing ? 'Template updated' : 'Template created')
    navigate('/templates/' + data.id)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Title *</label>
        <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Refund confirmation" className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Language</label>
          <select value={form.language} onChange={e => set('language', e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="ES">🇪🇸 Spanish</option>
            <option value="EN">🇬🇧 English</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
          <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">No category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Shortcut <span className="text-xs font-normal text-slate-400">(optional, e.g. /refund)</span></label>
        <input type="text" value={form.shortcut} onChange={e => { let v = e.target.value; if (v && !v.startsWith('/')) v = '/' + v; set('shortcut', v) }} placeholder="/shortcut" className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-mono bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Content *</label>
          <span className="text-xs text-slate-400">Use {'{variable}'} for dynamic fields</span>
        </div>
        <textarea value={form.content} onChange={e => set('content', e.target.value)} placeholder={'Hello {name},\n\nYour order {order} has been...'} rows={10} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono" required />
        {detectedVars.length > 0 && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400">Variables detected:</span>
            {detectedVars.map(v => <span key={v} className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-mono">{'{' + v + '}'}</span>)}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tags <span className="text-xs font-normal text-slate-400">(click on tags in the main view to assign colors)</span></label>
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {form.tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
              {tag}<button type="button" onClick={() => set('tags', form.tags.filter(t => t !== tag))}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }} placeholder="Add tag... (press Enter)" className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="button" onClick={addTag} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"><Plus className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
        <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800">Cancel</button>
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 shadow-sm">
          <Save className="w-4 h-4" />{saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create template'}
        </button>
      </div>
    </form>
  )
}
