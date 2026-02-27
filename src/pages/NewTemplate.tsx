import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { TemplateForm } from '../components/templates/TemplateForm'
import type { Category } from '../types'

export function NewTemplate() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    if (profile?.role === 'viewer') { navigate('/'); return }
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data || []))
  }, [profile])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">New template</h1>
        <p className="text-slate-500 text-sm mt-1">Create a new response template</p>
      </div>
      <TemplateForm categories={categories} />
    </div>
  )
}
