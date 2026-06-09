import { useState, useRef, useCallback } from 'react'

/**
 * 图片食材识别 Hook — 封装图片编码 + 视觉 AI API 调用
 *
 * @returns {{
 *   isSupported: boolean,
 *   isRecognizing: boolean,
 *   recognize: (file: File) => Promise<string|null>,
 *   result: string|null,
 *   error: string|null,
 * }}
 */
export function useImageRecognition() {
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)
  const abortRef = useRef(null)

  // ── File → base64 ──────────────────────────────────────
  const fileToBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result
        // 去掉 "data:image/xxx;base64," 前缀
        const comma = dataUrl.indexOf(',')
        resolve(dataUrl.slice(comma + 1))
      }
      reader.onerror = () => reject(new Error('图片读取失败'))
      reader.readAsDataURL(file)
    })
  }, [])

  // ── 核心识别函数 ──────────────────────────────────────
  const recognize = useCallback(async (imageFile) => {
    // 重置状态
    setError(null)
    setResult(null)
    setIsRecognizing(true)

    // 检查 API Key
    const apiKey = import.meta.env.VITE_VISION_API_KEY
    if (!apiKey) {
      setError('no-api-key')
      setIsRecognizing(false)
      return null
    }

    try {
      // 编码图片
      const base64 = await fileToBase64(imageFile)

      // 准备请求
      const apiBase = import.meta.env.VITE_VISION_API_BASE || 'https://api.openai.com'
      const model = import.meta.env.VITE_VISION_MODEL || 'gpt-4o-mini'

      const controller = new AbortController()
      abortRef.current = controller
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(`${apiBase}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: "列出图片中所有你能识别的食材，仅返回食材名称，用逗号分隔，不要任何解释。如果未发现食材，返回'NONE'。",
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64}`,
                  },
                },
              ],
            },
          ],
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      abortRef.current = null

      if (!response.ok) {
        const errBody = await response.text().catch(() => '')
        throw new Error(`API 请求失败 (${response.status}): ${errBody}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content?.trim() || ''

      if (!content || content.toUpperCase() === 'NONE') {
        setError('no-ingredients')
        if (mountedRef.current) {
          setIsRecognizing(false)
        }
        return null
      }

      if (mountedRef.current) {
        setResult(content)
        setIsRecognizing(false)
      }
      return content
    } catch (err) {
      if (abortRef.current) {
        abortRef.current = null
      }
      if (mountedRef.current) {
        setError(err.name === 'AbortError' ? 'timeout' : err.message || '识别失败')
        setIsRecognizing(false)
      }
      return null
    }
  }, [fileToBase64])

  // ── 取消识别 ──────────────────────────────────────────
  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setIsRecognizing(false)
  }, [])

  return {
    isSupported: true, // 纯 JS 能力，始终可用（API Key 在 recognize 中检查）
    isRecognizing,
    recognize,
    result,
    error,
    cancel,
  }
}
