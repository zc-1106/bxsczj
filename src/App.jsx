import { useState, useEffect, useRef } from 'react'
import { fetchRecipes } from './api.js'
import {
  saveHistoryEntry,
  incrementUsageCount,
  checkAchievement,
  getAchievementBadges,
} from './storage.js'
import HistoryPanel from './components/HistoryPanel.jsx'
import AchievementToast from './components/AchievementToast.jsx'
import PantryPanel from './components/PantryPanel.jsx'
import { playClick, playSuccess, playAchievement, playError, isMuted, toggleMute } from './sound.js'
import { loadDarkHistory, saveDarkHistory, createDarkEntry } from './darkStorage.js'
import DarkHallOfFame from './components/DarkHallOfFame.jsx'

// ─── 常量 ────────────────────────────────────────────────────

const QUICK_TAGS = [
  { label: '🥚 鸡蛋', value: '鸡蛋', color: 'bg-[#fef9e7] border-[#f9e79f] text-[#b7950b] hover:bg-[#fdf2c2]' },
  { label: '🍅 番茄', value: '番茄', color: 'bg-[#fdedec] border-[#f5b7b1] text-[#c0392b] hover:bg-[#fce4e2]' },
  { label: '🥔 土豆', value: '土豆', color: 'bg-[#fef9e7] border-[#e8da8c] text-[#9c7c38] hover:bg-[#fdf3d0]' },
  { label: '🧅 洋葱', value: '洋葱', color: 'bg-[#ebf5fb] border-[#aed6f1] text-[#2e86c1] hover:bg-[#d6eaf8]' },
  { label: '🍗 鸡胸肉', value: '鸡胸肉', color: 'bg-[#fdebd0] border-[#f0b27a] text-[#b9770e] hover:bg-[#fce4c1]' },
]

const MODES = [
  { key: 'lazy', label: '😴', desc: '懒人模式' },
  { key: 'hardcore', label: '💪', desc: '硬核模式' },
  { key: 'hell', label: '😈', desc: '地狱模式' },
]

const WELCOME_MESSAGES = [
  '今天想吃啥？',
  '剩菜交给我！',
  '冰箱里有宝藏哦～',
  '让我来拯救你的胃！',
  '打开冰箱，解锁美味！',
]

const COOKING_MESSAGES = [
  '正在翻冰箱...',
  '锅已经热好了！',
  '让我想想怎么搭配...',
  '闻到香味了吗？',
  '大厨正在创作中...',
]

// ─── 口味偏好预设 ──────────────────────────────────────────

const TASTE_PRESETS = [
  { label: '🌶️ 偏辣', value: '偏辣', color: 'bg-[#fdedec] border-[#f5b7b1] text-[#c0392b]' },
  { label: '🍬 偏甜', value: '偏甜', color: 'bg-[#fdebd0] border-[#f0b27a] text-[#b9770e]' },
  { label: '🥬 清淡', value: '清淡', color: 'bg-[#e8f8e8] border-[#b8d8b8] text-[#5a9a5a]' },
  { label: '🍜 重口味', value: '重口味', color: 'bg-[#f5eeff] border-[#d4c4f0] text-[#7c6da8]' },
  { label: '🍋 酸爽', value: '酸爽', color: 'bg-[#fef9e7] border-[#f9e79f] text-[#b7950b]' },
  { label: '🧈 奶油党', value: '奶油党', color: 'bg-[#ebf5fb] border-[#aed6f1] text-[#2e86c1]' },
]

const TOOL_OPTIONS = [
  { label: '🔌 只有微波炉', value: '只有微波炉' },
  { label: '🚫 没有烤箱', value: '没有烤箱' },
  { label: '🍟 只能用空气炸锅', value: '只能用空气炸锅' },
  { label: '🍚 有电饭煲', value: '有电饭煲' },
]

// ─── 工具函数：AI 文本中提取 JSON ─────────────────────────────

function extractJson(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/)
  if (fenced) return fenced[1]
  const plainFence = text.match(/```\s*([\s\S]*?)\s*```/)
  if (plainFence) return plainFence[1]
  return text
}

// ─── localStorage 购物清单 ────────────────────────────────────

function loadShoppingList() {
  try { return JSON.parse(localStorage.getItem('leftover_shopping_list')) ?? [] }
  catch { return [] }
}
function saveShoppingList(list) {
  localStorage.setItem('leftover_shopping_list', JSON.stringify(list))
}

// ─── localStorage 口味偏好 ──────────────────────────────────

const PREFS_KEY = 'leftover_preferences'
const DEFAULT_PREFS = { restrictions: [], tastes: [], tools: [], servings: 2 }

function loadPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY))
    if (saved && typeof saved === 'object') {
      return {
        restrictions: saved.restrictions ?? [],
        tastes: saved.tastes ?? [],
        tools: saved.tools ?? [],
        servings: saved.servings ?? 2,
      }
    }
    return { ...DEFAULT_PREFS }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}
function savePreferences(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

// ─── 组件 ────────────────────────────────────────────────────

function App() {
  // ---- 输入 & 模式 ----
  const [ingredients, setIngredients] = useState('')
  const [mode, setMode] = useState('lazy')

  // ---- 请求状态 ----
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [streamingText, setStreamingText] = useState('')
  const [recipes, setRecipes] = useState(null)

  const cancelRef = useRef(null)

  // ---- 购物清单 ----
  const [shoppingList, setShoppingList] = useState(loadShoppingList)
  useEffect(() => { saveShoppingList(shoppingList) }, [shoppingList])

  // ---- 成就 ----
  const [achievement, setAchievement] = useState(null)
  const [badges] = useState(getAchievementBadges)

  // ---- 随机文案 ----
  const [welcomeMsg] = useState(
    () => WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)],
  )
  const [cookingMsg] = useState(
    () => COOKING_MESSAGES[Math.floor(Math.random() * COOKING_MESSAGES.length)],
  )

  // ---- 静音状态 ----
  const [muted, setMuted] = useState(isMuted)
  const handleToggleMute = () => setMuted(toggleMute())

  // ---- 黑暗料理 ----
  const [darkHistory, setDarkHistory] = useState(loadDarkHistory)
  const [hallOpen, setHallOpen] = useState(false)
  const darkEntryMapRef = useRef({})
  useEffect(() => { saveDarkHistory(darkHistory) }, [darkHistory])

  const handleRateDark = (recipeName, score) => {
    const entryId = darkEntryMapRef.current[recipeName]
    if (!entryId) return
    setDarkHistory((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, score } : e)),
    )
  }

  const handleDeleteDark = (id) => {
    setDarkHistory((prev) => prev.filter((e) => e.id !== id))
    // 同步清理映射
    darkEntryMapRef.current = Object.fromEntries(
      Object.entries(darkEntryMapRef.current).filter(([, v]) => v !== id),
    )
  }

  const handleClearDark = () => {
    setDarkHistory([])
    darkEntryMapRef.current = {}
  }

  // ---- 搜索菜单 ----
  const [searchMenuIdx, setSearchMenuIdx] = useState(null)
  const searchMenuRef = useRef(null)

  // 点击外部关闭搜索菜单
  useEffect(() => {
    if (searchMenuIdx == null) return
    const handler = (e) => {
      if (searchMenuRef.current && !searchMenuRef.current.contains(e.target)) {
        setSearchMenuIdx(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [searchMenuIdx])

  const SEARCH_OPTIONS = [
    {
      label: '📺 B站视频教程',
      emoji: '🎬',
      tip: '搜索做法视频',
      url: (name) =>
        `https://search.bilibili.com/all?keyword=${encodeURIComponent(name + ' 做法')}`,
      color: 'bg-[#e8f4fd] border-[#b8d4f0] text-[#4a8bc2] hover:bg-[#d4ebfa]',
    },
    {
      label: '📺 YouTube 教程',
      emoji: '🌍',
      tip: '搜索视频教程',
      url: (name) =>
        `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' recipe')}`,
      color: 'bg-[#fde8e8] border-[#f0b8b8] text-[#c24a4a] hover:bg-[#fcd8d8]',
    },
    {
      label: '📝 下厨房图文',
      emoji: '📖',
      tip: '搜索图文菜谱',
      url: (name) =>
        `https://www.xiachufang.com/search/?keyword=${encodeURIComponent(name)}`,
      color: 'bg-[#e8f8e8] border-[#b8d8b8] text-[#5a9a5a] hover:bg-[#d4f0d4]',
    },
  ]

  const openSearch = (recipeName, platformIdx) => {
    const { url } = SEARCH_OPTIONS[platformIdx]
    window.open(url(recipeName), '_blank', 'noopener')
    setSearchMenuIdx(null)
  }

  // ---- 口味偏好 ----
  const [preferences, setPreferences] = useState(loadPreferences)
  const [prefOpen, setPrefOpen] = useState(false)
  const [restrictionInput, setRestrictionInput] = useState('')
  const restrictionInputRef = useRef(null)

  // 持久化偏好
  useEffect(() => { savePreferences(preferences) }, [preferences])

  const addRestriction = (val) => {
    const trimmed = val.trim()
    if (!trimmed) return
    setPreferences((p) => {
      if (p.restrictions.includes(trimmed)) return p
      return { ...p, restrictions: [...p.restrictions, trimmed] }
    })
    setRestrictionInput('')
  }

  const removeRestriction = (val) => {
    setPreferences((p) => ({
      ...p,
      restrictions: p.restrictions.filter((r) => r !== val),
    }))
  }

  const toggleTaste = (val) => {
    setPreferences((p) => ({
      ...p,
      tastes: p.tastes.includes(val)
        ? p.tastes.filter((t) => t !== val)
        : [...p.tastes, val],
    }))
  }

  const toggleTool = (val) => {
    setPreferences((p) => ({
      ...p,
      tools: p.tools.includes(val)
        ? p.tools.filter((t) => t !== val)
        : [...p.tools, val],
    }))
  }

  const setServings = (n) => {
    setPreferences((p) => ({ ...p, servings: Math.min(6, Math.max(1, n)) }))
  }

  const applyPreferences = () => {
    setPrefOpen(false)
  }

  // 偏好摘要文本
  const preferenceSummary = () => {
    const parts = []
    if (preferences.tastes.length > 0) parts.push(...preferences.tastes.map((t) => {
      const preset = TASTE_PRESETS.find((p) => p.value === t)
      return `${preset?.label?.split(' ')[0] ?? ''}${t}`
    }))
    if (preferences.restrictions.length > 0) parts.push(...preferences.restrictions.map((r) => `🚫${r}`))
    if (preferences.tools.length > 0) parts.push(`🔧${preferences.tools[0]}${preferences.tools.length > 1 ? ` +${preferences.tools.length - 1}` : ''}`)
    if (preferences.servings > 1) parts.push(`🍽️${preferences.servings}人份`)
    return parts
  }

  // 是否有偏好
  const hasPreferences =
    preferences.restrictions.length > 0 ||
    preferences.tastes.length > 0 ||
    preferences.tools.length > 0 ||
    preferences.servings > 1

  // ── 快捷标签 ─────────────────────────────────────────────

  const handleTagClick = (tag) => {
    try { playClick() } catch { /* noop */ }
    setIngredients((prev) => {
      const list = prev.split(',').map((s) => s.trim()).filter(Boolean)
      if (list.includes(tag)) return prev
      list.push(tag)
      return list.join(', ')
    })
  }

  // ── 拯救剩菜 ─────────────────────────────────────────────

  const handleSave = async () => {
    const list = ingredients.split(',').map((s) => s.trim()).filter(Boolean)
    if (list.length === 0) {
      try { playError() } catch { /* noop */ }
      setError('请至少输入一种食材 ✋')
      return
    }

    setLoading(true)
    setError(null)
    setStreamingText('')
    setRecipes(null)

    try {
      const { cancel, result } = fetchRecipes(list, mode, {
        onChunk: (chunk) => setStreamingText((prev) => prev + chunk),
        preferences: hasPreferences ? preferences : undefined,
      })
      cancelRef.current = cancel
      const fullText = await result

      try {
        const jsonText = extractJson(fullText)
        const parsed = JSON.parse(jsonText)
        if (parsed?.recipes?.length > 0) {
          setRecipes(parsed.recipes)

          // 地狱模式 → 自动存入黑暗料理历史
          if (mode === 'hell') {
            const newMap = { ...darkEntryMapRef.current }
            const newEntries = parsed.recipes.map((r) => {
              const entry = createDarkEntry(r, list)
              newMap[r.name] = entry.id
              return entry
            })
            darkEntryMapRef.current = newMap
            setDarkHistory((prev) => [...newEntries, ...prev])
          }

          try { playSuccess() } catch { /* noop */ }

          const newCount = incrementUsageCount()
          const unlocked = checkAchievement(newCount)
          if (unlocked) {
            setAchievement(unlocked)
            try { playAchievement() } catch { /* noop */ }
          }

          saveHistoryEntry({ ingredients: list, mode, recipes: parsed.recipes })
        } else {
          try { playError() } catch { /* noop */ }
          setError('AI 返回了空食谱，试试换一批食材')
        }
      } catch { /* 解析失败，展示 raw text */ }
    } catch (err) {
      try { playError() } catch { /* noop */ }
      setError(err.message || '未知错误，请稍后重试')
    } finally {
      setLoading(false)
      cancelRef.current = null
    }
  }

  const handleCancel = () => cancelRef.current?.()

  // ── 购物清单操作 ──────────────────────────────────────────

  const addToShoppingList = (missingItems) => {
    setShoppingList((prev) => {
      const next = [...prev]
      for (const item of missingItems) {
        if (item.startsWith('⚠️')) continue
        if (!next.includes(item)) next.push(item)
      }
      return next
    })
  }

  const removeFromShoppingList = (item) =>
    setShoppingList((prev) => prev.filter((i) => i !== item))
  const clearShoppingList = () => setShoppingList([])

  // ── 难度星星 ──────────────────────────────────────────────

  const renderStars = (level) => (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < level ? 'text-[#f4b860]' : 'text-gray-200'}>
          ★
        </span>
      ))}
    </span>
  )

  // ── 结果展示区 ────────────────────────────────────────────

  const renderResultArea = () => {
    // 错误
    if (error) {
      return (
        <div className="animate-pop rounded-[20px] bg-white px-6 py-10 text-center
                        shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <p className="text-5xl mb-3">😿</p>
          <p className="text-[#e07b5a] font-bold text-base">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="mt-4 rounded-full border-2 border-[#f0c4b0] bg-[#fef5f1] px-5 py-2
                       text-sm font-bold text-[#d4856b] transition-all duration-200 ease-out
                       hover:bg-[#fde8df] hover:-translate-y-0.5 cursor-pointer"
          >
            知道啦
          </button>
        </div>
      )
    }

    // 加载中（有打字机内容）
    if (loading && streamingText) {
      return (
        <div className="rounded-[20px] bg-white px-6 py-5
                        shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-[#b8a07a]">
              <span className="animate-spatula inline-block text-lg">🍳</span>
              {cookingMsg}
            </span>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-full border-2 border-[#e8dfd5] px-3 py-1 text-xs
                         font-bold text-[#c4b8a8] transition-all duration-200 ease-out
                         hover:bg-[#faf8f5] hover:-translate-y-0.5 cursor-pointer"
            >
              不要了
            </button>
          </div>
          <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-500
                          leading-relaxed max-h-80 overflow-y-auto">
            {streamingText}
            <span className="inline-block animate-cursor-blink ml-0.5 select-none"
                  aria-hidden="true">🥕</span>
          </pre>
        </div>
      )
    }

    // 加载中（等待首个 chunk）— 食材弹跳动画
    if (loading && !streamingText) {
      return (
        <div className="rounded-[20px] bg-white px-6 py-14 text-center
                        shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl animate-ingredient-1 inline-block">🥚</span>
            <span className="text-4xl animate-ingredient-2 inline-block">🍅</span>
            <span className="text-4xl animate-ingredient-3 inline-block">🧅</span>
          </div>
          <p className="text-[#c4b8a8] font-bold text-base">
            {cookingMsg}
          </p>
          <button
            type="button"
            onClick={handleCancel}
            className="mt-5 rounded-full border-2 border-[#e8dfd5] px-5 py-2 text-sm
                       font-bold text-[#c4b8a8] transition-all duration-200 ease-out
                       hover:bg-[#faf8f5] hover:-translate-y-0.5 cursor-pointer"
          >
            取消
          </button>
        </div>
      )
    }

    // 已完成 — 食谱卡片
    if (!loading && recipes) {
      return (
        <div className="space-y-4">
          <p className="text-center text-sm font-bold text-[#8db580]">
            🎉 {recipes.length} 个食谱新鲜出炉！
          </p>
          {recipes.map((recipe, idx) => (
            <div
              key={idx}
              className="animate-pop relative rounded-[20px] bg-white
                         px-6 pt-7 pb-5
                         shadow-[0_4px_20px_rgba(0,0,0,0.04)]
                         transition-all duration-250 ease-out
                         hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
            >
              {/* 手绘风格标签 "今日拯救" */}
              <div className="absolute -top-0.5 left-4 -rotate-3
                              rounded-b-lg bg-[#fef7cd] px-4 py-1.5
                              border border-[#f0da7a] border-t-0
                              shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
                <span className="text-xs font-extrabold text-[#b08a3e] tracking-wide">
                  ✨ 今日拯救
                </span>
              </div>

              {/* 菜名行 */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-2xl">
                  {['🍲', '🍝', '🥗', '🍜', '🍛'][idx % 5]}
                </span>
                <h3 className="text-lg font-extrabold text-gray-800">
                  {recipe.name}
                </h3>
                <span className="rounded-full bg-[#fef9e7] px-3 py-1 text-xs font-bold
                                 text-[#b7950b] border border-[#f9e79f]">
                  ⏱ {recipe.time}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-50
                                 px-2.5 py-0.5 text-xs font-bold text-gray-400
                                 border border-gray-100">
                  {renderStars(recipe.difficulty)}
                </span>
              </div>

              {/* 步骤 — 手绘圆图标 */}
              <ol className="mb-4 space-y-2">
                {recipe.steps?.map((step, si) => (
                  <li key={si} className="flex gap-3 text-sm text-gray-600 items-start">
                    {/* 手绘风格数字圈 */}
                    <span className="shrink-0 inline-flex items-center justify-center
                                     w-6 h-6 rounded-full border-2 border-dashed
                                     border-[#f4b860] text-xs font-extrabold text-[#e0963a]">
                      {si + 1}
                    </span>
                    <span className="leading-relaxed pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>

              {/* 缺的调料 + 加入购物清单 */}
              {recipe.missing?.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">
                    🛒 需要购买：
                  </span>
                  {recipe.missing.map((item, mi) => (
                    <span
                      key={mi}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                        item.startsWith('⚠️')
                          ? 'bg-[#fdedec] text-[#c0392b] border-[#f5b7b1]'
                          : 'bg-[#fdebd0] text-[#b9770e] border-[#f0b27a]'
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => addToShoppingList(recipe.missing)}
                    className="ml-auto rounded-full
                               bg-gradient-to-r from-[#e07b5a] to-[#f4a460]
                               px-4 py-1.5 text-xs font-bold text-white
                               shadow-[0_2px_10px_rgba(224,123,90,0.2)]
                               transition-all duration-250 ease-out
                               hover:shadow-[0_6px_20px_rgba(224,123,90,0.35)]
                               hover:-translate-y-0.5 hover:scale-[1.03]
                               active:scale-95 cursor-pointer"
                  >
                    + 加入购物清单 🛒
                  </button>
                </div>
              )}

              {/* ── 搜索做法视频按钮 ── */}
              <div className="relative mt-2 pt-2 border-t border-dashed border-[#f0ebe3]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSearchMenuIdx(searchMenuIdx === idx ? null : idx)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full
                             border-2 border-[#d4dde8] bg-[#f5f7fa]
                             px-3.5 py-1.5 text-xs font-bold
                             text-[#8a9bb5] tracking-wide
                             transition-all duration-200 ease-out
                             hover:bg-[#e8eef5] hover:border-[#b8c8db]
                             hover:-translate-y-0.5
                             active:scale-95 cursor-pointer"
                >
                  <span className="text-sm">🔍</span>
                  <span>搜做法视频</span>
                  <span className={`text-[10px] transition-transform duration-200 ${
                    searchMenuIdx === idx ? 'rotate-180' : ''
                  }`}>
                    ▼
                  </span>
                </button>

                {/* 弹出菜单 */}
                {searchMenuIdx === idx && (
                  <div
                    ref={searchMenuIdx === idx ? searchMenuRef : undefined}
                    className="absolute left-0 top-full mt-1 z-20
                               animate-pop rounded-2xl bg-white
                               shadow-[0_8px_28px_rgba(0,0,0,0.10)]
                               border border-[#f0ebe3] px-2 py-2
                               min-w-[180px]"
                  >
                    <div className="text-[10px] font-bold text-[#d4c8b8] px-2 pb-1">
                      选择搜索平台
                    </div>
                    {SEARCH_OPTIONS.map((opt, oi) => (
                      <button
                        key={oi}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openSearch(recipe.name, oi)
                        }}
                        className={`flex w-full items-center gap-2 rounded-xl
                                   border px-3 py-2 mb-1 last:mb-0
                                   text-xs font-bold transition-all duration-200 ease-out
                                   hover:-translate-y-0.5 hover:shadow-sm
                                   active:scale-[0.98] cursor-pointer ${opt.color}`}
                      >
                        <span className="text-base">{opt.emoji}</span>
                        <span>{opt.label}</span>
                        <span className="ml-auto text-[10px] opacity-60">{opt.tip}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* AI 吐槽 — 对话气泡 */}
              {recipe.joke && (
                <div className="relative mt-3 rounded-2xl bg-[#f5eeff] px-4 py-2.5
                                border border-[#d4c4f0]">
                  <p className="text-xs text-[#7c6da8] italic">
                    💬 {recipe.joke}
                  </p>
                  <div
                    className="absolute -top-2 left-6 w-4 h-4 bg-[#f5eeff]
                               border-l border-t border-[#d4c4f0] rotate-45"
                  />
                </div>
              )}

              {/* 地狱模式：🧪 黑暗程度评分 */}
              {mode === 'hell' && (
                <div className="mt-3 pt-3 border-t border-dashed border-[#f0ebe3]">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-[#c4b8a8] mr-1 tracking-wide">
                      黑暗指数
                    </span>
                    {[1, 2, 3, 4, 5].map((score) => {
                      const entryId = darkEntryMapRef.current[recipe.name]
                      const entry = darkHistory.find((e) => e.id === entryId)
                      const current = entry?.score ?? 0
                      const active = score <= current
                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleRateDark(recipe.name, score)}
                          title={`黑暗程度 ${score} / 5`}
                          className={`text-base transition-all duration-150 ease-out cursor-pointer
                                     hover:scale-125 active:scale-90
                                     ${active
                                       ? 'opacity-100 scale-110 drop-shadow-[0_0_6px_rgba(180,255,120,0.5)]'
                                       : 'opacity-25 grayscale hover:opacity-50 hover:grayscale-0'
                                     }`}
                        >
                          🧪
                        </button>
                      )
                    })}
                    <span className="ml-1 text-[10px] font-bold text-[#c4b8a8]">
                      {(darkHistory.find((e) => e.id === darkEntryMapRef.current[recipe.name]))?.score > 0
                        ? `${(darkHistory.find((e) => e.id === darkEntryMapRef.current[recipe.name])).score}/5`
                        : '评分'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )
    }

    // 已完成但解析失败
    if (!loading && streamingText && !recipes) {
      return (
        <div className="rounded-[20px] bg-white px-6 py-6
                        shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <p className="text-sm font-bold text-[#8db580] mb-2">
            ✅ 食谱已生成（原始数据）
          </p>
          <pre className="whitespace-pre-wrap break-words font-mono text-xs text-gray-400
                          leading-relaxed">
            {streamingText}
          </pre>
        </div>
      )
    }

    // 空闲
    return (
      <div className="rounded-[20px] bg-white px-6 py-16 text-center
                      shadow-[0_4px_20px_rgba(0,0,0,0.04)]
                      border-2 border-dashed border-[#e8dfd5]">
        <p className="text-5xl mb-4 animate-float">🥘</p>
        <p className="text-[#d4c8b8] font-bold text-base">
          选好食材，点「拯救剩菜」开始魔法！
        </p>
      </div>
    )
  }

  // ── 购物清单区域 ──────────────────────────────────────────

  const renderShoppingList = () => {
    if (shoppingList.length === 0) return null

    return (
      <div className="animate-pop rounded-[20px] bg-white
                      shadow-[0_4px_20px_rgba(0,0,0,0.04)]
                      overflow-hidden">
        {/* 便签纸顶部 — 仿纸边阴影 */}
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-0.5
                          bg-gradient-to-r from-transparent via-[#e8dfd5] to-transparent" />
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="text-sm font-extrabold text-[#b8a07a]">
              🛒 购物清单（{shoppingList.length} 项）
            </h3>
            <button
              type="button"
              onClick={clearShoppingList}
              className="text-xs font-bold text-[#d4c8b8] transition-all duration-200 ease-out
                         hover:text-[#e07b5a] cursor-pointer"
            >
              清空 🗑
            </button>
          </div>
        </div>
        <ul className="px-5 pb-5 space-y-2">
          {shoppingList.map((item) => (
            <li
              key={item}
              className="flex items-center justify-between rounded-2xl
                         bg-[#faf8f5] px-4 py-2.5 text-sm font-bold text-gray-600
                         border border-[#f0ebe3] transition-all duration-200 ease-out
                         hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
            >
              <span>🧾 {item}</span>
              <button
                type="button"
                onClick={() => removeFromShoppingList(item)}
                className="rounded-full bg-gradient-to-r from-[#8db580] to-[#6ba368]
                           px-3 py-1 text-xs font-bold text-white
                           shadow-[0_2px_8px_rgba(141,181,128,0.2)]
                           transition-all duration-200 ease-out
                           hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_4px_14px_rgba(141,181,128,0.35)]
                           active:scale-95 cursor-pointer"
              >
                已买 ✅
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // ── 页面渲染 ──────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-[#faf8f5] py-6 px-4">

      {/* 极简背景装饰 — 仅保留两个微小的点缀 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
        <span className="absolute top-8 left-[4%] text-2xl opacity-[0.07] animate-float">✨</span>
        <span className="absolute bottom-1/3 right-[4%] text-2xl opacity-[0.07] animate-float"
              style={{ animationDelay: '1.2s' }}>💫</span>
      </div>

      <div className="relative mx-auto max-w-[480px] space-y-4">

        {/* 成就 Toast */}
        <AchievementToast achievement={achievement} />

        {/* ── 标题 ── */}
        <div className="text-center pt-2 relative">
          {/* 静音开关 */}
          <button
            type="button"
            onClick={handleToggleMute}
            title={muted ? '取消静音' : '静音'}
            className="absolute right-0 top-2 text-xl transition-all duration-200 ease-out
                       hover:scale-110 hover:-translate-y-0.5 active:scale-95 cursor-pointer
                       select-none"
          >
            {muted ? '🔕' : '🔔'}
          </button>

          <h1 className="inline-flex items-center justify-center gap-2
                         text-3xl font-extrabold text-[#e07b5a] tracking-tight">
            <span className="animate-spatula inline-block text-3xl">🥘</span>
            <span>剩菜拯救计划</span>
          </h1>
          <p className="mt-1 text-sm font-bold text-[#d4c8b8]">
            {loading ? cookingMsg : welcomeMsg}
          </p>
        </div>

        {/* 勋章 */}
        {badges.length > 0 && (
          <div className="flex justify-center gap-3">
            {badges.map((b) => (
              <span
                key={b.threshold}
                title={`${b.emoji} ${b.title}`}
                className="text-2xl animate-pop cursor-default"
              >
                {b.emoji}
              </span>
            ))}
          </div>
        )}

        {/* ── 主卡片：输入 + 标签 + 模式 + 按钮 ── */}
        <div className="rounded-[20px] bg-white px-5 py-5
                        shadow-[0_4px_20px_rgba(0,0,0,0.04)]
                        transition-shadow duration-300 ease-out">

          {/* 偏好摘要条 */}
          {hasPreferences && !prefOpen && (
            <button
              type="button"
              onClick={() => setPrefOpen(true)}
              className="w-full mb-3 flex flex-wrap items-center gap-1.5
                         rounded-2xl bg-[#fef9f2] px-4 py-2.5
                         border border-dashed border-[#f0da7a]
                         transition-all duration-200 ease-out
                         hover:bg-[#fef7e7] hover:-translate-y-0.5 cursor-pointer"
            >
              <span className="text-xs font-bold text-[#b08a3e]">✨</span>
              {preferenceSummary().map((part, i) => (
                <span
                  key={i}
                  className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold
                             text-[#8b6914] border border-[#f0da7a]
                             shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
                >
                  {part}
                </span>
              ))}
              <span className="ml-auto text-[10px] font-bold text-[#d4c8b8]">
                点击修改 ✎
              </span>
            </button>
          )}

          {/* ── 常备食材库 ── */}
          <PantryPanel onIngredientClick={handleTagClick} />

          {/* 食材输入框 */}
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
              🥬
            </span>
            <input
              type="text"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              disabled={loading}
              placeholder="输入食材，用逗号分隔..."
              className="w-full rounded-2xl border-2 border-[#f0ebe3] bg-[#faf8f5]
                         py-3 pl-11 pr-4 text-gray-600 font-bold text-sm
                         placeholder:text-[#d4c8b8] placeholder:font-semibold
                         outline-none transition-all duration-200 ease-out
                         focus:border-[#f4b860] focus:bg-white
                         focus:shadow-[0_0_0_4px_rgba(244,184,96,0.08)]
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* 快捷标签 — 马卡龙色系 */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {QUICK_TAGS.map(({ label, value, color }) => (
              <button
                key={value}
                type="button"
                disabled={loading}
                onClick={() => handleTagClick(value)}
                className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-extrabold
                           transition-all duration-300 ease-out
                           hover:scale-105 hover:-translate-y-0.5
                           active:scale-95 cursor-pointer
                           disabled:opacity-50 disabled:cursor-not-allowed
                           disabled:hover:scale-100 disabled:hover:translate-y-0
                           ${color}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── 口味偏好入口 ── */}
          <div className="mb-3">
            {!prefOpen && (
              <button
                type="button"
                onClick={() => setPrefOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-bold
                           text-[#d4c8b8] transition-all duration-200 ease-out
                           hover:text-[#b8a07a] hover:-translate-y-0.5 cursor-pointer"
              >
                <span>➕ 添加口味偏好（可选）</span>
              </button>
            )}

            {/* 偏好设置面板 */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                prefOpen
                  ? 'max-h-[600px] opacity-100'
                  : 'max-h-0 opacity-0 pointer-events-none'
              }`}
            >
              <div className="rounded-2xl bg-[#faf8f5] border border-[#f0ebe3] px-4 py-4 space-y-4">

                {/* 忌口/过敏 */}
                <div>
                  <p className="text-xs font-bold text-[#b8a07a] mb-2">
                    🚫 忌口 / 过敏
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {preferences.restrictions.map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 rounded-full
                                   bg-[#fdedec] border border-[#f5b7b1]
                                   px-3 py-1 text-xs font-bold text-[#c0392b]
                                   transition-all duration-200 ease-out
                                   hover:scale-105 hover:-translate-y-0.5"
                      >
                        {r}
                        <button
                          type="button"
                          onClick={() => removeRestriction(r)}
                          className="ml-0.5 text-[#e0a0a0] transition-all duration-200 ease-out
                                     hover:text-red-500 hover:rotate-90 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      ref={restrictionInputRef}
                      value={restrictionInput}
                      onChange={(e) => setRestrictionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addRestriction(restrictionInput)
                        }
                      }}
                      placeholder='如"不吃辣""海鲜过敏"'
                      className="flex-1 rounded-xl border-2 border-[#f0ebe3] bg-white
                                 px-3 py-1.5 text-xs font-bold text-gray-500
                                 placeholder:text-[#d4c8b8]
                                 outline-none transition-all duration-200 ease-out
                                 focus:border-[#f0b27a] focus:shadow-[0_0_0_3px_rgba(240,178,122,0.08)]"
                    />
                    <button
                      type="button"
                      onClick={() => addRestriction(restrictionInput)}
                      className="rounded-xl border-2 border-[#f0ebe3] bg-white
                                 px-3 py-1.5 text-xs font-bold text-[#b8a07a]
                                 transition-all duration-200 ease-out
                                 hover:bg-[#fef9e7] hover:border-[#f9e79f] cursor-pointer"
                    >
                      添加
                    </button>
                  </div>
                </div>

                {/* 口味倾向 */}
                <div>
                  <p className="text-xs font-bold text-[#b8a07a] mb-2">
                    👅 口味倾向
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TASTE_PRESETS.map((t) => {
                      const active = preferences.tastes.includes(t.value)
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => toggleTaste(t.value)}
                          className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-extrabold
                                     transition-all duration-250 ease-out
                                     hover:scale-105 hover:-translate-y-0.5
                                     active:scale-95 cursor-pointer
                                     ${active
                                       ? `${t.color} shadow-[0_2px_6px_rgba(0,0,0,0.04)]`
                                       : 'border-[#e8dfd5] bg-white text-[#c4b8a8] hover:border-[#d4c8b8]'
                                     }`}
                        >
                          {t.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 烹饪工具限制 */}
                <div>
                  <p className="text-xs font-bold text-[#b8a07a] mb-2">
                    🔧 烹饪工具限制
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TOOL_OPTIONS.map((t) => {
                      const active = preferences.tools.includes(t.value)
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => toggleTool(t.value)}
                          className={`rounded-xl border-2 px-3 py-2 text-xs font-bold
                                     transition-all duration-200 ease-out
                                     hover:-translate-y-0.5
                                     active:scale-95 cursor-pointer
                                     ${active
                                       ? 'bg-[#f5eeff] border-[#c8b8e8] text-[#6b5a9a] shadow-[0_1px_4px_rgba(0,0,0,0.04)]'
                                       : 'border-[#e8dfd5] bg-white text-[#c4b8a8] hover:border-[#d4c8b8]'
                                     }`}
                        >
                          {t.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 人数选择器 */}
                <div>
                  <p className="text-xs font-bold text-[#b8a07a] mb-2">
                    🍽️ 用餐人数
                  </p>
                  <div className="inline-flex items-center gap-4 rounded-2xl
                                  bg-white border border-[#f0ebe3] px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setServings(preferences.servings - 1)}
                      disabled={preferences.servings <= 1}
                      className="w-8 h-8 rounded-full border-2 border-[#f0ebe3]
                                 bg-[#faf8f5] text-[#b8a07a] text-lg font-extrabold
                                 flex items-center justify-center leading-none
                                 transition-all duration-200 ease-out
                                 hover:bg-[#fef9e7] hover:border-[#f9e79f]
                                 disabled:opacity-30 disabled:cursor-not-allowed
                                 disabled:hover:bg-[#faf8f5] cursor-pointer"
                    >
                      −
                    </button>
                    <span className="text-lg font-extrabold text-[#8b6914] min-w-[3ch] text-center select-none">
                      {preferences.servings}
                    </span>
                    <button
                      type="button"
                      onClick={() => setServings(preferences.servings + 1)}
                      disabled={preferences.servings >= 6}
                      className="w-8 h-8 rounded-full border-2 border-[#f0ebe3]
                                 bg-[#faf8f5] text-[#b8a07a] text-lg font-extrabold
                                 flex items-center justify-center leading-none
                                 transition-all duration-200 ease-out
                                 hover:bg-[#fef9e7] hover:border-[#f9e79f]
                                 disabled:opacity-30 disabled:cursor-not-allowed
                                 disabled:hover:bg-[#faf8f5] cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 应用偏好按钮 */}
                <button
                  type="button"
                  onClick={applyPreferences}
                  className="w-full rounded-xl border-2 border-[#e8dfd5] bg-white
                             py-2.5 text-sm font-extrabold text-[#b8a07a]
                             transition-all duration-200 ease-out
                             hover:bg-[#fef9e7] hover:border-[#f9e79f]
                             hover:-translate-y-0.5 cursor-pointer"
                >
                  ✨ 应用偏好
                </button>
              </div>
            </div>
          </div>

          {/* 模式切换 — 圆角贴纸风 */}
          <div className="flex rounded-2xl bg-[#faf8f5] p-1.5 mb-4
                          border border-[#f0ebe3]">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                disabled={loading}
                onClick={() => { try { playClick() } catch { /* noop */ }; setMode(m.key) }}
                className={`flex-1 rounded-xl py-2.5 text-sm font-extrabold
                           transition-all duration-250 ease-out cursor-pointer
                           disabled:opacity-50 disabled:cursor-not-allowed
                           ${mode === m.key
                             ? 'bg-gradient-to-br from-[#fef3c7] to-[#fde8c5] text-[#b08a3e] shadow-[0_1px_4px_rgba(0,0,0,0.06)] scale-[1.03]'
                             : 'text-[#d4c8b8] hover:text-[#b8a07a] hover:bg-[#f5f0ea]'
                           }`}
              >
                <span className="mr-1">{m.label}</span>
                <span className="hidden sm:inline">{m.desc}</span>
              </button>
            ))}
          </div>

          {/* 拯救按钮 — 番茄红→胡萝卜橙，充气感 */}
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="w-full rounded-[999px]
                       bg-gradient-to-r from-[#e05a3e] via-[#e87050] to-[#f4945e]
                       py-3.5 text-lg font-extrabold text-white tracking-wider
                       shadow-[0_4px_18px_rgba(224,90,62,0.25)]
                       transition-all duration-300 ease-out
                       hover:shadow-[0_10px_28px_rgba(224,90,62,0.4)]
                       hover:scale-[1.03] hover:-translate-y-0.5
                       active:scale-[0.97] cursor-pointer
                       disabled:opacity-50 disabled:cursor-not-allowed
                       disabled:hover:scale-100 disabled:hover:-translate-y-0
                       disabled:hover:shadow-[0_4px_18px_rgba(224,90,62,0.25)]"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="animate-ingredient-1 inline-block text-lg">🍳</span>
                <span>正在拯救...</span>
              </span>
            ) : (
              <span>🍳 拯救剩菜！</span>
            )}
          </button>
        </div>

        {/* ── 购物清单 ── */}
        {renderShoppingList()}

        {/* ── 结果展示区 ── */}
        {renderResultArea()}

        {/* ── 黑暗料理名人堂按钮 ── */}
        <button
          type="button"
          onClick={() => setHallOpen(true)}
          className="w-full rounded-[20px] bg-gradient-to-r from-[#2d1b3d] via-[#3d2552] to-[#2d1b3d]
                     border border-[#6b4e8a]/30 px-5 py-4
                     shadow-[0_4px_20px_rgba(60,30,80,0.25)]
                     transition-all duration-250 ease-out
                     hover:shadow-[0_8px_30px_rgba(100,50,150,0.35)]
                     hover:-translate-y-0.5 hover:scale-[1.01]
                     active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🏆</span>
            <span className="text-sm font-extrabold text-[#e8c97a] tracking-wide italic">
              黑暗名人堂
            </span>
            {darkHistory.length > 0 && (
              <span className="rounded-full bg-[#e8c97a]/20 border border-[#e8c97a]/30
                               px-2 py-0.5 text-[11px] font-extrabold text-[#e8c97a]">
                {darkHistory.length}
              </span>
            )}
          </div>
        </button>

        {/* ── 历史记录 ── */}
        <HistoryPanel onRefresh={() => {}} />

        {/* ── 黑暗料理名人堂面板 ── */}
        <DarkHallOfFame
          open={hallOpen}
          onClose={() => setHallOpen(false)}
          darkHistory={darkHistory}
          onDelete={handleDeleteDark}
          onClear={handleClearDark}
        />
      </div>
    </div>
  )
}

export default App
