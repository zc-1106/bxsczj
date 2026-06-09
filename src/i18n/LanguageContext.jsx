import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getTranslation } from './translations.js'

const LANG_KEY = 'app_lang'

function detectBrowserLang() {
  try {
    const nav = navigator.language || navigator.userLanguage || ''
    const code = nav.slice(0, 2).toLowerCase()
    if (code === 'zh') return 'zh'
    if (code === 'ja') return 'ja'
    if (code === 'en') return 'en'
  } catch { /* ignore */ }
  return 'zh'
}

function loadLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === 'zh' || saved === 'en' || saved === 'ja') return saved
  } catch { /* ignore */ }
  return detectBrowserLang()
}

function saveLang(lang) {
  try { localStorage.setItem(LANG_KEY, lang) } catch { /* ignore */ }
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(loadLang)

  const setLang = useCallback((l) => {
    setLangState(l)
    saveLang(l)
    document.documentElement.setAttribute('lang', l)
  }, [])

  // 初始化时设置 lang 属性
  useEffect(() => {
    document.documentElement.setAttribute('lang', lang)
  }, [lang])

  const t = useCallback(
    (key, ...args) => {
      const val = getTranslation(lang, key)
      if (typeof val === 'function') return val(...args)
      return val
    },
    [lang],
  )

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}

export { LANG_LABELS, LANG_NAMES } from './translations.js'
