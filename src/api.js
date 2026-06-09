/**
 * DeepSeek API 调用封装 — 流式获取食谱
 *
 * 用法：
 *   const { cancel, result } = fetchRecipes(['鸡蛋', '番茄'], 'lazy', {
 *     onChunk: (text) => console.log(text),  // 实时回调
 *     preferences: { restrictions: [], tastes: [], tools: [], servings: 2 },
 *   })
 *   // 需要时取消：
 *   cancel()
 *   // 等待完整结果：
 *   const fullText = await result
 */

// ─── 模式 → 系统提示词 ────────────────────────────────────────

const BASE_SYSTEM_PROMPTS = {
  lazy: `你是一个懒人下厨助手。用户输入现有食材，你返回 1~3 个食谱。

规则：
- 步骤 ≤ 5 步，总时间 ≤ 25 分钟
- 尽可能用现有食材，缺的调料/配菜越少越好
- 做法简单省事，适合不想动脑的懒人`,

  hardcore: `你是一个专业厨师助手。用户输入现有食材，你返回 1~3 个食谱。

规则：
- 无步骤和时间限制，讲究成品的口味和品质
- 可以大胆推荐需要额外采购的调料/配菜
- 给出专业级的烹饪步骤和技巧提示`,

  hell: `你是一个黑暗料理发明家。用户输入食材（可能完全不搭），你的使命是用这些食材创作"地狱级"黑暗料理。

规则：
- 故意匹配冲突、违和的食材组合（甜+辣+酸混搭，水果+肉+酱油等）
- 步骤可以荒诞但技术上"可食用"，加点戏剧化描述
- 必须在 missing 数组末尾附加一条食用安全提醒（例如 "⚠️ 请确保鸡肉完全熟透"）
- difficulty 固定为 5，time 随意
- 幽默、疯狂、但不要太恶心`,
}

const JSON_FORMAT_INSTRUCTION = `
返回纯 JSON（不要 Markdown 代码块），格式：
{
  "recipes": [
    {
      "name": "菜名",
      "time": "15分钟",
      "difficulty": 1,
      "steps": ["打鸡蛋","炒熟","出锅"],
      "missing": ["生抽"],
      "joke": "一句轻松吐槽"
    }
  ]
}`

// ─── 构建偏好描述文本 ──────────────────────────────────────────

function buildPreferencesText(preferences) {
  if (!preferences) return ''
  const parts = []

  if (preferences.restrictions?.length > 0) {
    parts.push(`忌口/过敏：${preferences.restrictions.join('、')}。请避开这些食材和调料。`)
  }
  if (preferences.tastes?.length > 0) {
    parts.push(`口味倾向：${preferences.tastes.join('、')}。`)
  }
  if (preferences.tools?.length > 0) {
    parts.push(`烹饪设备限制：${preferences.tools.join('、')}。`)
  }
  if (preferences.servings && preferences.servings > 1) {
    parts.push(`用餐人数：${preferences.servings}人份。`)
  }

  if (parts.length === 0) return ''
  return '\n\n【用户偏好 — 请据此调整推荐】\n' + parts.join('\n')
    + '\n如有缺失调料或工具不匹配的情况，请在 missing 中友好提醒。'
}

// ─── 构建消息 ──────────────────────────────────────────────────

function buildMessages(ingredients, mode, preferences) {
  const basePrompt = BASE_SYSTEM_PROMPTS[mode] ?? BASE_SYSTEM_PROMPTS.lazy
  const preferencesText = buildPreferencesText(preferences)
  const systemPrompt = basePrompt + preferencesText + JSON_FORMAT_INSTRUCTION

  const userMessage = `我手上有这些食材：${ingredients.join('、')}。请给我食谱。`

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
 * }} [options]
 * @returns {{ cancel: () => void, result: Promise<string> }}
 */
export function fetchRecipes(ingredients, mode, { onChunk, preferences } = {}) {
  const controller = new AbortController()

  const result = (async () => {
    let fullText = ''

    try {
      const response = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: buildMessages(ingredients, mode, preferences),
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

        // SSE 格式：每行 "data: <json>"，以 "\n\n" 结束一个事件
        const lines = buffer.split('\n')
        // 未完整接收的行留到下次处理
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
            // 忽略无法解析的行（不完整 JSON 等）
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // 主动取消，不算异常，返回已累积的文本
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
