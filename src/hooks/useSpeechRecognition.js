import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * 语音识别自定义 Hook — 封装 Web Speech API
 *
 * @param {object} [options]
 * @param {string} [options.lang='zh-CN']     识别语言
 * @param {number} [options.maxDuration=10000] 最长录音时长 (ms)
 * @returns {{ isSupported, isListening, start, stop, result, error }}
 */
export function useSpeechRecognition({
  lang = 'zh-CN',
  maxDuration = 10000,
} = {}) {
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const recognitionRef = useRef(null)
  const timeoutRef = useRef(null)
  const resultRef = useRef('')
  const supportedRef = useRef(false)
  const mountedRef = useRef(true)

  // ── 检测浏览器支持（一次性） ──────────────────────────
  useEffect(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
    supportedRef.current = !!Ctor
    if (!Ctor) {
      console.warn('[语音输入] SpeechRecognition 不被当前浏览器支持')
    }
  }, [])

  // ── 组件卸载标记 ─────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── 清理资源 ─────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch { /* noop */ }
      recognitionRef.current = null
    }
    // 注意：不在这里改 isListening，由 onend 统一处理
  }, [])

  // ── 卸载时清理 ───────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch { /* noop */ }
      }
    }
  }, [])

  // ── 开始录音 ─────────────────────────────────────────
  const start = useCallback(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Ctor) {
      setError('not-supported')
      console.warn('[语音输入] 浏览器不支持 SpeechRecognition')
      return
    }

    // 先清理上一次可能残留的实例
    cleanup()

    setError(null)
    setResult(null)
    resultRef.current = ''

    let recognition
    try {
      recognition = new Ctor()
    } catch {
      setError('init-failed')
      return
    }

    recognition.lang = lang
    recognition.interimResults = false // 只取最终结果
    recognition.continuous = false     // 单次识别
    recognition.maxAlternatives = 1

    // ── 识别到结果 ──────────────────────────────
    recognition.onresult = (event) => {
      const transcript =
        event.results?.[0]?.[0]?.transcript?.trim() || ''
      resultRef.current = transcript
      if (mountedRef.current) {
        setResult(transcript)
      }
    }

    // ── 识别出错 ────────────────────────────────
    recognition.onerror = (event) => {
      // 'no-speech' 和 'aborted' 不算真正的错误
      const fatalErrors = ['not-allowed', 'service-not-allowed', 'network']
      if (fatalErrors.includes(event.error) && mountedRef.current) {
        setError(event.error)
      }
      // 其他情况静默处理，由 onend 收尾
    }

    // ── 识别结束 ────────────────────────────────
    recognition.onend = () => {
      if (mountedRef.current) {
        setIsListening(false)
      }
      // 清理 timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    if (mountedRef.current) {
      setIsListening(true)
    }

    try {
      recognition.start()
    } catch (err) {
      // 可能已经在识别中
      if (mountedRef.current) {
        setError('start-failed')
        setIsListening(false)
      }
      cleanup()
      return
    }

    // ── 超时自动停止 ────────────────────────────
    timeoutRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch { /* noop */ }
      }
    }, maxDuration)
  }, [lang, maxDuration, cleanup])

  // ── 停止录音并返回结果 ──────────────────────────────
  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* noop */ }
    }
    // onend 会处理 isListening 的更新
    return resultRef.current
  }, [])

  return {
    isSupported: supportedRef.current,
    isListening,
    start,
    stop,
    result,
    error,
  }
}
