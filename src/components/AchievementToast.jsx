import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'

/**
 * 卡通风格成就解锁 Toast + 五彩纸屑
 * 简约 + 卡通融合风：软投影、大圆角、暖色调
 */
export default function AchievementToast({ achievement }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!achievement) return
    setVisible(true)

    // 五彩纸屑 — 马卡龙色系
    const duration = 3500
    const end = Date.now() + duration
    const colors = ['#f4b860', '#e07b5a', '#f4945e', '#8db580', '#f9e79f', '#d4c4f0']

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.6 },
        colors,
      })
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.6 },
        colors,
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()

    const timer = setTimeout(() => setVisible(false), 4500)
    return () => clearTimeout(timer)
  }, [achievement])

  if (!visible || !achievement) return null

  return (
    <div className="fixed inset-x-0 top-8 z-50 flex justify-center pointer-events-none animate-pop">
      <div
        className="pointer-events-auto rounded-[20px]
                   bg-gradient-to-br from-[#fef3c7] via-[#fde8c5] to-[#fce4c1]
                   px-8 py-5 text-center
                   shadow-[0_8px_30px_rgba(180,130,60,0.18)]
                   border border-[#f0da7a]"
      >
        <p className="text-5xl drop-shadow-sm">{achievement.emoji}</p>
        <p className="mt-2 text-sm font-extrabold text-[#b08a3e]">
          🎊 获得勋章
        </p>
        <p className="text-lg font-extrabold text-[#8b6914]">
          {achievement.title}
        </p>
      </div>
    </div>
  )
}
