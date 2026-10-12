import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeContext } from './context'
import { ACCENTS, DEFAULT_ACCENT, accentTokens } from './accents'

const STORAGE_KEY = 'modshop.theme'
const ACCENT_KEY = 'modshop.accent'
const DEFAULT_THEME = 'light'

function readStored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

function readAccent() {
  try {
    const value = localStorage.getItem(ACCENT_KEY)
    return ACCENTS.some((accent) => accent.id === value) ? value : DEFAULT_ACCENT
  } catch {
    return DEFAULT_ACCENT
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStored)
  const [accent, setAccent] = useState(readAccent)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
    }
  }, [theme])

  useEffect(() => {
    const root = document.documentElement

    if (accent === DEFAULT_ACCENT) {
      root.style.removeProperty('--series-1')
      root.style.removeProperty('--accent-soft')
    } else {
      const tokens = accentTokens(accent, theme)
      root.style.setProperty('--series-1', tokens.accent)
      root.style.setProperty('--accent-soft', tokens.soft)
    }

    try {
      localStorage.setItem(ACCENT_KEY, accent)
    } catch {
    }
  }, [accent, theme])

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({ theme, setTheme, toggle, accent, setAccent }),
    [theme, toggle, accent],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
