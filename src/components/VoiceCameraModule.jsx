import { useState, useRef, useEffect, useCallback } from 'react'
import { useLang } from '../i18n/LanguageContext.jsx'

/**
 * 语音 / 相机整合模块
 *
 * 位于输入框与按钮之间，紧凑水平排列。
 * 正常模式：纸质容器 + 竖线分隔 + 沉稳无卡通
 * 简洁模式：透明无边框 + 灰色细线图标
 *
 * @param {{
 *   theme: string,
 *   voiceSupported: boolean,
 *   voiceListening: boolean,
 *   voiceBtnError: boolean,
 *   onVoiceStart: () => void,
 *   onVoiceStop: () => void,
 *   cameraRecognizing: boolean,
 *   cameraThumbnail: string | null,
 *   cameraResultText: string | null,
 *   cameraError: string | null,
 *   onOpenCamera: () => void,
 *   onOpenFilePicker: () => void,
 *   loading: boolean,
 *   apiKeyConfigured: boolean,
 * }}
 */
export default function VoiceCameraModule({
  theme,
  voiceSupported,
  voiceListening,
  voiceBtnError,
  onVoiceStart,
  onVoiceStop,
  cameraRecognizing,
  cameraThumbnail,
  cameraResultText,
  cameraError,
  onOpenCamera,
  onOpenFilePicker,
  loading,
  apiKeyConfigured,
}) {
  const isNormal = theme === 'normal'
  const { t } = useLang()

  // ─── 相机 Tooltip 状态 ──────────────────────────────────
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const tooltipRef = useRef(null)
  const moduleRef = useRef(null)

  // 点击外部关闭 tooltip
  useEffect(() => {
    if (!tooltipOpen) return
    const handler = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setTooltipOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [tooltipOpen])

  // ─── 状态提示 ──────────────────────────────────────────
  const [statusTip, setStatusTip] = useState(null)
  const statusTimerRef = useRef(null)

  const showStatus = useCallback((msg, duration = 2500) => {
    setStatusTip(msg)
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    statusTimerRef.current = setTimeout(() => setStatusTip(null), duration)
  }, [])

  // API Key 未配置提示
  useEffect(() => {
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    }
  }, [])

  // 识别结果反馈
  useEffect(() => {
    if (cameraResultText) {
      showStatus(t('camera.resultFeedback'))
    }
  }, [cameraResultText, showStatus])

  useEffect(() => {
    if (cameraError) {
      showStatus(t('camera.retryHint'), 3000)
    }
  }, [cameraError, showStatus])

  // ─── 相机按钮点击 ──────────────────────────────────────
  const handleCameraClick = () => {
    if (!apiKeyConfigured) {
      showStatus(t('camera.apiKeyHint'), 3500)
      return
    }
    if (cameraRecognizing) return
    setTooltipOpen((o) => !o)
  }

  const handleCapture = () => {
    setTooltipOpen(false)
    onOpenCamera()
  }

  const handleFilePick = () => {
    setTooltipOpen(false)
    onOpenFilePicker()
  }

  // ─── 麦克风按钮（按住交互） ─────────────────────────────
  const handleMicDown = (e) => {
    e.preventDefault()
    if (!voiceSupported || loading) return
    onVoiceStart()
  }
  const handleMicUp = () => {
    onVoiceStop()
  }

  // ─── 无任何可用功能时隐藏整个模块 ──────────────────────
  const hasCamera = apiKeyConfigured
  const hasVoice = voiceSupported
  if (!hasCamera && !hasVoice) return null

  // ─── SVG 图标 ──────────────────────────────────────────
  const CameraIcon = ({ size = 18 }) => (
    <svg
      width={size}
      height={size * 0.8}
      viewBox="0 0 20 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1.5" y="3.5" width="17" height="12" rx="2.5" />
      <circle cx="10" cy="9.5" r="3" />
      <path d="M5.5 3.5 L7 1 L13 1 L14.5 3.5" />
      <circle cx="15.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )

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

  const CameraCaptureIcon = ({ size = 16 }) => (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 20 15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="2.5" width="18" height="12" rx="2.5" />
      <circle cx="10" cy="8.5" r="3.5" />
      <path d="M6 2.5 L7.5 1 L12.5 1 L14 2.5" />
    </svg>
  )

  const GalleryIcon = ({ size = 16 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="14" height="14" rx="2" />
      <circle cx="6.5" cy="6.5" r="1.5" />
      <path d="M2 13 L6 10 L10 13 L13 10 L16 13" />
    </svg>
  )

  // ─── 渲染 ──────────────────────────────────────────────
  return (
    <div className="vc-module" ref={moduleRef} style={{ position: 'relative' }}>
      {/* 相机按钮 */}
      {hasCamera && (
        <button
          type="button"
          disabled={loading}
          onClick={handleCameraClick}
          title={t('camera.title')}
          className={`vc-btn ${cameraRecognizing ? 'vc-active' : ''}`}
          aria-label={t('camera.title')}
        >
          {cameraRecognizing ? (
            <span style={{ opacity: 0.6 }}>
              <CameraIcon size={18} />
            </span>
          ) : (
            <CameraIcon size={18} />
          )}
        </button>
      )}

      {/* 竖线分隔 — 仅当两侧都有功能时显示 */}
      {hasCamera && hasVoice && <span className="vc-separator" />}

      {/* 麦克风按钮 */}
      {hasVoice && (
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
      )}

      {/* 相机选项 Tooltip */}
      {tooltipOpen && (
        <div className="vc-tooltip" ref={tooltipRef}>
          <button
            type="button"
            className="vc-tooltip-item"
            onClick={handleCapture}
          >
            <span className="vc-tooltip-icon">
              <CameraCaptureIcon size={16} />
            </span>
            <span>{t('camera.photo')}</span>
          </button>
          <button
            type="button"
            className="vc-tooltip-item"
            onClick={handleFilePick}
          >
            <span className="vc-tooltip-icon">
              <GalleryIcon size={16} />
            </span>
            <span>{t('camera.gallery')}</span>
          </button>
        </div>
      )}

      {/* 状态提示条 */}
      {statusTip && (
        <div className="vc-status-tip">{statusTip}</div>
      )}

      {/* 缩略图预览 — 识别完成后在 tooltip 位置展示 */}
      {cameraThumbnail && !cameraRecognizing && cameraResultText && !statusTip && (
        <div className="vc-tooltip" style={{ minWidth: '200px', padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src={cameraThumbnail}
              alt="预览"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '4px',
                objectFit: 'cover',
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#5c4f3c' }}>
              {t('camera.recognizedLabel')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
