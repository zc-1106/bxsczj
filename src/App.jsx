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
import { playClick, playSuccess, playAchievement, playError, isMuted, toggleMute, playRecordStart, playRecordSuccess, playRecordError, playShutter } from './sound.js'
import { useSpeechRecognition } from './hooks/useSpeechRecognition.js'
import { useImageRecognition } from './hooks/useImageRecognition.js'
import { loadDarkHistory, saveDarkHistory, createDarkEntry } from './darkStorage.js'
import DarkHallOfFame from './components/DarkHallOfFame.jsx'
import VoiceCameraModule from './components/VoiceCameraModule.jsx'
import LangSwitch from './components/LangSwitch.jsx'
import { useLang } from './i18n/LanguageContext.jsx'

// ─── 常量（value 字段保留中文——发送给 API；labelKey 用于界面显示翻译）───

const QUICK_TAGS = [
  { emoji: '🥚', labelKey: 'tag.egg', value: '鸡蛋', color: 'bg-[#fef9e7] border-[#f9e79f] text-[#b7950b] hover:bg-[#fdf2c2]' },
  { emoji: '🍅', labelKey: 'tag.tomato', value: '番茄', color: 'bg-[#fdedec] border-[#f5b7b1] text-[#c0392b] hover:bg-[#fce4e2]' },
  { emoji: '🥔', labelKey: 'tag.potato', value: '土豆', color: 'bg-[#fef9e7] border-[#e8da8c] text-[#9c7c38] hover:bg-[#fdf3d0]' },
  { emoji: '🧅', labelKey: 'tag.onion', value: '洋葱', color: 'bg-[#ebf5fb] border-[#aed6f1] text-[#2e86c1] hover:bg-[#d6eaf8]' },
  { emoji: '🍗', labelKey: 'tag.chicken', value: '鸡胸肉', color: 'bg-[#fdebd0] border-[#f0b27a] text-[#b9770e] hover:bg-[#fce4c1]' },
]

const MODES = [
  { key: 'lazy', emoji: '😴', labelKey: 'mode.lazy' },
  { key: 'hardcore', emoji: '💪', labelKey: 'mode.hardcore' },
  { key: 'hell', emoji: '😈', labelKey: 'mode.hell' },
]

const THEME_KEY = 'leftover_theme'
const DEFAULT_THEME = 'normal'

const THEMES = [
  { key: 'normal', emoji: '☕', labelKey: 'theme.normal', descKey: 'theme.normalDesc', subKey: 'theme.normalSub' },
  { key: 'simple', emoji: '🌞', labelKey: 'theme.simple', descKey: 'theme.simpleDesc', subKey: 'theme.simpleSub' },
]

const WELCOME_KEYS = ['welcome.0', 'welcome.1', 'welcome.2', 'welcome.3', 'welcome.4']
const COOKING_KEYS = ['cooking.0', 'cooking.1', 'cooking.2', 'cooking.3', 'cooking.4']

const TASTE_PRESETS = [
  { emoji: '🌶️', labelKey: 'taste.spicy', value: '偏辣', color: 'bg-[#fdedec] border-[#f5b7b1] text-[#c0392b]' },
  { emoji: '🍬', labelKey: 'taste.sweet', value: '偏甜', color: 'bg-[#fdebd0] border-[#f0b27a] text-[#b9770e]' },
  { emoji: '🥬', labelKey: 'taste.light', value: '清淡', color: 'bg-[#e8f8e8] border-[#b8d8b8] text-[#5a9a5a]' },
  { emoji: '🍜', labelKey: 'taste.strong', value: '重口味', color: 'bg-[#f5eeff] border-[#d4c4f0] text-[#7c6da8]' },
  { emoji: '🍋', labelKey: 'taste.sour', value: '酸爽', color: 'bg-[#fef9e7] border-[#f9e79f] text-[#b7950b]' },
  { emoji: '🧈', labelKey: 'taste.creamy', value: '奶油党', color: 'bg-[#ebf5fb] border-[#aed6f1] text-[#2e86c1]' },
]

const TOOL_OPTIONS = [
  { emoji: '🔌', labelKey: 'tool.microwave', value: '只有微波炉' },
  { emoji: '🚫', labelKey: 'tool.noOven', value: '没有烤箱' },
  { emoji: '🍟', labelKey: 'tool.airFryer', value: '只能用空气炸锅' },
  { emoji: '🍚', labelKey: 'tool.riceCooker', value: '有电饭煲' },
]

function extractJson(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/)
  if (fenced) return fenced[1]
  const plainFence = text.match(/```\s*([\s\S]*?)\s*```/)
  if (plainFence) return plainFence[1]
  return text
}

function normalizeMissing(missing) {
  if (!Array.isArray(missing)) return []
  return missing.map((item) => {
    if (typeof item === 'string') {
      return { ingredient: item, alternative: '' }
    }
    return {
      ingredient: item.ingredient || String(item) || '',
      alternative: item.alternative || '',
    }
  })
}

function loadShoppingList() {
  try { return JSON.parse(localStorage.getItem('leftover_shopping_list')) ?? [] }
  catch { return [] }
}
function saveShoppingList(list) {
  localStorage.setItem('leftover_shopping_list', JSON.stringify(list))
}

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

function App() {
  const [ingredients, setIngredients] = useState('')
  const [mode, setMode] = useState('lazy')

  // ---- 语言 ----
  const { lang, t } = useLang()

  // ---- 主题 ----
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) || DEFAULT_THEME }
    catch { return DEFAULT_THEME }
  })
  const setTheme = (v) => {
    setThemeState(v)
    try { localStorage.setItem(THEME_KEY, v) } catch { /* noop */ }
    document.documentElement.setAttribute('data-theme', v)
  }

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [streamingText, setStreamingText] = useState('')
  const [recipes, setRecipes] = useState(null)
  const cancelRef = useRef(null)

  const [shoppingList, setShoppingList] = useState(loadShoppingList)
  useEffect(() => { saveShoppingList(shoppingList) }, [shoppingList])

  const [achievement, setAchievement] = useState(null)
  const [badges] = useState(getAchievementBadges)

  const [welcomeKey] = useState(() => WELCOME_KEYS[Math.floor(Math.random() * WELCOME_KEYS.length)])
  const [cookingKey] = useState(() => COOKING_KEYS[Math.floor(Math.random() * COOKING_KEYS.length)])

  const [muted, setMuted] = useState(isMuted)
  const handleToggleMute = () => setMuted(toggleMute())

  const {
    isSupported: voiceSupported,
    isListening: voiceListening,
    start: voiceStart,
    stop: voiceStop,
    result: voiceResult,
    error: voiceError,
  } = useSpeechRecognition({ lang: lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'zh-CN', maxDuration: 10000 })

  const voiceActiveRef = useRef(false)
  const [voiceBtnError, setVoiceBtnError] = useState(false)
  const voiceErrorTimerRef = useRef(null)
  const voicePlaceholderTimerRef = useRef(null)
  const [voicePlaceholder, setVoicePlaceholder] = useState(null)

  useEffect(() => { if (!voiceListening) voiceActiveRef.current = false }, [voiceListening])

  useEffect(() => {
    if (voiceError && voiceError !== 'no-speech' && voiceError !== 'aborted') {
      playRecordError()
      setVoiceBtnError(true)
      setVoicePlaceholder(t('input.voiceFail'))
      if (voiceErrorTimerRef.current) clearTimeout(voiceErrorTimerRef.current)
      voiceErrorTimerRef.current = setTimeout(() => setVoiceBtnError(false), 2000)
      if (voicePlaceholderTimerRef.current) clearTimeout(voicePlaceholderTimerRef.current)
      voicePlaceholderTimerRef.current = setTimeout(() => setVoicePlaceholder(null), 3000)
    }
  }, [voiceError, t])

  useEffect(() => {
    if (voiceResult) {
      playRecordSuccess()
      setIngredients((prev) => {
        const trimmed = prev.trim()
        const cleanResult = voiceResult.replace(/[，,。！!？?、\s]+$/, '').trim()
        if (!cleanResult) return prev
        return trimmed ? `${trimmed}，${cleanResult}` : cleanResult
      })
    }
  }, [voiceResult])

  const handleVoiceStart = () => {
    if (!voiceSupported || voiceActiveRef.current) return
    voiceActiveRef.current = true
    playRecordStart()
    voiceStart()
  }
  const handleVoiceStop = () => { if (!voiceActiveRef.current) return; voiceStop() }

  const {
    isRecognizing: cameraRecognizing,
    recognize: cameraRecognize,
    result: cameraResult,
    error: cameraError,
    cancel: cameraCancel,
  } = useImageRecognition()

  const [cameraThumbnail, setCameraThumbnail] = useState(null)
  const [cameraResultText, setCameraResultText] = useState(null)
  const fileInputRef = useRef(null)
  const captureInputRef = useRef(null)

  const openCameraCapture = () => { captureInputRef.current?.click() }
  const openFilePicker = () => { fileInputRef.current?.click() }

  const handleImageSelected = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCameraThumbnail(reader.result)
    reader.readAsDataURL(file)
    setCameraResultText(null)
    playShutter()
    const content = await cameraRecognize(file)
    if (content) {
      playSuccess()
      setCameraResultText(content)
      setIngredients((prev) => {
        const trimmed = prev.trim()
        return trimmed ? `${trimmed}，${content}` : content
      })
    } else { playError() }
  }

  const [themeOpen, setThemeOpen] = useState(false)
  const themePanelRef = useRef(null)
  useEffect(() => {
    if (!themeOpen) return
    const handler = (e) => { if (themePanelRef.current && !themePanelRef.current.contains(e.target)) setThemeOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [themeOpen])

  const [darkHistory, setDarkHistory] = useState(loadDarkHistory)
  const [hallOpen, setHallOpen] = useState(false)
  const darkEntryMapRef = useRef({})
  useEffect(() => { saveDarkHistory(darkHistory) }, [darkHistory])

  const handleRateDark = (recipeName, score) => {
    const entryId = darkEntryMapRef.current[recipeName]
    if (!entryId) return
    setDarkHistory((prev) => prev.map((e) => (e.id === entryId ? { ...e, score } : e)))
  }
  const handleDeleteDark = (id) => {
    setDarkHistory((prev) => prev.filter((e) => e.id !== id))
    darkEntryMapRef.current = Object.fromEntries(Object.entries(darkEntryMapRef.current).filter(([, v]) => v !== id))
  }
  const handleClearDark = () => { setDarkHistory([]); darkEntryMapRef.current = {} }

  const [searchMenuIdx, setSearchMenuIdx] = useState(null)
  const searchMenuRef = useRef(null)
  useEffect(() => {
    if (searchMenuIdx == null) return
    const handler = (e) => { if (searchMenuRef.current && !searchMenuRef.current.contains(e.target)) setSearchMenuIdx(null) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [searchMenuIdx])

  const SEARCH_OPTIONS = [
    { emoji: '🎬', labelKey: 'search.bilibili', tipKey: 'search.bilibiliTip', url: (name) => `https://search.bilibili.com/all?keyword=${encodeURIComponent(name + ' 做法')}`, color: 'bg-[#e8f4fd] border-[#b8d4f0] text-[#4a8bc2] hover:bg-[#d4ebfa]' },
    { emoji: '🌍', labelKey: 'search.youtube', tipKey: 'search.youtubeTip', url: (name) => `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' recipe')}`, color: 'bg-[#fde8e8] border-[#f0b8b8] text-[#c24a4a] hover:bg-[#fcd8d8]' },
    { emoji: '📖', labelKey: 'search.xiachufang', tipKey: 'search.xiachufangTip', url: (name) => `https://www.xiachufang.com/search/?keyword=${encodeURIComponent(name)}`, color: 'bg-[#e8f8e8] border-[#b8d8b8] text-[#5a9a5a] hover:bg-[#d4f0d4]' },
  ]

  const openSearch = (recipeName, platformIdx) => {
    const { url } = SEARCH_OPTIONS[platformIdx]
    window.open(url(recipeName), '_blank', 'noopener')
    setSearchMenuIdx(null)
  }

  const [preferences, setPreferences] = useState(loadPreferences)
  const [prefOpen, setPrefOpen] = useState(false)
  const [restrictionInput, setRestrictionInput] = useState('')
  const restrictionInputRef = useRef(null)
  useEffect(() => { savePreferences(preferences) }, [preferences])

  const addRestriction = (val) => {
    const trimmed = val.trim()
    if (!trimmed) return
    setPreferences((p) => { if (p.restrictions.includes(trimmed)) return p; return { ...p, restrictions: [...p.restrictions, trimmed] } })
    setRestrictionInput('')
  }
  const removeRestriction = (val) => { setPreferences((p) => ({ ...p, restrictions: p.restrictions.filter((r) => r !== val) })) }
  const toggleTaste = (val) => { setPreferences((p) => ({ ...p, tastes: p.tastes.includes(val) ? p.tastes.filter((v) => v !== val) : [...p.tastes, val] })) }
  const toggleTool = (val) => { setPreferences((p) => ({ ...p, tools: p.tools.includes(val) ? p.tools.filter((v) => v !== val) : [...p.tools, val] })) }
  const setServings = (n) => { setPreferences((p) => ({ ...p, servings: Math.min(6, Math.max(1, n)) })) }
  const applyPreferences = () => { setPrefOpen(false) }

  const preferenceSummary = () => {
    const parts = []
    if (preferences.tastes.length > 0) parts.push(...preferences.tastes.map((tv) => {
      const preset = TASTE_PRESETS.find((p) => p.value === tv)
      return preset ? t(preset.labelKey) : tv
    }))
    if (preferences.restrictions.length > 0) parts.push(...preferences.restrictions.map((r) => `忌:${r}`))
    if (preferences.tools.length > 0) parts.push(`工具:${preferences.tools[0]}${preferences.tools.length > 1 ? ` +${preferences.tools.length - 1}` : ''}`)
    if (preferences.servings > 1) parts.push(`${preferences.servings}人份`)
    return parts
  }

  const hasPreferences = preferences.restrictions.length > 0 || preferences.tastes.length > 0 || preferences.tools.length > 0 || preferences.servings > 1

  const handleTagClick = (tag) => {
    try { playClick() } catch { /* noop */ }
    setIngredients((prev) => {
      const list = prev.split(',').map((s) => s.trim()).filter(Boolean)
      if (list.includes(tag)) return prev
      list.push(tag)
      return list.join(', ')
    })
  }

  const handleSave = async () => {
    const list = ingredients.split(',').map((s) => s.trim()).filter(Boolean)
    if (list.length === 0) { try { playError() } catch { /* noop */ }; setError(t('error.empty')); return }
    setLoading(true); setError(null); setStreamingText(''); setRecipes(null)
    try {
      const { cancel, result } = fetchRecipes(list, mode, {
        onChunk: (chunk) => setStreamingText((prev) => prev + chunk),
        preferences: hasPreferences ? preferences : undefined,
        language: lang,
      })
      cancelRef.current = cancel
      const fullText = await result
      try {
        const jsonText = extractJson(fullText)
        const parsed = JSON.parse(jsonText)
        if (parsed?.recipes?.length > 0) {
          const normalized = parsed.recipes.map((r) => ({ ...r, missing: normalizeMissing(r.missing) }))
          setRecipes(normalized)
          if (mode === 'hell') {
            const newMap = { ...darkEntryMapRef.current }
            const newEntries = normalized.map((r) => { const entry = createDarkEntry(r, list); newMap[r.name] = entry.id; return entry })
            darkEntryMapRef.current = newMap
            setDarkHistory((prev) => [...newEntries, ...prev])
          }
          try { playSuccess() } catch { /* noop */ }
          const newCount = incrementUsageCount()
          const unlocked = checkAchievement(newCount)
          if (unlocked) { setAchievement(unlocked); try { playAchievement() } catch { /* noop */ } }
          saveHistoryEntry({ ingredients: list, mode, recipes: normalized })
        } else { try { playError() } catch { /* noop */ }; setError(t('error.emptyRecipes')) }
      } catch { /* raw text fallback */ }
    } catch (err) { try { playError() } catch { /* noop */ }; setError(err.message || '未知错误，请稍后重试') }
    finally { setLoading(false); cancelRef.current = null }
  }

  const handleCancel = () => cancelRef.current?.()

  const addToShoppingList = (missingItems) => {
    setShoppingList((prev) => {
      const next = [...prev]
      for (const item of missingItems) {
        const name = typeof item === 'string' ? item : item.ingredient
        if (!name || name.startsWith('⚠️')) continue
        if (!next.includes(name)) next.push(name)
      }
      return next
    })
  }
  const removeFromShoppingList = (item) => setShoppingList((prev) => prev.filter((i) => i !== item))
  const clearShoppingList = () => setShoppingList([])

  const renderStars = (level) => {
    const isNormal = theme === 'normal'
    return (
      <span className="inline-flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={isNormal ? (i < level ? 'star-filled' : 'star-empty') : (i < level ? 'text-[#f4b860]' : 'text-gray-200')}>★</span>
        ))}
      </span>
    )
  }

  // ── 结果展示区 ──────────────────────────────────────────
  const renderResultArea = () => {
    const isNormal = theme === 'normal'

    if (error) {
      return (
        <div className={`${isNormal ? '' : 'animate-pop'} rounded-[20px] bg-(--theme-surface) px-6 py-10 text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)]`}>
          <p className="text-5xl mb-3">{isNormal ? '—' : '😿'}</p>
          <p className="text-(--theme-accent) font-bold text-base">{error}</p>
          <button type="button" onClick={() => setError(null)} className={`mt-4 rounded-full border-2 px-5 py-2 text-sm font-bold transition-all duration-200 ease-out cursor-pointer ${isNormal ? 'border-[#d4c0a8] bg-[#f5ede0] text-[#8b5e3c] hover:bg-[#e8d5c0]' : 'border-[#f0c4b0] bg-[#fef5f1] text-[#d4856b] hover:bg-[#fde8df] hover:-translate-y-0.5'}`}>{t('error.gotIt')}</button>
        </div>
      )
    }

    if (loading && streamingText) {
      return (
        <div className={`${isNormal ? '' : 'rounded-[20px]'} bg-(--theme-surface) px-6 py-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]`}>
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-(--theme-text-secondary)">
              <span className={`inline-block text-lg ${isNormal ? '' : 'animate-spatula'}`}>{isNormal ? '···' : '🍳'}</span>
              {t(cookingKey)}
            </span>
            <button type="button" onClick={handleCancel} className={`rounded-full border-2 px-3 py-1 text-xs font-bold transition-all duration-200 ease-out cursor-pointer ${isNormal ? 'border-[#d4c0a8] text-(--theme-text-muted) hover:bg-[#f5ede0]' : 'border-(--theme-border-light) text-(--theme-text-muted) hover:bg-(--theme-surface-alt) hover:-translate-y-0.5'}`}>{t('save.stop')}</button>
          </div>
          <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-500 leading-relaxed max-h-80 overflow-y-auto">{streamingText}<span className="inline-block animate-cursor-blink ml-0.5 select-none" aria-hidden="true">{isNormal ? '|' : '🥕'}</span></pre>
        </div>
      )
    }

    if (loading && !streamingText) {
      return (
        <div className={`${isNormal ? '' : 'rounded-[20px]'} bg-(--theme-surface) px-6 py-14 text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)]`}>
          <div className="flex items-center justify-center gap-3 mb-4">
            {isNormal ? <span className="text-4xl animate-pulse inline-block" style={{ animationDuration: '1.5s' }}>···</span> : <><span className="text-4xl animate-ingredient-1 inline-block">🥚</span><span className="text-4xl animate-ingredient-2 inline-block">🍅</span><span className="text-4xl animate-ingredient-3 inline-block">🧅</span></>}
          </div>
          <p className="text-(--theme-text-muted) font-bold text-base">{t(cookingKey)}</p>
          <button type="button" onClick={handleCancel} className={`mt-5 rounded-full border-2 px-5 py-2 text-sm font-bold transition-all duration-200 ease-out cursor-pointer ${isNormal ? 'border-[#d4c0a8] text-(--theme-text-muted) hover:bg-[#f5ede0]' : 'border-(--theme-border-light) text-(--theme-text-muted) hover:bg-(--theme-surface-alt) hover:-translate-y-0.5'}`}>{t('save.cancel')}</button>
        </div>
      )
    }

    if (!loading && recipes) {
      return (
        <div className="space-y-4">
          <p className="text-center text-sm font-bold text-[#8db580]">
            {isNormal ? t('recipe.count', recipes.length) : <><span className="ui-emoji">🎉 </span>{t('recipe.count', recipes.length)}</>}
          </p>
          {recipes.map((recipe, idx) => (
            <div key={idx} className={`animate-pop relative px-6 pt-7 pb-5 transition-all duration-250 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] ${isNormal ? 'folded-corner tear-edge paper-ruled bg-(--theme-surface) rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.04)]' : 'rounded-[20px] bg-(--theme-surface) shadow-[0_4px_20px_rgba(0,0,0,0.04)]'}`}>
              {isNormal ? <div className="recipe-label-tag">{t('recipe.label')}</div> : <div className="absolute -top-0.5 left-4 -rotate-3 rounded-b-lg bg-[#fef7cd] px-4 py-1.5 border border-[#f0da7a] border-t-0 shadow-[0_2px_6px_rgba(0,0,0,0.04)]"><span className="text-xs font-extrabold text-[#b08a3e] tracking-wide">✨ {t('recipe.label')}</span></div>}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {!isNormal && <span className="text-2xl">{['🍲','🍝','🥗','🍜','🍛'][idx % 5]}</span>}
                <h3 className={`font-extrabold ${isNormal ? 'recipe-name text-lg text-[#5c3d2e]' : 'text-lg text-gray-800'}`}>{recipe.name}</h3>
                <span className={`rounded-full px-3 py-1 text-xs font-bold border ${isNormal ? 'recipe-meta bg-transparent border-[#c4b8a8]' : 'bg-[#fef9e7] text-[#b7950b] border-[#f9e79f]'}`}>{isNormal ? recipe.time : <><span className="ui-emoji">⏱ </span>{recipe.time}</>}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${isNormal ? 'bg-transparent border-[#d4c0a8] text-(--theme-text-muted)' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>{renderStars(recipe.difficulty)}</span>
              </div>
              <ol className="mb-4 space-y-2">
                {recipe.steps?.map((step, si) => (
                  <li key={si} className="flex gap-3 text-sm text-gray-600 items-start">
                    <span className={`shrink-0 inline-flex items-center justify-center w-6 h-6 text-xs font-extrabold ${isNormal ? 'step-number rounded-full border border-[#d4c0a8] bg-transparent text-[#c4956a]' : 'rounded-full border-2 border-dashed border-[#f4b860] text-[#e0963a]'}`}>{isNormal ? (['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳'][si] || (si + 1)) : (si + 1)}</span>
                    <span className={`leading-relaxed pt-0.5 ${isNormal ? 'recipe-step-text' : ''}`}>{step}</span>
                  </li>
                ))}
              </ol>
              {recipe.missing?.length > 0 ? (
                <div className="mb-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold ${isNormal ? 'text-(--theme-text-muted)' : 'text-gray-400'}`}>{isNormal ? t('recipe.needBuy') : <><span className="ui-emoji">🛒 </span>{t('recipe.needBuySimple')}</>}</span>
                    {recipe.missing.map((item, mi) => {
                      const isString = typeof item === 'string'
                      const name = isString ? item : item.ingredient
                      const alternative = isString ? '' : item.alternative
                      return (
                        <span key={mi} className="inline-flex flex-col items-start">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${name.startsWith('⚠️') ? (isNormal ? 'missing-tag-warn' : 'bg-[#fdedec] text-[#c0392b] border-[#f5b7b1]') : (isNormal ? 'missing-tag' : 'bg-[#fdebd0] text-[#b9770e] border-[#f0b27a]')}`}>{name}</span>
                          {alternative && <span className={`text-[10px] mt-0.5 ml-1 font-medium ${isNormal ? 'text-[#9b8c7a]' : 'text-[#e8a860]'}`}>{isNormal ? `${t('recipe.alternative')}${alternative}` : <><span className="ui-emoji">💡</span>{t('recipe.alternativeSimple')}{alternative}</>}</span>}
                        </span>
                      )
                    })}
                    <button type="button" onClick={() => addToShoppingList(recipe.missing)} className={`ml-auto rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ease-out cursor-pointer ${isNormal ? 'bg-[#8b5e3c] text-white hover:bg-[#6b3f22]' : 'bg-gradient-to-r from-(--theme-accent) to-(--theme-accent-light) text-white shadow-[0_2px_10px_rgba(224,123,90,0.2)] hover:shadow-[0_6px_20px_rgba(224,123,90,0.35)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95'}`}>{isNormal ? t('recipe.addToList') : <>{t('recipe.addToList')}<span className="ui-emoji"> 🛒</span></>}</button>
                  </div>
                </div>
              ) : (
                <div className="mb-3"><span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shadow-[0_1px_4px_rgba(100,180,100,0.10)] ${isNormal ? 'perfect-match-badge' : 'bg-[#e8f8e8] border border-[#a8d8a8] text-[#4a8a4a]'}`}>{isNormal ? `✓ ${t('recipe.perfect')}` : `✅ ${t('recipe.perfect')}`}</span></div>
              )}
              <div className="relative mt-2 pt-2 border-t border-dashed border-(--theme-border)">
                <button type="button" onClick={(e) => { e.stopPropagation(); setSearchMenuIdx(searchMenuIdx === idx ? null : idx) }} className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-xs font-bold tracking-wide transition-all duration-200 ease-out cursor-pointer ${isNormal ? 'search-btn-text border-[#d4c0a8] bg-[#f5ede0] text-[#8b7b6a] hover:bg-[#e8d5c0]' : 'border-[#d4dde8] bg-[#f5f7fa] text-[#8a9bb5] hover:bg-[#e8eef5] hover:border-[#b8c8db] hover:-translate-y-0.5 active:scale-95'}`}>
                  {isNormal ? <span className="icon-search-css" /> : <span className="text-sm">🔍</span>}
                  <span>{t('recipe.search')}</span>
                  <span className={`text-[10px] transition-transform duration-200 ${searchMenuIdx === idx ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {searchMenuIdx === idx && (
                  <div ref={searchMenuIdx === idx ? searchMenuRef : undefined} className={`absolute left-0 top-full mt-1 z-20 rounded-2xl bg-(--theme-surface) shadow-[0_8px_28px_rgba(0,0,0,0.10)] border border-(--theme-border) px-2 py-2 min-w-[180px] ${isNormal ? '' : 'animate-pop'}`}>
                    <div className="text-[10px] font-bold text-(--theme-text-muted) px-2 pb-1">{t('recipe.searchPlatform')}</div>
                    {SEARCH_OPTIONS.map((opt, oi) => (
                      <button key={oi} type="button" onClick={(e) => { e.stopPropagation(); openSearch(recipe.name, oi) }} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 mb-1 last:mb-0 text-xs font-bold transition-all duration-200 ease-out cursor-pointer ${isNormal ? 'hover:bg-(--theme-surface-alt)' : 'hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]'} ${opt.color}`}>
                        {isNormal ? <span className="text-xs font-bold">{t(opt.labelKey)}</span> : <><span className="text-base">{opt.emoji}</span><span>{t(opt.labelKey)}</span></>}
                        <span className="ml-auto text-[10px] opacity-60">{t(opt.tipKey)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {recipe.joke && (
                <div className={`relative mt-3 rounded-2xl px-4 py-2.5 border ${isNormal ? 'recipe-joke bg-transparent border-l-2 border-[#d4c0a8] rounded-none' : 'bg-[#f5eeff] border-[#d4c4f0]'}`}>
                  <p className={`text-xs ${isNormal ? 'text-[#9b8c7a] italic' : 'text-[#7c6da8] italic'}`}>{isNormal ? recipe.joke : <><span className="ui-emoji">💬 </span>{recipe.joke}</>}</p>
                  {!isNormal && <div className="absolute -top-2 left-6 w-4 h-4 bg-[#f5eeff] border-l border-t border-[#d4c4f0] rotate-45" />}
                </div>
              )}
              {mode === 'hell' && (
                <div className="mt-3 pt-3 border-t border-dashed border-(--theme-border)">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-(--theme-text-muted) mr-1 tracking-wide">{t('recipe.darkIndex')}</span>
                    {[1,2,3,4,5].map((score) => {
                      const entryId = darkEntryMapRef.current[recipe.name]
                      const entry = darkHistory.find((e) => e.id === entryId)
                      const current = entry?.score ?? 0
                      return (
                        <button key={score} type="button" onClick={() => handleRateDark(recipe.name, score)} title={`${t('recipe.darkIndex')} ${score} / 5`} className={`text-base transition-all duration-150 ease-out cursor-pointer hover:scale-125 active:scale-90 ${score <= current ? 'opacity-100 scale-110 drop-shadow-[0_0_6px_rgba(180,255,120,0.5)]' : 'opacity-25 grayscale hover:opacity-50 hover:grayscale-0'}`}>{isNormal ? '◆' : '🧪'}</button>
                      )
                    })}
                    <span className="ml-1 text-[10px] font-bold text-(--theme-text-muted)">{(darkHistory.find((e) => e.id === darkEntryMapRef.current[recipe.name]))?.score > 0 ? `${(darkHistory.find((e) => e.id === darkEntryMapRef.current[recipe.name])).score}/5` : t('recipe.rating')}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )
    }

    if (!loading && streamingText && !recipes) {
      return (
        <div className={`${isNormal ? '' : 'rounded-[20px]'} bg-(--theme-surface) px-6 py-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]`}>
          <p className="text-sm font-bold text-[#8db580] mb-2">{isNormal ? `✓ ${t('recipe.rawData')}` : `✅ ${t('recipe.rawData')}`}</p>
          <pre className="whitespace-pre-wrap break-words font-mono text-xs text-gray-400 leading-relaxed">{streamingText}</pre>
        </div>
      )
    }

    return (
      <div className="rounded-[20px] bg-(--theme-surface) px-6 py-16 text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)] border-2 border-dashed border-(--theme-border-light)">
        <p className={`text-5xl mb-4 ${isNormal ? '' : 'animate-float'}`}>{isNormal ? '—' : '🥘'}</p>
        <p className="text-(--theme-text-muted) font-bold text-base">{t('save.idle')}</p>
      </div>
    )
  }

  const renderShoppingList = () => {
    if (shoppingList.length === 0) return null
    const isNormal = theme === 'normal'
    return (
      <div className={`${isNormal ? '' : 'animate-pop'} rounded-[20px] bg-(--theme-surface) shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden`}>
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#e8dfd5] to-transparent" />
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="text-sm font-extrabold text-(--theme-text-secondary)">{isNormal ? t('shop.title', shoppingList.length) : <><span className="ui-emoji">🛒 </span>{t('shop.title', shoppingList.length)}</>}</h3>
            <button type="button" onClick={clearShoppingList} className={`text-xs font-bold transition-all duration-200 ease-out cursor-pointer ${isNormal ? 'text-(--theme-text-muted) hover:text-[#8b5e3c]' : 'text-(--theme-text-muted) hover:text-(--theme-accent)'}`}>{isNormal ? t('shop.clear') : <>{t('shop.clear')}<span className="ui-emoji"> 🗑</span></>}</button>
          </div>
        </div>
        <ul className="px-5 pb-5 space-y-2">
          {shoppingList.map((item) => (
            <li key={item} className={`flex items-center justify-between rounded-2xl bg-(--theme-surface-alt) px-4 py-2.5 text-sm font-bold text-gray-600 border transition-all duration-200 ease-out ${isNormal ? 'shopping-table-row border-(--theme-border)' : 'border-(--theme-border) hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)]'}`}>
              <span>{isNormal ? item : <><span className="ui-emoji">🧾 </span>{item}</>}</span>
              <button type="button" onClick={() => removeFromShoppingList(item)} className={`rounded-full px-3 py-1 text-xs font-bold text-white transition-all duration-200 ease-out cursor-pointer ${isNormal ? 'bg-[#8b5e3c] hover:bg-[#6b3f22]' : 'bg-gradient-to-r from-[#8db580] to-[#6ba368] shadow-[0_2px_8px_rgba(141,181,128,0.2)] hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_4px_14px_rgba(141,181,128,0.35)] active:scale-95'}`}>{isNormal ? t('shop.bought') : <>{t('shop.bought')}<span className="ui-emoji"> ✅</span></>}</button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const isNormal = theme === 'normal'

  return (
    <div className="relative min-h-screen bg-(--theme-surface-alt) py-6 px-4">
      {!isNormal && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
          <span className="absolute top-8 left-[4%] text-2xl opacity-[0.07] animate-float">✨</span>
          <span className="absolute bottom-1/3 right-[4%] text-2xl opacity-[0.07] animate-float" style={{ animationDelay: '1.2s' }}>💫</span>
        </div>
      )}

      <div className="relative mx-auto max-w-[480px] space-y-4">
        <AchievementToast achievement={achievement} theme={theme} />

        {/* ── 标题 ── */}
        <div className="text-center pt-2 relative">
          <div className="absolute left-0 top-2 flex items-center gap-1" ref={themePanelRef}>
            <button type="button" onClick={() => setThemeOpen((o) => !o)} title={t('theme.switch')} className={`transition-all duration-200 ease-out cursor-pointer select-none ${isNormal ? 'text-sm font-bold text-(--theme-text-secondary) hover:text-(--theme-text-primary)' : 'text-xl hover:scale-110 hover:-translate-y-0.5 active:scale-95'}`}>
              {isNormal ? (THEMES.find((th) => th.key === theme) ? t(THEMES.find((th) => th.key === theme).labelKey) : t('theme.switch')) : THEMES.find((th) => th.key === theme)?.emoji ?? '🎨'}
            </button>
            <LangSwitch theme={theme} />
            {themeOpen && (
              <div className={`absolute left-0 top-full mt-2 z-30 rounded-2xl bg-(--theme-surface) shadow-[0_8px_28px_rgba(0,0,0,0.10)] border border-(--theme-border) px-2 py-2 min-w-[200px] ${isNormal ? '' : 'animate-pop'}`}>
                <div className="text-[10px] font-bold text-(--theme-text-muted) px-2 pb-1.5 pt-0.5">{t('theme.select')}</div>
                {THEMES.map((th) => {
                  const isActive = theme === th.key
                  return (
                    <button key={th.key} type="button" onClick={() => { setTheme(th.key); setThemeOpen(false) }} className={`flex w-full flex-col items-start gap-0.5 rounded-xl border-2 px-3 py-2.5 mb-1 last:mb-0 text-left transition-all duration-200 ease-out cursor-pointer ${isNormal ? 'hover:bg-(--theme-surface-alt)' : 'hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]'} ${isActive ? 'border-(--theme-accent) bg-(--theme-surface-alt) shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'border-transparent hover:border-(--theme-border)'}`}>
                      <span className="flex w-full items-center gap-1.5">
                        <span className="text-sm font-extrabold text-(--theme-text-primary)"><span className="ui-emoji">{th.emoji} </span>{t(th.labelKey)}</span>
                        {isActive && <span className="ml-auto text-xs text-(--theme-accent) font-extrabold">✓</span>}
                      </span>
                      <span className="text-[10px] font-medium text-(--theme-text-muted)">{t(th.subKey)}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <button type="button" onClick={handleToggleMute} title={muted ? t('mute.on') : t('mute.off')} className={`absolute right-0 top-2 transition-all duration-200 ease-out cursor-pointer select-none ${isNormal ? 'text-sm font-bold text-(--theme-text-secondary) hover:text-(--theme-text-primary)' : 'text-xl hover:scale-110 hover:-translate-y-0.5 active:scale-95'}`}>
            {isNormal ? (muted ? t('mute.off') : t('mute.on')) : (muted ? '🔕' : '🔔')}
          </button>

          <h1 className={`inline-flex items-center justify-center gap-2 text-3xl font-extrabold tracking-tight ${isNormal ? 'text-[#5c3d2e]' : 'text-(--theme-accent)'}`}>
            {!isNormal && <span className="animate-spatula inline-block text-3xl">🥘</span>}
            <span>{t('app.title')}</span>
          </h1>
          <p className="mt-1 text-sm font-bold text-(--theme-text-muted)">{loading ? t(cookingKey) : t(welcomeKey)}</p>
        </div>

        {badges.length > 0 && (
          <div className="flex justify-center gap-3">
            {badges.map((b) => (
              <span key={b.threshold} title={t(`achievement.${b.threshold}`)} className={`cursor-default ${isNormal ? 'text-xs font-bold text-(--theme-text-secondary) bg-(--theme-surface) rounded-full px-3 py-1 border border-(--theme-border)' : 'text-2xl animate-pop'}`}>
                {isNormal ? t(`achievement.${b.threshold}`) : <><span className="ui-emoji">{b.emoji}</span>{t(`achievement.${b.threshold}`)}</>}
              </span>
            ))}
          </div>
        )}

        <div className={`rounded-[20px] bg-(--theme-surface) px-5 py-5 transition-shadow duration-300 ease-out ${isNormal ? 'main-card' : 'shadow-[0_4px_20px_rgba(0,0,0,0.04)]'}`}>
          {hasPreferences && !prefOpen && (
            <button type="button" onClick={() => setPrefOpen(true)} className={`w-full mb-3 flex flex-wrap items-center gap-1.5 rounded-2xl px-4 py-2.5 border transition-all duration-200 ease-out cursor-pointer ${isNormal ? 'bg-[#f5ede0] border-[#d4c0a8] hover:bg-[#e8d5c0]' : 'bg-[#fef9f2] border-dashed border-[#f0da7a] hover:bg-[#fef7e7] hover:-translate-y-0.5'}`}>
              <span className={`text-xs font-bold ${isNormal ? 'text-(--theme-text-secondary)' : 'text-[#b08a3e]'}`}>{isNormal ? t('prefs.title') : <><span className="ui-emoji">✨</span>{t('prefs.title')}</>}</span>
              {preferenceSummary().map((part, i) => (
                <span key={i} className={`rounded-full px-2.5 py-0.5 text-xs font-bold shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${isNormal ? 'bg-(--theme-surface) text-(--theme-text-secondary) border border-(--theme-border)' : 'bg-(--theme-surface) text-[#8b6914] border border-[#f0da7a]'}`}>{part}</span>
              ))}
              <span className="ml-auto text-[10px] font-bold text-(--theme-text-muted)">{t('prefs.edit')}</span>
            </button>
          )}

          <PantryPanel onIngredientClick={handleTagClick} theme={theme} />

          <div className="mb-4">
            <input type="text" value={ingredients} onChange={(e) => setIngredients(e.target.value)} disabled={loading} placeholder={voicePlaceholder ?? t('input.placeholder')} className={`w-full rounded-2xl border-2 bg-(--theme-surface-alt) py-3 px-4 text-gray-600 font-bold text-sm placeholder:text-(--theme-text-muted) placeholder:font-semibold outline-none transition-all duration-200 ease-out focus:border-[#f4b860] focus:bg-(--theme-surface) focus:shadow-[0_0_0_4px_rgba(244,184,96,0.08)] disabled:opacity-50 disabled:cursor-not-allowed ${isNormal ? 'input-inset input-gradient-border border-(--theme-border)' : 'border-(--theme-border)'}`} />
          </div>

          <input ref={captureInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelected} />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelected} />

          <div className="flex justify-center mb-4">
            <VoiceCameraModule theme={theme} voiceSupported={voiceSupported} voiceListening={voiceListening} voiceBtnError={voiceBtnError} onVoiceStart={handleVoiceStart} onVoiceStop={handleVoiceStop} cameraRecognizing={cameraRecognizing} cameraThumbnail={cameraThumbnail} cameraResultText={cameraResultText} cameraError={cameraError} onOpenCamera={openCameraCapture} onOpenFilePicker={openFilePicker} loading={loading} apiKeyConfigured={true} />
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {QUICK_TAGS.map(({ emoji, labelKey, value, color }) => (
              <button key={value} type="button" disabled={loading} onClick={() => handleTagClick(value)} className={`transition-all duration-200 ease-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isNormal ? 'quick-tag' : `rounded-full border-2 px-3.5 py-1.5 text-xs font-extrabold hover:scale-105 hover:-translate-y-0.5 active:scale-95 disabled:hover:scale-100 disabled:hover:translate-y-0 ${color}`}`}>
                <span className="ui-emoji">{emoji} </span>{t(labelKey)}
              </button>
            ))}
          </div>

          <div className="mb-3">
            {!prefOpen && (
              <button type="button" onClick={() => setPrefOpen(true)} className={`inline-flex items-center gap-1 text-xs font-bold transition-all duration-200 ease-out cursor-pointer ${isNormal ? 'text-(--theme-text-muted) hover:text-(--theme-text-secondary)' : 'text-(--theme-text-muted) hover:text-(--theme-text-secondary) hover:-translate-y-0.5'}`}>
                <span><span className="ui-emoji">➕ </span>{t('prefs.add')}</span>
              </button>
            )}
            <div className={`overflow-hidden transition-all duration-300 ease-out ${prefOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
              <div className={`rounded-2xl border px-4 py-4 space-y-4 ${isNormal ? 'pref-panel' : 'bg-(--theme-surface-alt) border-(--theme-border)'}`}>
                <div>
                  <p className="text-xs font-bold text-(--theme-text-secondary) mb-2"><span className="ui-emoji">🚫 </span>{t('prefs.restrictions')}</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {preferences.restrictions.map((r) => (
                      <span key={r} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold transition-all duration-200 ease-out ${isNormal ? 'pref-tag' : 'bg-[#fdedec] border-[#f5b7b1] text-[#c0392b] hover:scale-105 hover:-translate-y-0.5'}`}>
                        {r}
                        <button type="button" onClick={() => removeRestriction(r)} className="ml-0.5 opacity-50 transition-all duration-200 ease-out hover:opacity-100 hover:rotate-90 hover:text-red-500 cursor-pointer text-sm leading-none">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" ref={restrictionInputRef} value={restrictionInput} onChange={(e) => setRestrictionInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRestriction(restrictionInput) } }} placeholder={t('prefs.placeholder')} className="flex-1 rounded-xl border-2 border-(--theme-border) bg-(--theme-surface) px-3 py-1.5 text-xs font-bold text-gray-500 placeholder:text-(--theme-text-muted) outline-none transition-all duration-200 ease-out focus:border-[#f0b27a] focus:shadow-[0_0_0_3px_rgba(240,178,122,0.08)]" />
                    <button type="button" onClick={() => addRestriction(restrictionInput)} className={`rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all duration-200 ease-out cursor-pointer ${isNormal ? 'border-[#d4c0a8] bg-(--theme-surface) text-(--theme-text-secondary) hover:bg-[#e8d5c0]' : 'border-(--theme-border) bg-(--theme-surface) text-(--theme-text-secondary) hover:bg-[#fef9e7] hover:border-[#f9e79f]'}`}>{t('pantry.add')}</button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-(--theme-text-secondary) mb-2"><span className="ui-emoji">👅 </span>{t('prefs.tastes')}</p>
                  <div className="flex flex-wrap gap-2">
                    {TASTE_PRESETS.map((item) => {
                      const active = preferences.tastes.includes(item.value)
                      return (
                        <button key={item.value} type="button" onClick={() => toggleTaste(item.value)} className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-extrabold transition-all duration-200 ease-out cursor-pointer ${isNormal ? (active ? 'pref-tag active' : 'pref-tag') : (active ? `${item.color} shadow-[0_2px_6px_rgba(0,0,0,0.04)] hover:scale-105 hover:-translate-y-0.5 active:scale-95` : 'border-(--theme-border-light) bg-(--theme-surface) text-(--theme-text-muted) hover:border-(--theme-text-muted) hover:scale-105 hover:-translate-y-0.5 active:scale-95')}`}>
                          <span className="ui-emoji">{item.emoji} </span>{t(item.labelKey)}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-(--theme-text-secondary) mb-2"><span className="ui-emoji">🔧 </span>{t('prefs.tools')}</p>
                  <div className="flex flex-wrap gap-2">
                    {TOOL_OPTIONS.map((item) => {
                      const active = preferences.tools.includes(item.value)
                      return (
                        <button key={item.value} type="button" onClick={() => toggleTool(item.value)} className={`rounded-xl border-2 px-3 py-2 text-xs font-bold transition-all duration-200 ease-out cursor-pointer ${isNormal ? (active ? 'pref-tag active' : 'pref-tag') : (active ? 'bg-[#f5eeff] border-[#c8b8e8] text-[#6b5a9a] shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 active:scale-95' : 'border-(--theme-border-light) bg-(--theme-surface) text-(--theme-text-muted) hover:border-(--theme-text-muted) hover:-translate-y-0.5 active:scale-95')}`}>
                          <span className="ui-emoji">{item.emoji} </span>{t(item.labelKey)}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-(--theme-text-secondary) mb-2"><span className="ui-emoji">🍽️ </span>{t('prefs.servings')}</p>
                  <div className={`inline-flex items-center gap-4 rounded-2xl border px-4 py-2 ${isNormal ? 'bg-(--theme-surface) border-(--theme-border)' : 'bg-(--theme-surface) border-(--theme-border)'}`}>
                    <button type="button" onClick={() => setServings(preferences.servings - 1)} disabled={preferences.servings <= 1} className={`w-8 h-8 rounded-full border-2 bg-(--theme-surface-alt) text-(--theme-text-secondary) text-lg font-extrabold flex items-center justify-center leading-none transition-all duration-200 ease-out cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-(--theme-surface-alt) ${isNormal ? 'border-[#d4c0a8] hover:bg-[#e8d5c0]' : 'border-(--theme-border) hover:bg-[#fef9e7] hover:border-[#f9e79f]'}`}>−</button>
                    <span className="text-lg font-extrabold text-[#8b6914] min-w-[3ch] text-center select-none">{preferences.servings}</span>
                    <button type="button" onClick={() => setServings(preferences.servings + 1)} disabled={preferences.servings >= 6} className={`w-8 h-8 rounded-full border-2 bg-(--theme-surface-alt) text-(--theme-text-secondary) text-lg font-extrabold flex items-center justify-center leading-none transition-all duration-200 ease-out cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-(--theme-surface-alt) ${isNormal ? 'border-[#d4c0a8] hover:bg-[#e8d5c0]' : 'border-(--theme-border) hover:bg-[#fef9e7] hover:border-[#f9e79f]'}`}>+</button>
                  </div>
                </div>
                <button type="button" onClick={applyPreferences} className={`w-full rounded-xl border-2 py-2.5 text-sm font-extrabold transition-all duration-200 ease-out cursor-pointer ${isNormal ? 'border-[#d4c0a8] bg-(--theme-surface) text-(--theme-text-secondary) hover:bg-[#e8d5c0]' : 'border-(--theme-border-light) bg-(--theme-surface) text-(--theme-text-secondary) hover:bg-[#fef9e7] hover:border-[#f9e79f] hover:-translate-y-0.5'}`}><span className="ui-emoji">✨ </span>{t('prefs.apply')}</button>
              </div>
            </div>
          </div>

          <div className={isNormal ? 'mode-switch mb-4' : 'flex rounded-2xl bg-(--theme-surface-alt) p-1.5 mb-4 border border-(--theme-border)'}>
            {MODES.map((m) => (
              <button key={m.key} type="button" disabled={loading} onClick={() => { try { playClick() } catch { /* noop */ }; setMode(m.key) }} className={`transition-all duration-200 ease-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isNormal ? `mode-btn ${mode === m.key ? 'active' : ''}` : `flex-1 rounded-xl py-2.5 text-sm font-extrabold ${mode === m.key ? 'bg-gradient-to-br from-[#fef3c7] to-[#fde8c5] text-[#b08a3e] shadow-[0_1px_4px_rgba(0,0,0,0.06)] scale-[1.03]' : 'text-(--theme-text-muted) hover:text-(--theme-text-secondary) hover:bg-(--theme-surface-alt)'}`}`}>
                {isNormal ? <span>{t(m.labelKey)}</span> : <><span className="ui-emoji mr-1">{m.emoji}</span><span className="hidden sm:inline">{t(m.labelKey)}</span></>}
              </button>
            ))}
          </div>

          <button type="button" onClick={handleSave} disabled={loading} className={`w-full py-3.5 text-lg font-extrabold text-white tracking-wider transition-all duration-200 ease-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isNormal ? 'main-btn disabled:hover:bg-[#8b5e3c]' : 'rounded-[999px] bg-gradient-to-r from-(--theme-accent-gradient-from) via-(--theme-accent-gradient-mid) to-(--theme-accent-gradient-to) shadow-[0_4px_18px_rgba(224,90,62,0.25)] hover:shadow-[0_10px_28px_rgba(224,90,62,0.4)] hover:scale-[1.03] hover:-translate-y-0.5 active:scale-[0.97] disabled:hover:scale-100 disabled:hover:-translate-y-0 disabled:hover:shadow-[0_4px_18px_rgba(224,90,62,0.25)]'}`}>
            {loading ? <span className="inline-flex items-center gap-2"><span className={`inline-block text-lg ${isNormal ? 'animate-pulse' : 'animate-ingredient-1'}`} style={isNormal ? { animationDuration: '1.5s' } : undefined}>{isNormal ? '···' : '🍳'}</span><span>{t('save.saving')}</span></span> : <span>{isNormal ? t('save.button') : <><span className="ui-emoji">🍳 </span>{t('save.button')}</>}</span>}
          </button>
        </div>

        {renderShoppingList()}
        {renderResultArea()}

        <button type="button" onClick={() => setHallOpen(true)} className={`w-full rounded-[20px] px-5 py-4 border border-[#6b4e8a]/30 transition-all duration-200 ease-out cursor-pointer ${isNormal ? 'bg-[#2d1b3d] shadow-[0_4px_20px_rgba(60,30,80,0.25)] hover:shadow-[0_8px_30px_rgba(100,50,150,0.35)] hover:-translate-y-0.5' : 'bg-gradient-to-r from-[#2d1b3d] via-[#3d2552] to-[#2d1b3d] shadow-[0_4px_20px_rgba(60,30,80,0.25)] hover:shadow-[0_8px_30px_rgba(100,50,150,0.35)] hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.98]'}`}>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">{isNormal ? '◆' : '🏆'}</span>
            <span className={`text-sm font-extrabold italic tracking-wide ${isNormal ? 'text-[#e8c97a] dark-hall-title' : 'text-[#e8c97a]'}`}>{t('dark.title')}</span>
            {darkHistory.length > 0 && <span className="rounded-full bg-[#e8c97a]/20 border border-[#e8c97a]/30 px-2 py-0.5 text-[11px] font-extrabold text-[#e8c97a]">{darkHistory.length}</span>}
          </div>
        </button>

        <HistoryPanel onRefresh={() => {}} theme={theme} />
        <DarkHallOfFame open={hallOpen} onClose={() => setHallOpen(false)} darkHistory={darkHistory} onDelete={handleDeleteDark} onClear={handleClearDark} theme={theme} />
      </div>
    </div>
  )
}

export default App
