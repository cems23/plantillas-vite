export type UserRole = 'admin' | 'editor' | 'viewer'
export type TemplateLanguage = 'ES' | 'EN'
export type TranslationLanguage = 'FR' | 'DE' | 'PT' | 'IT'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
}

export interface Template {
  id: string
  title: string
  content: string
  category_id: string | null
  language: TemplateLanguage
  tags: string[]
  shortcut: string | null
  variables: string[]
  is_active: boolean
  use_count: number
  created_by: string | null
  created_at: string
  updated_at: string
  category?: Category | null
}

export interface AuditLog {
  id: string
  user_id: string | null
  user_email: string | null
  action: string
  entity_type: string
  entity_id: string
  entity_title: string | null
  created_at: string
}

export interface ParsedNote {
  title: string
  content: string
  tags: string[]
  detectedLanguage: TemplateLanguage
}
