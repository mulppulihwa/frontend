import { useEffect, useState } from 'react'

export default function useLoadingProgress(active, finishDelay = 320) {
  const [progress, setProgress] = useState(active ? 8 : 100)
  const [visible, setVisible] = useState(active)

  useEffect(() => {
    if (!active) {
      const finishTimer = window.setTimeout(() => setProgress(100), 0)
      const hideTimer = window.setTimeout(() => setVisible(false), finishDelay)
      return () => {
        window.clearTimeout(finishTimer)
        window.clearTimeout(hideTimer)
      }
    }

    const startTimer = window.setTimeout(() => {
      setVisible(true)
      setProgress(current => current >= 100 ? 8 : Math.max(8, current))
    }, 0)
    const progressTimer = window.setInterval(() => {
      setProgress(current => {
        if (current >= 92) return 92
        const remaining = 92 - current
        return Math.min(92, current + Math.max(1, Math.ceil(remaining * 0.12)))
      })
    }, 180)

    return () => {
      window.clearTimeout(startTimer)
      window.clearInterval(progressTimer)
    }
  }, [active, finishDelay])

  return { progress, visible }
}
