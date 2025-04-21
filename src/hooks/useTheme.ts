// src/hooks/useTheme.ts (示例)
import { useState, useEffect, useCallback } from 'react'
import { themes, ThemeName } from '@/themes/themes'

const useTheme = (defaultTheme: ThemeName = 'light') => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(defaultTheme)

  useEffect(() => {
    const theme: any = themes[currentTheme]
    if (theme) {
      const root = window.document.documentElement
      for (const key in theme) {
        root.style.setProperty(key, theme[key])
      }
    }
  }, [currentTheme])

  const setTheme = useCallback((themeName: ThemeName) => {
    setCurrentTheme(themeName)
  }, [])

  return { currentTheme, setTheme }
}

export default useTheme

export type { ThemeName } from '@/themes/themes'
