/**
 * Web Audio API 轻量音效合成 — 无外部音频文件依赖
 *
 * 所有函数内部已做 try-catch 防护，AudioContext 不可用时静默降级。
 * 正常模式（data-theme="normal"）：低沉的木质敲击声
 * 简洁模式（data-theme="simple"）：清脆的叮声
 */

// ─── 共享 AudioContext（懒初始化）─────────────────────────────

let ctx = null
function getCtx() {
  if (ctx) return ctx
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
    return ctx
  } catch {
    return null
  }
}

// ─── 主题检测 ──────────────────────────────────────────────

function getTheme() {
  try {
    return document.documentElement.getAttribute('data-theme') || 'normal'
  } catch {
    return 'normal'
  }
}

// ─── 静音状态 ──────────────────────────────────────────────

const MUTE_KEY = 'leftover_sound_muted'

export function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === 'true'
  } catch {
    return false
  }
}

export function setMuted(v) {
  try {
    localStorage.setItem(MUTE_KEY, String(v))
  } catch { /* ignore */ }
}

export function toggleMute() {
  const next = !isMuted()
  setMuted(next)
  return next
}

// ─── 内部工具 ──────────────────────────────────────────────

/** 创建一个带 gain 包络的 oscillator，返回 { osc, gain } 供调用方调度 */
function createTone(freq, type = 'sine') {
  const c = getCtx()
  if (!c) return null

  // 部分浏览器需在用户手势后恢复
  if (c.state === 'suspended') {
    c.resume().catch(() => {})
  }

  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.value = 0
  osc.connect(gain)
  gain.connect(c.destination)
  return { osc, gain }
}

/**
 * 播放一个简单的音调
 * @param {number} freq    - 频率 (Hz)
 * @param {number} dur     - 时长 (秒)
 * @param {number} when    - 开始时间 (相对 ctx.currentTime)
 * @param {string} type    - 波形
 * @param {number} [lfoFreq]  - 可选颤音调制频率
 * @param {number} [lfoDepth] - 可选颤音调制深度
 * @param {number} [gainPeak] - 最大增益（默认 0.3）
 */
function playTone({ freq, dur, when = 0, type = 'sine', lfoFreq, lfoDepth, gainPeak = 0.3 }) {
  try {
    const t = createTone(freq, type)
    if (!t) return

    const { osc, gain } = t
    const now = ctx.currentTime
    const startTime = now + when

    // 可选颤音 LFO
    let lfo = null, lfoGain = null
    if (lfoFreq && lfoDepth) {
      lfo = ctx.createOscillator()
      lfoGain = ctx.createGain()
      lfo.type = 'sine'
      lfo.frequency.value = lfoFreq
      lfoGain.gain.value = lfoDepth
      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)
      lfo.start(startTime)
      lfo.stop(startTime + dur)
    }

    // ADSR 简化：快速 attack + 短 sustain + 快 release
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.005)   // attack
    gain.gain.setValueAtTime(gainPeak * 0.8, startTime + dur * 0.7)  // sustain
    gain.gain.linearRampToValueAtTime(0, startTime + dur)             // release

    osc.start(startTime)
    osc.stop(startTime + dur)

    // 自动清理
    osc.onended = () => {
      try { osc.disconnect() } catch { /* noop */ }
      try { gain.disconnect() } catch { /* noop */ }
      if (lfo) { try { lfo.disconnect() } catch { /* noop */ } }
      if (lfoGain) { try { lfoGain.disconnect() } catch { /* noop */ } }
    }
  } catch { /* 静默降级 — 浏览器不支持时无任何副作用 */ }
}

// ─── 公开 API ──────────────────────────────────────────────

/**
 * 点击音效
 * 正常模式：极轻的“嗒”声（400Hz，0.04s）
 * 简洁模式：短促清脆的"滴"声（800Hz，0.1s）
 */
export function playClick() {
  try {
    if (isMuted()) return
    const theme = getTheme()
    if (theme === 'normal') {
      // 木质嗒声 — 低频率、极短
      playTone({ freq: 400, dur: 0.04, type: 'triangle', gainPeak: 0.2 })
    } else {
      playTone({ freq: 800, dur: 0.1 })
    }
  } catch { /* noop */ }
}

/**
 * 成功音效
 * 正常模式：两个低音木质音符（350Hz + 500Hz）
 * 简洁模式：上升音阶 600→900Hz
 */
export function playSuccess() {
  try {
    if (isMuted()) return
    const theme = getTheme()
    if (theme === 'normal') {
      playTone({ freq: 350, dur: 0.1, when: 0, type: 'triangle', gainPeak: 0.25 })
      playTone({ freq: 500, dur: 0.12, when: 0.12, type: 'triangle', gainPeak: 0.25 })
    } else {
      playTone({ freq: 600, dur: 0.1, when: 0 })
      playTone({ freq: 900, dur: 0.1, when: 0.12 })
    }
  } catch { /* noop */ }
}

/**
 * 成就音效
 * 正常模式：三个低音木质音符（300/400/500Hz）
 * 简洁模式：成就三连音"叮叮叮"
 */
export function playAchievement() {
  try {
    if (isMuted()) return
    const theme = getTheme()
    if (theme === 'normal') {
      playTone({ freq: 300, dur: 0.12, when: 0, type: 'triangle', gainPeak: 0.22 })
      playTone({ freq: 400, dur: 0.12, when: 0.16, type: 'triangle', gainPeak: 0.22 })
      playTone({ freq: 500, dur: 0.15, when: 0.32, type: 'triangle', gainPeak: 0.22 })
    } else {
      playTone({ freq: 800,  dur: 0.12, when: 0 })
      playTone({ freq: 1000, dur: 0.12, when: 0.16 })
      playTone({ freq: 1200, dur: 0.18, when: 0.32 })
    }
  } catch { /* noop */ }
}

/**
 * 错误音效
 * 正常模式：更低沉嗡嗡声 — 150Hz，0.2s
 * 简洁模式：低沉嗡嗡声 — 200Hz，0.2s
 */
export function playError() {
  try {
    if (isMuted()) return
    const theme = getTheme()
    if (theme === 'normal') {
      playTone({
        freq: 150,
        dur: 0.2,
        type: 'triangle',
        lfoFreq: 8,
        lfoDepth: 6,
        gainPeak: 0.22,
      })
    } else {
      playTone({
        freq: 200,
        dur: 0.2,
        type: 'triangle',
        lfoFreq: 10,
        lfoDepth: 8,
      })
    }
  } catch { /* noop */ }
}

// ─── 语音录制音效 ────────────────────────────────────────────

/**
 * 录音开始音效
 * 正常模式：400Hz 木质嗒声，0.05s
 * 简洁模式：400Hz 正弦波，0.08s
 */
export function playRecordStart() {
  try {
    if (isMuted()) return
    const theme = getTheme()
    if (theme === 'normal') {
      playTone({ freq: 400, dur: 0.05, type: 'triangle', gainPeak: 0.2 })
    } else {
      playTone({ freq: 400, dur: 0.08 })
    }
  } catch { /* noop */ }
}

/**
 * 识别成功音效
 * 正常模式：低沉温润上扬音（350Hz→500Hz）
 * 简洁模式：温润上扬音 500Hz→700Hz
 */
export function playRecordSuccess() {
  try {
    if (isMuted()) return
    const theme = getTheme()
    if (theme === 'normal') {
      playTone({ freq: 350, dur: 0.1, when: 0, type: 'triangle', gainPeak: 0.22 })
      playTone({ freq: 500, dur: 0.1, when: 0.08, type: 'triangle', gainPeak: 0.22 })
    } else {
      playTone({ freq: 500, dur: 0.1, when: 0 })
      playTone({ freq: 700, dur: 0.1, when: 0.08 })
    }
  } catch { /* noop */ }
}

/**
 * 识别失败音效
 * 正常模式：更低沉的短音 150Hz 三角波
 * 简洁模式：低沉短音 180Hz 三角波
 */
export function playRecordError() {
  try {
    if (isMuted()) return
    const theme = getTheme()
    if (theme === 'normal') {
      playTone({ freq: 150, dur: 0.15, type: 'triangle', gainPeak: 0.2 })
    } else {
      playTone({ freq: 180, dur: 0.15, type: 'triangle' })
    }
  } catch { /* noop */ }
}
