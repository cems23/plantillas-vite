import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { TemplateForm } from '../components/templates/TemplateForm'
import type { Template } from '../types'

export function EditTemplate() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)

  // lang param lets us open directly on the right language tab
  const initialLang = searchParams.get('lang') || 'es'

  useEffect(() => {
    if (profile?.role === 'viewer') { navigate('/'); return }
    async function load() {
      const { data: t } = await supabase
        .from('templates')
        .select('id,title,content,content_es,content_en,content_fr,content_de,content_it,language,tags,shortcut,variables,use_count,category_id,is_active,updated_at,created_by')
        .eq('id', id!)
        .single()
      setTemplate(t)
      setLoading(false)
    }
    load()
  }, [id, profile])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!template) return <div className="text-center py-20 text-[#4a5878]">Template not found</div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold grad-text tracking-tight">Edit template</h1>
        <p className="text-[#8896b3] dark:text-slate-500 text-sm mt-1 font-semibold">Changes only affect the selected language tab</p>
      </div>
      <TemplateForm template={template} initialLang={initialLang} />
    </div>
  )
}
