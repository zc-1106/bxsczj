import { useState, useRef, useEffect, useCallback } from 'react'
import { useLang } from '../i18n/LanguageContext.jsx'

/**
 * 语音输入模块 — 按住录音，松手识别
 *
 * 正常模式：纸质容器 + 沉稳无卡通
 * 简洁模式：透明无边框 + 灰色细线图标
 *
 * @param {{
 *   theme: string,
 *   voiceSupported: boolean,
 *   voiceListening: boolean,
 *   voiceBtnError: boolean,
 *   onVoiceStart: () => void,
 *   onVoiceStop: () => void,
 *   loading: boolean,
 * }}
 */
export default function VoiceCameraModule({
  theme,
  voiceSupported,
  voiceListening,
  voiceBtnError,
  onVoiceStart,
  onVoiceStop,
  loading,
}) {
  const isNormal = theme === 'normal'
  const { t } = useLang()

  const [statusTip, setStatusTip] = useState(null)
  const statusTimerRef = useRef(null)

  const showStatus = useCallback((msg, duration = 2500) => {
    setStatusTip(msg)
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    statusTimerRef.current = setTimeout(() => setStatusTip(null), duration)
  }, [])

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    }
  }, [])

  // ─── 麦克风按钮（按住交互） ─────────────────────────────
  const handleMicDown = (e) => {
    e.preventDefault()
    if (!voiceSupported || loading) return
    onVoiceStart()
  }
  const handleMicUp = () => {
    onVoiceStop()
  }

  // ─── 无语音支持时隐藏 ──────────────────────────────────
  if (!voiceSupported) return null

  // ─── SVG 图标 ──────────────────────────────────────────
  const MicIcon = ({ size = 18 }) => (
    <svg
      width={size * 0.6}
      height={size}
      viewBox="0 0 12 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="1" width="6" height="10" rx="3" />
      <path d="M1 7.5 C1 10.5 4 13 6 13 C8 13 11 10.5 11 7.5" />
      <line x1="6" y1="13" x2="6" y2="17" />
      <line x1="3" y1="17" x2="9" y2="17" />
    </svg>
  )

  return (
    <div className="vc-module" style={{ position: 'relative' }}>
      {/* 麦克风按钮 */}
      <button
        type="button"
        disabled={loading}
        onMouseDown={handleMicDown}
        onMouseUp={handleMicUp}
        onMouseLeave={handleMicUp}
        onTouchStart={handleMicDown}
        onTouchEnd={handleMicUp}
        title={t('voice.holdHint')}
        className={`vc-btn ${voiceListening ? 'vc-recording' : ''} ${voiceBtnError ? 'vc-error' : ''}`}
        aria-label={voiceListening ? t('voice.listeningHint') : t('voice.holdHint')}
      >
        {/* 正常图标 */}
        <span className="vc-mic-icon" style={{ display: voiceListening ? undefined : 'flex' }}>
          <MicIcon size={18} />
        </span>
        {/* 录音声波条 */}
        <span className="vc-mic-bars">
          <span className="vc-mic-bar" />
          <span className="vc-mic-bar" />
          <span className="vc-mic-bar" />
          <span className="vc-mic-bar" />
          <span className="vc-mic-bar" />
        </span>
      </button>

      {/* 状态提示条 */}
      {statusTip && (
        <div className="vc-status-tip">{statusTip}</div>
      )}
    </div>
  )
}
