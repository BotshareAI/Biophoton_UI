import { formatTime } from '@renderer/utils/timer'
import { useState, useRef, useEffect } from 'react'

type ProgressBarProps = {
  totalTime: number // total time in seconds
  started: boolean
  onComplete: () => void
}

export function ProgressBar({
  totalTime,
  started,
  onComplete
}: ProgressBarProps): React.JSX.Element {
  const [progress, setProgress] = useState(0) // % progress
  const [remainingTime, setRemainingTime] = useState(totalTime)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const calledRef = useRef(false)

  useEffect(() => {
    if (!started) {
      calledRef.current = false // reset when stopped
      setProgress(0)
      setRemainingTime(totalTime)
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    if (started) {
      intervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            setProgress(100)
            if (!calledRef.current) {
              calledRef.current = true
              onComplete()
            }
            return 0
          }
          return prev - 1
        })

        setProgress((prev) => {
          const increment = 100 / totalTime
          return Math.min(prev + increment, 100)
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [started, totalTime, onComplete])

  return (
    <div className="flex flex-col items-center w-full gap-4">
      <span className="text-2xl font-semibold text-secondary">{formatTime(remainingTime)}</span>
      <div className="flex w-full max-w-3xl h-8 rounded-full overflow-hidden border border-gray-300 bg-gray-300">
        <div
          className="bg-[#A3B8B5] transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
