import { useState } from 'react'
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
    if (error) { toast.error('Invalid email or password'); setLoading(false); return }
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#f0f4ff] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full opacity-20" style={{background: 'radial-gradient(circle, #1a6bff, transparent)'}} />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-20" style={{background: 'radial-gradient(circle, #00c6a7, transparent)'}} />

      <div className="w-full max-w-sm relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl shadow-blue-100 p-8 border border-blue-50">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img
                src="https://ensoywbchgvcwxxvdnvj.supabase.co/storage/v1/object/public/images/Screenshot%202026-02-27%20at%2001.17.26.png"
                alt="CMCSHUB"
                className="w-20 h-20 object-contain"
              />
            </div>
            <h1 className="text-2xl font-extrabold text-[#0d1f3c] tracking-tight">
              <span className="text-blue-600">CMCS</span>HUB
            </h1>
            <p className="text-[#8896b3] text-sm mt-1 font-semibold">Customer Support Templates</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#0d1f3c] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@cmcshub.com"
                className="w-full border border-blue-100 rounded-xl px-4 py-2.5 text-sm text-[#0d1f3c] placeholder-[#8896b3] focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/40 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#0d1f3c] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-blue-100 rounded-xl px-4 py-2.5 text-sm text-[#0d1f3c] placeholder-[#8896b3] focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/40 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 grad-btn text-white rounded-xl text-sm font-bold disabled:opacity-60 transition-all mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-xs text-[#8896b3] mt-6 font-semibold">Team members only</p>
        </div>
      </div>
    </div>
  )
}
