import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './i18n/LanguageContext.jsx'

// ─── 主题初始化：在 React 渲染前应用 data-theme，避免闪烁 ────
const THEME_KEY = 'leftover_theme'
const DEFAULT_THEME = 'normal'
const saved = (() => { try { return localStorage.getItem(THEME_KEY) } catch { return null } })()
document.documentElement.setAttribute('data-theme', saved || DEFAULT_THEME)

// ─── 语言初始化：在 React 渲染前设置 lang 属性 ──────────────
const LANG_KEY = 'app_lang'
const savedLang = (() => { try { return localStorage.getItem(LANG_KEY) } catch { return null } })()
if (savedLang) {
  document.documentElement.setAttribute('lang', savedLang)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)
