import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AppContextType {
  darkMode: boolean
  toggleDarkMode: () => void
  pinnedIds: string[]
  togglePin: (id: string) => void
  isPinned: (id: string) => boolean
  favoriteIds: string[]
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  viewMode: 'grid' | 'list' | 'compact'
  setViewMode: (mode: 'grid' | 'list' | 'compact') => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    const s = localStorage.getItem('darkMode')
    return s ? s === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('pinnedIds') || '[]') } catch { return [] }
  })
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('favoriteIds') || '[]') } catch { return [] }
  })
  const [viewMode, setViewModeState] = useState<'grid' | 'list' | 'compact'>(() => {
    return (localStorage.getItem('viewMode') as any) || 'grid'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  useEffect(() => { localStorage.setItem('pinnedIds', JSON.stringify(pinnedIds)) }, [pinnedIds])
  useEffect(() => { localStorage.setItem('favoriteIds', JSON.stringify(favoriteIds)) }, [favoriteIds])
  useEffect(() => { localStorage.setItem('viewMode', viewMode) }, [viewMode])

  const togglePin = (id: string) => setPinnedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const isPinned = (id: string) => pinnedIds.includes(id)
  const toggleFavorite = (id: string) => setFavoriteIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const isFavorite = (id: string) => favoriteIds.includes(id)
  const setViewMode = (mode: 'grid' | 'list' | 'compact') => setViewModeState(mode)

  return (
    <AppContext.Provider value={{ darkMode, toggleDarkMode: () => setDarkMode(d => !d), pinnedIds, togglePin, isPinned, favoriteIds, toggleFavorite, isFavorite, viewMode, setViewMode }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
