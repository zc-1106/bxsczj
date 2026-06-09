import { useState } from 'react'
import { loadHistory } from '../storage.js'
import { useLang } from '../i18n/LanguageContext.jsx'

export default function HistoryPanel({ onRefresh, theme }) {
  const [open, setOpen] = useState(false)
  const history = loadHistory()
  const isNormal = theme === 'normal'
  const { t } = useLang()

  const formatDate = (iso) => {
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const modeLabelSimple = { lazy: '😴', hardcore: '💪', hell: '😈' }
  const menuEmoji = ['🍲', '🍝', '🥗', '🍜', '🍛']

  return (
    <div className="rounded-[20px] bg-(--theme-surface) shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden transition-shadow duration-300 ease-out">
      <div className="relative"><div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#e8dfd5] to-transparent" /></div>
      <button type="button" onClick={() => { setOpen(!open); if (!open) onRefresh?.() }} className="flex w-full items-center justify-between px-5 py-4 text-left cursor-pointer transition-colors duration-200 ease-out hover:bg-(--theme-surface-alt)">
        <span className="text-sm font-extrabold text-[#b8a07a]">
          {isNormal ? t('history.title') : <>{'📜'} {t('history.title')}</>}
          {history.length > 0 && <span className="ml-2 text-xs text-(--theme-text-muted) font-bold">({t('history.count', history.length)})</span>}
        </span>
        <span className={`text-(--theme-text-muted) font-bold transition-transform duration-300 ease-out ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className={`border-t border-(--theme-border) px-5 pb-4 pt-3 ${isNormal ? '' : 'animate-unfold origin-top'}`}>
          {history.length === 0 ? (
            <div className="text-center py-10"><p className="text-5xl mb-3">{isNormal ? '—' : '📭'}</p><p className="text-sm font-bold text-(--theme-text-muted)">{t('history.empty')}</p></div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((entry) => (
                <div key={entry.id} className={`rounded-2xl bg-(--theme-surface-alt) px-4 py-3 border border-(--theme-border) transition-all duration-200 ease-out ${isNormal ? 'history-timeline-item' : 'hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)]'}`}>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-(--theme-text-muted)">{formatDate(entry.date)}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${isNormal ? 'bg-transparent border-[#d4c0a8] text-(--theme-text-secondary)' : 'bg-[#f5eeff] text-[#7c6da8] border-[#d4c4f0]'}`}>
                      {isNormal ? t(`mode.${entry.mode}`) : <>{modeLabelSimple[entry.mode]} {t(`mode.${entry.mode}`)}</>}
                    </span>
                    <span className="text-xs font-bold text-[#b8a07a]">{entry.ingredients?.join(', ')}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm font-bold text-[#6b9e5a]">
                    {entry.recipes?.map((r, ri) => (
                      <span key={r.name} className="inline-flex items-center gap-1">{!isNormal && menuEmoji[ri % menuEmoji.length]} {r.name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
