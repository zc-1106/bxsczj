/**
 * Web Audio API 轻量音效合成 — 无外部音频文件依赖
 *
 * 所有函数内部已做 try-catch 防护，AudioContext 不可用时静默降级。
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
 */
function playTone({ freq, dur, when = 0, type = 'sine', lfoFreq, lfoDepth }) {
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
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.005)   // attack
    gain.gain.setValueAtTime(0.25, startTime + dur * 0.7)       // sustain
    gain.gain.linearRampToValueAtTime(0, startTime + dur)        // release

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
 * 短促清脆的"滴"声 — 正弦波 800Hz，持续 0.1s
 */
export function playClick() {
  try {
    if (isMuted()) return
    playTone({ freq: 800, dur: 0.1 })
  } catch { /* noop */ }
}

/**
 * 上升音阶 — 两个连续正弦波 600→900Hz，各 0.1s
 */
export function playSuccess() {
  try {
    if (isMuted()) return
    playTone({ freq: 600, dur: 0.1, when: 0 })
    playTone({ freq: 900, dur: 0.1, when: 0.12 })
  } catch { /* noop */ }
}

/**
 * 成就三连音"叮叮叮" — 800/1000/1200Hz，像烤箱提示
 */
export function playAchievement() {
  try {
    if (isMuted()) return
    playTone({ freq: 800,  dur: 0.12, when: 0 })
    playTone({ freq: 1000, dur: 0.12, when: 0.16 })
    playTone({ freq: 1200, dur: 0.18, when: 0.32 })
  } catch { /* noop */ }
}

/**
 * 低沉嗡嗡声 — 200Hz，0.2s，轻微颤音
 */
export function playError() {
  try {
    if (isMuted()) return
    playTone({
      freq: 200,
      dur: 0.2,
      type: 'triangle',
      lfoFreq: 10,   // 每秒 10 次颤音
      lfoDepth: 8,   // ±8Hz 偏移
    })
  } catch { /* noop */ }
}
