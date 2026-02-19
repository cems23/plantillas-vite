import { createContext, useContext, useEffect, useState } from 'react'

interface AppContextType {
  darkMode: boolean
  toggleDarkMode: () => void
  pinnedIds: Set<string>
  togglePin: (id: string) => void
  isPinned: (id: string) => boolean
}

const AppContext = createContext<AppContextType>({} as AppContextType)

export function AppProvider({ children, userId }: { children: React.ReactNode; userId?: string }) {
  const [darkMode, setDarkMode] = useState(false)
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const stored = localStorage.getItem('darkMode')
    if (stored === 'true') { setDarkMode(true); document.documentElement.classList.add('dark') }
    const pins = localStorage.getItem('pinned_' + userId)
    if (pins) setPinnedIds(new Set(JSON.parse(pins)))
  }, [userId])

  function toggleDarkMode() {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('darkMode', String(next))
    document.documentElement.classList.toggle('dark', next)
  }

  function togglePin(id: string) {
    const next = new Set(pinnedIds)
    next.has(id) ? next.delete(id) : next.add(id)
    setPinnedIds(next)
    localStorage.setItem('pinned_' + userId, JSON.stringify(Array.from(next)))
  }

  function isPinned(id: string) { return pinnedIds.has(id) }

  return <AppContext.Provider value={{ darkMode, toggleDarkMode, pinnedIds, togglePin, isPinned }}>{children}</AppContext.Provider>
}

export function useApp() { return useContext(AppContext) }
