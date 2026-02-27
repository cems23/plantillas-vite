import { useState, useCallback, useEffect } from 'react'
import { Upload, CheckCircle, ArrowRight, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { parseKeepFiles, extractVariables } from '../lib/utils'
import type { Category, ParsedNote } from '../types'
import toast from 'react-hot-toast'

type Step = 'upload' | 'preview' | 'importing' | 'done'

export function AdminImport() {
  const { profile } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [step, setStep] = useState<Step>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [parsed, setParsed] = useState<ParsedNote[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [categoryId, setCategoryId] = useState('')
  const [result, setResult] = useState({ imported: 0, skipped: 0 })

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data || []))
  }, [])

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter(f => f.name.endsWith('.json'))
    if (!files.length) { toast.error('Only .json files from Google Takeout are accepted'); return }
    const contents = await Promise.all(files.map(async f => ({ name: f.name, content: await f.text() })))
    const notes = parseKeepFiles(contents)
    if (!notes.length) { toast.error('No valid notes found'); return }
    setParsed(notes)
    setSelected(new Set(notes.map((_, i) => i)))
    setStep('preview')
  }, [])

  async function handleImport() {
    setStep('importing')
    const toImport = parsed.filter((_, i) => selected.has(i))
    let imported = 0, skipped = 0

    const rows = toImport.map(note => ({
      title: note.title,
      content: note.content,
      language: note.detectedLanguage,
      tags: note.tags,
      category_id: categoryId || null,
      variables: extractVariables(note.content),
      created_by: profile?.id,
    }))

    const BATCH = 50
    for (let i = 0; i < rows.length; i += BATCH) {
      const { error } = await supabase.from('templates').insert(rows.slice(i, i + BATCH))
      if (error) skipped += Math.min(BATCH, rows.length - i)
      else imported += Math.min(BATCH, rows.length - i)
    }

    await supabase.from('audit_log').insert({
      user_id: profile?.id, user_email: profile?.email,
      action: 'IMPORT', entity_type: 'template', entity_id: profile?.id,
      entity_title: `Import of ${imported} templates from Google Keep`,
    })

    setResult({ imported, skipped })
    setStep('done')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Import from Google Keep</h1>
        <p className="text-slate-500 text-sm mt-1">Bulk import your existing templates</p>
      </div>

      {step === 'upload' && (
        <div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 text-sm text-indigo-800">
            <p className="font-semibold mb-2">📥 How to export from Google Keep:</p>
            <ol className="list-decimal list-inside space-y-1 text-indigo-700">
              <li>Go to <strong>takeout.google.com</strong></li>
              <li>Click <strong>"Deselect all"</strong></li>
              <li>Enable only <strong>"Keep"</strong></li>
              <li>Create and download the export</li>
              <li>Unzip and upload the <code className="bg-white px-1 rounded">.json</code> files here</li>
            </ol>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files) }}
            onClick={() => document.getElementById('keep-input')?.click()}
            className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-colors ${isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-50'}`}
          >
            <Upload className={`w-14 h-14 mx-auto mb-4 ${isDragging ? 'text-indigo-500' : 'text-slate-300'}`} />
            <p className="text-slate-700 font-semibold text-lg mb-1">Drag your .json files here</p>
            <p className="text-slate-400 text-sm">or click to select them</p>
            <input id="keep-input" type="file" multiple accept=".json" className="hidden" onChange={e => e.target.files && processFiles(e.target.files)} />
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">{parsed.length} notes found</h2>
            <div className="flex gap-3">
              <button onClick={() => setSelected(new Set(parsed.map((_, i) => i)))} className="text-sm text-indigo-600">Select all</button>
              <button onClick={() => setSelected(new Set())} className="text-sm text-slate-500">None</button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Category (optional)</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {parsed.map((note, i) => (
                <label key={i} className="flex items-start gap-3 p-3.5 hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={selected.has(i)} onChange={e => { const next = new Set(selected); e.target.checked ? next.add(i) : next.delete(i); setSelected(next) }} className="mt-0.5 accent-indigo-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{note.title}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{note.content.substring(0, 80)}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block ${note.detectedLanguage === 'ES' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{note.detectedLanguage}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500"><strong>{selected.size}</strong> selected</span>
            <div className="flex gap-2">
              <button onClick={() => { setStep('upload'); setParsed([]) }} className="px-4 py-2 text-sm text-slate-600">Back</button>
              <button onClick={handleImport} disabled={selected.size === 0} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                Import {selected.size} notes<ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="text-center py-16">
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-5" />
          <h2 className="text-xl font-bold text-slate-900">Importing templates...</h2>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center py-10">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-5" />
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Import completed!</h2>
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-8">
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-3xl font-bold text-green-700">{result.imported}</p>
              <p className="text-sm text-green-600 mt-1">Imported</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-3xl font-bold text-slate-400">{result.skipped}</p>
              <p className="text-sm text-slate-400 mt-1">Skipped</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => { setStep('upload'); setParsed([]); setResult({ imported: 0, skipped: 0 }) }} className="px-5 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">Import more</button>
            <a href="/" className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">View templates →</a>
          </div>
        </div>
      )}
    </div>
  )
}
