import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { useLang } from '../i18n/LanguageContext.jsx'

export default function AchievementToast({ achievement, theme }) {
  const [visible, setVisible] = useState(false)
  const isNormal = theme === 'normal'
  const { t } = useLang()

  useEffect(() => {
    if (!achievement) return
    setVisible(true)
    if (!isNormal) {
      const duration = 3500
      const end = Date.now() + duration
      const colors = ['#f4b860', '#e07b5a', '#f4945e', '#8db580', '#f9e79f', '#d4c4f0']
      const frame = () => {
        confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.6 }, colors })
        confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.6 }, colors })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
    }
    const timer = setTimeout(() => setVisible(false), 4500)
    return () => clearTimeout(timer)
  }, [achievement, isNormal])

  if (!visible || !achievement) return null

  if (isNormal) {
    return (
      <div className="fixed inset-x-0 bottom-8 z-50 flex justify-center pointer-events-none">
        <div className="achievement-toast pointer-events-auto">{t(`achievement.${achievement.threshold || 5}`)}</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-x-0 top-8 z-50 flex justify-center pointer-events-none animate-pop">
      <div className="pointer-events-auto rounded-[20px] bg-gradient-to-br from-[#fef3c7] via-[#fde8c5] to-[#fce4c1] px-8 py-5 text-center shadow-[0_8px_30px_rgba(180,130,60,0.18)] border border-[#f0da7a]">
        <p className="text-5xl drop-shadow-sm">{achievement.emoji}</p>
        <p className="mt-2 text-sm font-extrabold text-[#b08a3e]">🎊 {t('achievement.unlocked')}</p>
        <p className="text-lg font-extrabold text-[#8b6914]">{t(`achievement.${achievement.threshold || 5}`)}</p>
      </div>
    </div>
  )
}
