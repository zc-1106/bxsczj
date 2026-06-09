/**
 * localStorage 工具 — 黑暗料理历史
 *
 * 数据结构：
 * {
 *   id: string,        // 唯一 ID
 *   name: string,      // 菜名
 *   ingredients: string[], // 所用食材
 *   steps: string[],   // 前 2 步作为摘要
 *   score: number,     // 黑暗程度 0=未评分, 1-5
 *   date: string,      // ISO 生成时间
 * }
 *
 * 本模块只提供读写 + 工厂函数。
 * 所有状态变更由 App.jsx 通过 React state + useEffect 管理。
 */

const KEY = 'leftover_dark_cuisine'

// ─── 读写 ──────────────────────────────────────────────────

export function loadDarkHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? []
  } catch {
    return []
  }
}

export function saveDarkHistory(entries) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries))
  } catch { /* noop */ }
}

// ─── 工厂函数（无副作用）──────────────────────────────────

/**
 * 创建一条新的黑暗料理条目
 * @param {{ name: string, steps?: string[] }} recipe
 * @param {string[]} ingredients
 * @returns {object}
 */
export function createDarkEntry(recipe, ingredients) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: recipe.name,
    ingredients: ingredients ?? [],
    steps: (recipe.steps ?? []).slice(0, 2),
    score: 0,
    date: new Date().toISOString(),
  }
}
