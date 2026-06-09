import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * 图片食材识别 Hook — 封装图片编码 + /api/vision 调用
 *
 * 本地开发：Vite 中间件模拟 Serverless 函数
 * 生产环境：Vercel Serverless 函数（api/vision.js）
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

  // ── 组件卸载时标记，防止内存泄漏 ────────────────────────
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

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

    try {
      // 编码图片
      const base64 = await fileToBase64(imageFile)

      const controller = new AbortController()
      abortRef.current = controller
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      // 调用 /api/vision（本地 Vite 中间件 或 Vercel Serverless）
      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      abortRef.current = null

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.error || `请求失败 (${response.status})`)
      }

      const data = await response.json()
      const content = data.content?.trim() || ''

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
    isSupported: true, // 由服务端 API Key 决定，前端始终可用
    isRecognizing,
    recognize,
    result,
    error,
    cancel,
  }
}
