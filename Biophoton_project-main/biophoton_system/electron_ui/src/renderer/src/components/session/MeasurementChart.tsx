import { ChartContainer, ChartConfig } from '@renderer/components/ui/chart'
import { PitchFollower } from '@renderer/utils/pitch-follower'
import { Point } from '@shared/types/point'
import { useEffect, useRef, useState } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

const chartConfig = {
  value: {
    label: 'Point',
    color: 'var(--chart-1)'
  }
} satisfies ChartConfig

// 7-second window at 100 ms/sample
const SAMPLE_INTERVAL_MS = window.api.SAMPLE_INTERVAL_MS
const WINDOW_SEC = SAMPLE_INTERVAL_MS == 100 ? 7 : 3
const POINTS_IN_WINDOW = Math.ceil((WINDOW_SEC * 1000) / SAMPLE_INTERVAL_MS)
const VARIANCE_THRESHOLD = 1.5

export function MeasurementChart(): React.JSX.Element {
  const [data, setData] = useState<Point[]>([])
  const [xMax, setXMax] = useState(0)
  const unsubRef = useRef<null | (() => void)>(null)
  const audioRef = useRef<PitchFollower | null>(null)

  const isFlatRef = useRef(true)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        // stop previous subscription
        unsubRef.current?.()
        unsubRef.current = null

        if (cancelled) return

        // subscribe to incoming points
        unsubRef.current = window.api.onValue(async (p) => {
          if (cancelled) return

          // start audio follower
          if (!audioRef.current) {
            audioRef.current = new PitchFollower()
            await audioRef.current.start()
            // start muted
            audioRef.current.setMuted(true)
          }

          setData((prev) => {
            const next = [...prev, p]
            const trimmed =
              next.length > POINTS_IN_WINDOW ? next.slice(next.length - POINTS_IN_WINDOW) : next

            // flat / variable detection
            if (trimmed.length > 1 && audioRef.current) {
              let minY = trimmed[0].y
              let maxY = trimmed[0].y
              for (const pt of trimmed) {
                if (pt.y < minY) minY = pt.y
                if (pt.y > maxY) maxY = pt.y
              }

              const range = maxY - minY
              const isChangingNow = range >= VARIANCE_THRESHOLD

              // if previously flat and now changing -> unmute
              if (isFlatRef.current && isChangingNow) {
                isFlatRef.current = false
                audioRef.current.setMuted(false)
              }

              // if previously changing and now flat -> mute
              if (!isFlatRef.current && !isChangingNow) {
                isFlatRef.current = true
                audioRef.current.setMuted(true)
              }
            }

            return trimmed
          })

          setXMax(p.x)

          // Update pitch every sample
          audioRef.current?.update(p.y, SAMPLE_INTERVAL_MS / 1000)
        })

        // start the stream after handler is ready
        await window.api.measurementStart()
      } catch (e) {
        console.error('MeasurementChart start failed:', e)
      }
    })()
    // auto-clean on unmount
    return () => {
      cancelled = true

      // unsubscribe from stream events
      unsubRef.current?.()
      unsubRef.current = null

      // stop audio follower
      try {
        void audioRef.current?.stop()
      } catch {
        // ignore
      }

      // stop backend stream
      try {
        void window.api.stop()
      } catch {
        // ignore
      }
    }
  }, [])

  const xMin = Math.max(1, xMax - POINTS_IN_WINDOW + 1)

  return (
    <div className="h-full">
      <ChartContainer config={chartConfig} className="w-full h-full">
        <LineChart
          accessibilityLayer
          data={data}
          margin={{
            left: -27,
            right: 0,
            top: 2,
            bottom: 25
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis type="number" dataKey="x" domain={[xMin, xMax]} allowDataOverflow hide />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickCount={3}
            ticks={[0, 50, 100]}
            domain={[0, 100]}
            allowDataOverflow={true}
          />
          <Line
            dataKey="y"
            type="monotone"
            stroke="var(--color-value)"
            strokeWidth={3}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
