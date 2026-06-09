/**
 * localStorage 工具 — 历史记录 & 成就计数
 */

const HISTORY_KEY = 'leftover_history'
const COUNT_KEY = 'leftover_usage_count'
const UNLOCKED_KEY = 'leftover_achievements_unlocked'

// ─── 历史记录 ──────────────────────────────────────────────

export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) ?? []
  } catch {
    return []
  }
}

export function saveHistoryEntry(entry) {
  const history = loadHistory()
  history.unshift({
    id: Date.now().toString(),
    date: new Date().toISOString(),
    ...entry,
  })
  // 最多保留 50 条
  if (history.length > 50) history.length = 50
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  return history
}

// ─── 使用计数 ──────────────────────────────────────────────

export function getUsageCount() {
  try {
    return parseInt(localStorage.getItem(COUNT_KEY), 10) || 0
  } catch {
    return 0
  }
}

export function incrementUsageCount() {
  const next = getUsageCount() + 1
  localStorage.setItem(COUNT_KEY, String(next))
  return next
}

// ─── 成就定义 ──────────────────────────────────────────────

export const ACHIEVEMENTS = {
  5: { title: '剩菜新星', emoji: '🥉' },
  10: { title: '冷宫御厨', emoji: '🥈' },
  50: { title: '冰箱之神', emoji: '🥇' },
}

/**
 * 检查是否刚刚解锁了新成就
 * @param {number} newCount - 递增后的使用次数
 * @returns {{ title, emoji } | null}
 */
export function checkAchievement(newCount) {
  const threshold = Object.keys(ACHIEVEMENTS)
    .map(Number)
    .sort((a, b) => a - b)
    .find((t) => t === newCount)

  if (!threshold) return null

  // 防止重复弹（已解锁过的不再弹）
  const unlocked = getUnlocked()
  if (unlocked.includes(threshold)) return null

  markUnlocked(threshold)
  return ACHIEVEMENTS[threshold]
}

function getUnlocked() {
  try {
    return JSON.parse(localStorage.getItem(UNLOCKED_KEY)) ?? []
  } catch {
    return []
  }
}

function markUnlocked(threshold) {
  const unlocked = getUnlocked()
  if (!unlocked.includes(threshold)) {
    unlocked.push(threshold)
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlocked))
  }
}

/**
 * 加载所有已解锁成就（用于展示）
 */
export function getAchievementBadges() {
  const unlocked = getUnlocked()
  return unlocked.map((t) => ({
    threshold: t,
    ...ACHIEVEMENTS[t],
  }))
}
