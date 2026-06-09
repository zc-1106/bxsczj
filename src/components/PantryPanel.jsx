import { useState, useRef, useEffect } from 'react'

// ─── 马卡龙色系药丸标签配色轮换 ──────────────────────────────
const MACARON_COLORS = [
  'bg-[#fdedec] border-[#f5b7b1] text-[#c0392b] hover:bg-[#fce4e2]',
  'bg-[#fef9e7] border-[#f9e79f] text-[#b7950b] hover:bg-[#fdf2c2]',
  'bg-[#ebf5fb] border-[#aed6f1] text-[#2e86c1] hover:bg-[#d6eaf8]',
  'bg-[#fdebd0] border-[#f0b27a] text-[#b9770e] hover:bg-[#fce4c1]',
  'bg-[#f5eeff] border-[#d4c4f0] text-[#7c6da8] hover:bg-[#ece0fa]',
  'bg-[#e8f8e8] border-[#b8d8b8] text-[#5a9a5a] hover:bg-[#d4f0d4]',
]

const STORAGE_KEY = 'leftover_pantry'

// ─── localStorage 读写 ──────────────────────────────────────

function loadPantry() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
  } catch {
    return []
  }
}

function savePantry(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

// ─── 组件 ──────────────────────────────────────────────────

/**
 * @param {{ onIngredientClick: (ingredient: string) => void }} props
 */
function PantryPanel({ onIngredientClick }) {
  const [items, setItems] = useState(loadPantry)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  // 持久化
  useEffect(() => {
    savePantry(items)
  }, [items])

  // 展开时自动聚焦输入框
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  // ── 添加食材（自动去重） ──
  const addItem = (val) => {
    const trimmed = val.trim()
    if (!trimmed) return
    setItems((prev) => {
      if (prev.includes(trimmed)) return prev
      return [...prev, trimmed]
    })
    setInput('')
  }

  // ── 删除食材 ──
  const removeItem = (val) => {
    setItems((prev) => prev.filter((i) => i !== val))
  }

  // ── 点击标签 → 填入主输入框 ──
  const handleTagClick = (val) => {
    onIngredientClick?.(val)
  }

  return (
    <div className="mb-3">
      {/* 触发按钮 */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-full
                   border-2 px-4 py-2 text-sm font-extrabold
                   transition-all duration-250 ease-out
                   hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)]
                   active:scale-95 cursor-pointer
                   ${open
                     ? 'bg-[#fef7cd] border-[#f0da7a] text-[#b08a3e] shadow-[0_2px_8px_rgba(240,218,122,0.3)]'
                     : 'bg-white border-[#e8dfd5] text-[#b8a07a] hover:border-[#d4c8b8]'
                   }`}
      >
        <span className="text-base">{open ? '📦' : '📦'}</span>
        <span>食材库</span>
        {items.length > 0 && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold leading-none
                           ${open
                             ? 'bg-[#f0da7a]/40 text-[#8b6914]'
                             : 'bg-[#fef9e7] text-[#b7950b] border border-[#f9e79f]'
                           }`}>
            {items.length}
          </span>
        )}
        <span className={`text-[10px] transition-transform duration-300 ${
          open ? 'rotate-180' : ''
        }`}>
          ▼
        </span>
      </button>

      {/* 展开面板 — max-height + opacity 平滑过渡 */}
      <div
        className={`overflow-hidden transition-all duration-350 ease-out ${
          open
            ? 'max-h-[500px] opacity-100 mt-3'
            : 'max-h-0 opacity-0 pointer-events-none mt-0'
        }`}
      >
        <div className="rounded-2xl bg-[#faf8f5] border border-[#f0ebe3] px-4 py-4 space-y-3">

          {/* 食材标签区域 */}
          {items.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {items.map((item, idx) => {
                const color = MACARON_COLORS[idx % MACARON_COLORS.length]
                return (
                  <span
                    key={item}
                    className={`inline-flex items-center gap-1 rounded-full
                               border-2 px-3.5 py-1.5 text-xs font-extrabold
                               transition-all duration-200 ease-out
                               hover:scale-105 hover:-translate-y-0.5
                               hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]
                               cursor-pointer select-none
                               ${color}`}
                  >
                    {/* 点击标签主体 → 填入输入框 */}
                    <span
                      onClick={() => handleTagClick(item)}
                      className="cursor-pointer"
                      title={`点击添加到输入框：${item}`}
                    >
                      {item}
                    </span>
                    {/* × 删除按钮 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeItem(item)
                      }}
                      className="ml-0.5 opacity-50 transition-all duration-200 ease-out
                                 hover:opacity-100 hover:rotate-90 hover:text-red-500
                                 cursor-pointer text-sm leading-none"
                      title={`删除：${item}`}
                    >
                      ×
                    </button>
                  </span>
                )
              })}
            </div>
          ) : (
            <p className="text-xs font-bold text-[#d4c8b8] text-center py-1">
              还没有常备食材哦，添加几个吧～
            </p>
          )}

          {/* 添加行：短输入框 + 添加按钮 */}
          <div className="flex gap-2">
            <input
              type="text"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addItem(input)
                }
              }}
              placeholder='例如：鸡蛋、牛奶'
              className="flex-1 rounded-xl border-2 border-[#f0ebe3] bg-white
                         px-3.5 py-2 text-xs font-bold text-gray-500
                         placeholder:text-[#d4c8b8]
                         outline-none transition-all duration-200 ease-out
                         focus:border-[#f4b860] focus:shadow-[0_0_0_3px_rgba(244,184,96,0.08)]"
            />
            <button
              type="button"
              onClick={() => addItem(input)}
              className="rounded-xl border-2 border-[#f0ebe3] bg-white
                         px-4 py-2 text-xs font-extrabold text-[#b8a07a]
                         transition-all duration-200 ease-out
                         hover:bg-[#fef9e7] hover:border-[#f9e79f]
                         hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]
                         active:scale-95 cursor-pointer
                         whitespace-nowrap"
            >
              ＋ 添加
            </button>
          </div>

          {/* 底部计数提示 */}
          <p className="text-center text-[11px] font-semibold text-[#d4c8b8]"
             style={{ fontFamily: "'Nunito', system-ui, -apple-system, sans-serif" }}>
            {items.length > 0
              ? `你有 ${items.length} 种食材可以拯救`
              : '添加常备食材，拯救更方便 ✨'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PantryPanel
