import { useState, useRef, useEffect } from 'react'
import { useLang, LANG_LABELS, LANG_NAMES } from '../i18n/LanguageContext.jsx'

const LANGS = [
  { code: 'zh', label: '中', name: '中文' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ja', label: '日', name: '日本語' },
]

/**
 * 语言切换按钮 + 下拉菜单
 * 简洁模式：emoji 地球 + 缩写药丸
 * 正常模式：SVG 地球图标 + 细边框容器
 */
export default function LangSwitch({ theme }) {
  const { lang, setLang } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const isNormal = theme === 'normal'

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const currentLabel = LANG_LABELS[lang] || '中'

  const GlobeSvg = ({ size = 16 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <ellipse cx="12" cy="12" rx="4" ry="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
      <path d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10" />
    </svg>
  )

  return (
    <div className="lang-switch-container" ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={`Language: ${LANG_NAMES[lang]}`}
        className={`lang-switch-btn ${isNormal ? 'lang-switch-normal' : 'lang-switch-simple'}`}
      >
        {isNormal ? (
          <>
            <GlobeSvg size={14} />
            <span className="lang-switch-label">{currentLabel}</span>
          </>
        ) : (
          <span>{currentLabel}</span>
        )}
        <span
          className="lang-switch-arrow"
          style={{
            display: 'inline-block',
            fontSize: '8px',
            marginLeft: '2px',
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div className={`lang-switch-menu ${isNormal ? 'lang-menu-normal' : 'lang-menu-simple'}`}>
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => { setLang(l.code); setOpen(false) }}
              className={`lang-switch-item ${isNormal ? 'lang-item-normal' : 'lang-item-simple'} ${
                lang === l.code ? 'lang-item-active' : ''
              }`}
            >
              <span>{isNormal ? l.name : l.label}</span>
              {lang === l.code && (
                <span className="lang-item-check">{isNormal ? '✓' : '✓'}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
