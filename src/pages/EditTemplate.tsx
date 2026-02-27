import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { TemplateForm } from '../components/templates/TemplateForm'
import type { Template, Category } from '../types'

export function EditTemplate() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [template, setTemplate] = useState<Template | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.role === 'viewer') { navigate('/'); return }
    async function load() {
      const [{ data: t }, { data: c }] = await Promise.all([
        supabase.from('templates').select('*, category:categories(*)').eq('id', id!).single(),
        supabase.from('categories').select('*').order('name'),
      ])
      setTemplate(t); setCategories(c || []); setLoading(false)
    }
    load()
  }, [id, profile])

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
  if (!template) return <div className="text-center py-20 text-slate-500">Template not found</div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Edit template</h1>
        <p className="text-slate-500 text-sm mt-1">Modify the content</p>
      </div>
      <TemplateForm template={template} categories={categories} />
    </div>
  )
}
