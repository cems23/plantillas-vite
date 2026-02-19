import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import toast from 'react-hot-toast'

export function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { toast.error('Email o contraseña incorrectos'); setLoading(false); return }
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Plantillas CS</h1>
            <p className="text-slate-500 text-sm mt-1">Acceso del equipo</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@email.com" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              {loading ? 'Entrando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">Solo para miembros del equipo</p>
        </div>
      </div>
    </div>
  )
}