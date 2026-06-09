import { useState, useRef, useEffect } from 'react'
import { useLang } from '../i18n/LanguageContext.jsx'

const MACARON_COLORS = [
  'bg-[#fdedec] border-[#f5b7b1] text-[#c0392b] hover:bg-[#fce4e2]',
  'bg-[#fef9e7] border-[#f9e79f] text-[#b7950b] hover:bg-[#fdf2c2]',
  'bg-[#ebf5fb] border-[#aed6f1] text-[#2e86c1] hover:bg-[#d6eaf8]',
  'bg-[#fdebd0] border-[#f0b27a] text-[#b9770e] hover:bg-[#fce4c1]',
  'bg-[#f5eeff] border-[#d4c4f0] text-[#7c6da8] hover:bg-[#ece0fa]',
  'bg-[#e8f8e8] border-[#b8d8b8] text-[#5a9a5a] hover:bg-[#d4f0d4]',
]

const STORAGE_KEY = 'leftover_pantry'

function loadPantry() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [] } catch { return [] } }
function savePantry(items) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) }

function PantryPanel({ onIngredientClick, theme }) {
  const [items, setItems] = useState(loadPantry)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const inputRef = useRef(null)
  const isNormal = theme === 'normal'
  const { t } = useLang()

  useEffect(() => { savePantry(items) }, [items])
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus() }, [open])

  const addItem = (val) => {
    const trimmed = val.trim()
    if (!trimmed) return
    setItems((prev) => { if (prev.includes(trimmed)) return prev; return [...prev, trimmed] })
    setInput('')
  }
  const removeItem = (val) => { setItems((prev) => prev.filter((i) => i !== val)) }
  const handleTagClick = (val) => { onIngredientClick?.(val) }

  return (
    <div className="mb-3">
      <button type="button" onClick={() => setOpen((o) => !o)} className={`inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-extrabold transition-all duration-200 ease-out cursor-pointer ${isNormal ? (open ? 'bg-[#8b5e3c] border-[#8b5e3c] text-white' : 'bg-(--theme-surface) border-(--theme-border-light) text-(--theme-text-secondary) hover:border-(--theme-text-muted)') : (open ? 'bg-[#fef7cd] border-[#f0da7a] text-[#b08a3e] shadow-[0_2px_8px_rgba(240,218,122,0.3)] hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)] active:scale-95' : 'bg-(--theme-surface) border-(--theme-border-light) text-(--theme-text-secondary) hover:border-(--theme-text-muted) hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)] active:scale-95')}`}>
        <span className="text-base">{isNormal ? (open ? '−' : '+') : '📦'}</span>
        <span>{t('pantry.title')}</span>
        {items.length > 0 && <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold leading-none ${isNormal ? (open ? 'bg-white/20 text-white' : 'bg-[#faf3e8] text-(--theme-text-secondary) border border-[#d4c0a8]') : (open ? 'bg-[#f0da7a]/40 text-[#8b6914]' : 'bg-[#fef9e7] text-[#b7950b] border border-[#f9e79f]')}`}>{items.length}</span>}
        <span className={`text-[10px] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      <div className={`overflow-hidden transition-all duration-350 ease-out ${open ? 'max-h-[500px] opacity-100 mt-3' : 'max-h-0 opacity-0 pointer-events-none mt-0'}`}>
        <div className={`rounded-2xl border px-4 py-4 space-y-3 ${isNormal ? 'pref-panel' : 'bg-(--theme-surface-alt) border-(--theme-border)'}`}>
          {items.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {items.map((item, idx) => {
                const color = MACARON_COLORS[idx % MACARON_COLORS.length]
                return (
                  <span key={item} className={`inline-flex items-center gap-1 border-2 px-3.5 py-1.5 text-xs font-extrabold transition-all duration-200 ease-out cursor-pointer select-none ${isNormal ? 'pantry-tag' : `rounded-full hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${color}`}`}>
                    <span onClick={() => handleTagClick(item)} className="cursor-pointer" title={item}>{item}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeItem(item) }} className="ml-0.5 opacity-50 transition-all duration-200 ease-out hover:opacity-100 hover:rotate-90 hover:text-red-500 cursor-pointer text-sm leading-none" title={`${t('dark.delete')}: ${item}`}>×</button>
                  </span>
                )
              })}
            </div>
          ) : <p className="text-xs font-bold text-(--theme-text-muted) text-center py-1">{t('pantry.empty')}</p>}
          <div className="flex gap-2">
            <input type="text" ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(input) } }} placeholder={t('pantry.example')} className="flex-1 rounded-xl border-2 border-(--theme-border) bg-(--theme-surface) px-3.5 py-2 text-xs font-bold text-gray-500 placeholder:text-(--theme-text-muted) outline-none transition-all duration-200 ease-out focus:border-[#f4b860] focus:shadow-[0_0_0_3px_rgba(244,184,96,0.08)]" />
            <button type="button" onClick={() => addItem(input)} className={`rounded-xl border-2 px-4 py-2 text-xs font-extrabold transition-all duration-200 ease-out cursor-pointer whitespace-nowrap ${isNormal ? 'border-[#d4c0a8] bg-(--theme-surface) text-(--theme-text-secondary) hover:bg-[#e8d5c0]' : 'border-(--theme-border) bg-(--theme-surface) text-(--theme-text-secondary) hover:bg-[#fef9e7] hover:border-[#f9e79f] hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] active:scale-95'}`}>{t('pantry.add')}</button>
          </div>
          <p className="text-center text-[11px] font-semibold text-(--theme-text-muted)" style={{ fontFamily: "'Nunito', system-ui, -apple-system, sans-serif" }}>{items.length > 0 ? t('pantry.count', items.length) : t('pantry.hint')}</p>
        </div>
      </div>
    </div>
  )
}

export default PantryPanel
