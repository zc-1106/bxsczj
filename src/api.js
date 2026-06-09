/**
 * DeepSeek API 调用封装 — 流式获取食谱
 *
 * 用法：
 *   const { cancel, result } = fetchRecipes(['鸡蛋', '番茄'], 'lazy', {
 *     onChunk: (text) => console.log(text),  // 实时回调
 *     preferences: { restrictions: [], tastes: [], tools: [], servings: 2 },
 *     language: 'zh',  // 'zh' | 'en' | 'ja'
 *   })
 *   cancel()
 *   const fullText = await result
 */

import { getApiPrompt, getJsonFormatInstruction, getPreferenceTexts } from './i18n/translations.js'

// ─── 构建偏好描述文本 ──────────────────────────────────────────

function buildPreferencesText(preferences, lang) {
  if (!preferences) return ''
  const t = getPreferenceTexts(lang)
  const parts = []

  if (preferences.restrictions?.length > 0) {
    parts.push(t.restrictions(preferences.restrictions))
  }
  if (preferences.tastes?.length > 0) {
    parts.push(t.tastes(preferences.tastes))
  }
  if (preferences.tools?.length > 0) {
    parts.push(t.tools(preferences.tools))
  }
  if (preferences.servings && preferences.servings > 1) {
    parts.push(t.servingsHeader(preferences.servings))
  }

  if (parts.length === 0) return ''
  return '\n\n' + t.prefsHeader + '\n' + parts.join('\n') + '\n' + t.missingNote
}

// ─── 构建消息 ──────────────────────────────────────────────────

function buildMessages(ingredients, mode, preferences, lang) {
  const basePrompt = getApiPrompt(lang, mode)
  const preferencesText = buildPreferencesText(preferences, lang)
  const jsonFormat = getJsonFormatInstruction(lang)
  const systemPrompt = basePrompt + preferencesText + jsonFormat

  const t = getPreferenceTexts(lang)
  const userMessage = t.userMessage(ingredients)

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]
}

// ─── 主函数 ────────────────────────────────────────────────────

/**
 * 流式获取食谱
 * @param {string[]} ingredients - 食材数组
 * @param {'lazy'|'hardcore'|'hell'} mode - 模式
 * @param {{
 *   onChunk?: (text: string) => void,
 *   preferences?: {
 *     restrictions?: string[],
 *     tastes?: string[],
 *     tools?: string[],
 *     servings?: number,
 *   },
 *   language?: 'zh' | 'en' | 'ja',
 * }} [options]
 * @returns {{ cancel: () => void, result: Promise<string> }}
 */
export function fetchRecipes(ingredients, mode, { onChunk, preferences, language = 'zh' } = {}) {
  const controller = new AbortController()

  const result = (async () => {
    let fullText = ''

    try {
      const response = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: buildMessages(ingredients, mode, preferences, language),
          stream: true,
          temperature: mode === 'hell' ? 1.2 : 0.8,
          max_tokens: 4096,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '')
        throw new Error(
          `API 请求失败 (${response.status}): ${errorBody || response.statusText}`,
        )
      }

      if (!response.body) {
        throw new Error('当前浏览器不支持流式读取（response.body 为空）')
      }

      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader()

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += value

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data:')) continue

          const data = trimmed.slice(5).trim()
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed?.choices?.[0]?.delta?.content
            if (content) {
              fullText += content
              onChunk?.(content)
            }
          } catch {
            // 忽略无法解析的行
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return fullText
      }
      throw err
    }

    return fullText
  })()

  return {
    cancel: () => controller.abort(),
    result,
  }
}
