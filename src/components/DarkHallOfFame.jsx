/**
 * 黑暗料理名人堂 — 深色玻璃面板
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   darkHistory: Array<{ id: string, name: string, ingredients: string[], steps: string[], score: number, date: string }>,
 *   onDelete: (id: string) => void,
 *   onClear: () => void,
 * }}
 */

const MEDALS = ['🥇', '🥈', '🥉']

function formatDate(iso) {
  try {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return iso?.slice(0, 10) ?? ''
  }
}

function DarkHallOfFame({ open, onClose, darkHistory, onDelete, onClear }) {
  // 按黑暗程度降序，同分按日期降序
  const sorted = [...darkHistory].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.date.localeCompare(a.date)
  })

  return (
    <>
      {/* 遮罩层 */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm
                   transition-opacity duration-300 ease-out
                   ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* 面板 — 从底部滑入 */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px]
                   transition-all duration-350 ease-out
                   ${open ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}
      >
        <div
          className="relative max-h-[75vh] overflow-y-auto
                     rounded-t-[24px] bg-[#1a1025]/92 backdrop-blur-xl
                     border border-white/10 border-b-0
                     shadow-[0_-8px_40px_rgba(0,0,0,0.4)]
                     px-5 pt-5 pb-8"
        >
          {/* 拖拽指示条 */}
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* 头部 */}
          <div className="flex items-center justify-between mb-5">
            {/* 标题 — 搞怪倾斜 */}
            <h2
              className="text-xl font-extrabold text-[#e8c97a] italic -rotate-1 tracking-wider"
              style={{ textShadow: '0 0 20px rgba(232,201,122,0.3)' }}
            >
              🏆 黑暗名人堂
            </h2>
            <div className="flex items-center gap-2">
              {darkHistory.length > 0 && (
                <button
                  type="button"
                  onClick={onClear}
                  className="rounded-full border border-white/15 bg-white/5
                             px-3 py-1 text-[11px] font-bold text-white/50
                             transition-all duration-200 ease-out
                             hover:bg-red-500/20 hover:border-red-400/30 hover:text-red-300
                             cursor-pointer"
                >
                  清空 🗑
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="text-white/40 transition-all duration-200 ease-out
                           hover:text-white/80 text-lg cursor-pointer leading-none"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 内容 */}
          {sorted.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-5xl mb-4">🧪</p>
              <p className="text-sm font-bold text-white/30">
                还没有黑暗料理记录
              </p>
              <p className="text-xs text-white/20 mt-1">
                切换地狱模式，开启黑暗实验！
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {sorted.map((entry, idx) => {
                const medal = idx < 3 ? MEDALS[idx] : null
                return (
                  <li
                    key={entry.id}
                    className="relative rounded-2xl bg-white/5 border border-white/8
                               px-4 py-3.5 transition-all duration-200 ease-out
                               hover:bg-white/8 hover:-translate-y-0.5"
                  >
                    {/* 排名徽章 */}
                    {medal && (
                      <span className="absolute -top-2 -left-1 text-xl drop-shadow-lg">
                        {medal}
                      </span>
                    )}

                    {/* 菜名 + 分数 */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🧪</span>
                        <h3 className="text-sm font-extrabold text-white/90">
                          {entry.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${
                              i < entry.score
                                ? 'opacity-100 drop-shadow-[0_0_6px_rgba(168,255,100,0.5)]'
                                : 'opacity-20 grayscale'
                            }`}
                          >
                            🧪
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 食材 + 步骤摘要 */}
                    <div className="mb-2 space-y-1">
                      <p className="text-[11px] font-bold text-white/40">
                        🥬 {entry.ingredients?.join('、') || '—'}
                      </p>
                      {entry.steps?.length > 0 && (
                        <p className="text-[11px] text-white/25 line-clamp-2 leading-relaxed">
                          {entry.steps.join('；')}
                        </p>
                      )}
                    </div>

                    {/* 日期 + 删除 */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white/20">
                        📅 {formatDate(entry.date)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDelete(entry.id)}
                        className="rounded-full border border-white/10 bg-white/5
                                   px-2.5 py-0.5 text-[10px] font-bold text-white/30
                                   transition-all duration-200 ease-out
                                   hover:bg-red-500/20 hover:border-red-400/30 hover:text-red-300
                                   cursor-pointer"
                      >
                        删除 ✕
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}

export default DarkHallOfFame
