import { useState } from 'react'
import { loadHistory } from '../storage.js'

export default function HistoryPanel({ onRefresh }) {
  const [open, setOpen] = useState(false)
  const history = loadHistory()

  const formatDate = (iso) => {
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const modeLabel = { lazy: '😴 懒人', hardcore: '💪 硬核', hell: '😈 地狱' }
  const menuEmoji = ['🍲', '🍝', '🥗', '🍜', '🍛']

  return (
    <div className="rounded-[20px] bg-white
                    shadow-[0_4px_20px_rgba(0,0,0,0.04)]
                    overflow-hidden transition-shadow duration-300 ease-out">
      {/* 便签纸顶部仿纸边 */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-0.5
                        bg-gradient-to-r from-transparent via-[#e8dfd5] to-transparent" />
      </div>

      <button
        type="button"
        onClick={() => {
          setOpen(!open)
          if (!open) onRefresh?.()
        }}
        className="flex w-full items-center justify-between px-5 py-4
                   text-left cursor-pointer transition-colors duration-200 ease-out
                   hover:bg-[#faf8f5]"
      >
        <span className="text-sm font-extrabold text-[#b8a07a]">
          📜 历史记录
          {history.length > 0 && (
            <span className="ml-2 text-xs text-[#d4c8b8] font-bold">
              ({history.length} 条)
            </span>
          )}
        </span>
        <span
          className={`text-[#d4c8b8] font-bold transition-transform duration-300 ease-out ${
            open ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>

      {/* 展开内容 — 便签纸翻开动画 */}
      {open && (
        <div className="border-t border-[#f0ebe3] px-5 pb-4 pt-3
                        animate-unfold origin-top">
          {history.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-5xl mb-3">📭</p>
              <p className="text-sm font-bold text-[#d4c8b8]">
                还没有生成过食谱，快去拯救剩菜吧！
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="rounded-2xl bg-[#faf8f5] px-4 py-3
                             border border-[#f0ebe3]
                             transition-all duration-200 ease-out
                             hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-[#d4c8b8]">
                      {formatDate(entry.date)}
                    </span>
                    <span className="rounded-full bg-[#f5eeff] px-2.5 py-0.5 text-xs
                                     font-bold text-[#7c6da8] border border-[#d4c4f0]">
                      {modeLabel[entry.mode] ?? entry.mode}
                    </span>
                    <span className="text-xs font-bold text-[#b8a07a]">
                      🥬 {entry.ingredients?.join(', ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm font-bold text-[#6b9e5a]">
                    {entry.recipes?.map((r, ri) => (
                      <span key={r.name} className="inline-flex items-center gap-1">
                        {menuEmoji[ri % menuEmoji.length]} {r.name}
                      </span>
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
