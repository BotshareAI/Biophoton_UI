import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import { useEffect, useMemo, useState, useRef } from 'react'
import { timeToSeconds } from '@renderer/utils/time-to-seconds'
import { Program } from '@shared/types/program'
import { formatTime } from '@renderer/utils/timer'
import { CirclePlay, CircleStop } from 'lucide-react'
import { Remedy } from '@shared/types/remedy'

interface ProgramRunProps {
  program?: Program
  isAdults: boolean
  onComplete: () => void
  blood?: number
  saliva?: number
  photo?: number
  selectedRemedies: (Remedy | null)[]
}

export const ProgramRunShort = ({
  program,
  isAdults,
  onComplete,
  blood,
  saliva,
  photo,
  selectedRemedies
}: ProgramRunProps): React.JSX.Element => {
  const totalTime = useMemo(() => {
    let totalTime
    if (program) {
      if (Array.isArray(program.totalTime)) {
        if (program.options) {
          totalTime = program.totalTime
        } else {
          totalTime = isAdults ? program.totalTime[0] : program.totalTime[1]
        }
      } else {
        totalTime = program.totalTime
      }
    }
    return timeToSeconds(totalTime)
  }, [program, isAdults])
  const [remainingTime, setRemainingTime] = useState(totalTime)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const calledRef = useRef(false)
  const [started, setStart] = useState(false)

  useEffect(() => {
    if (!started) {
      calledRef.current = false // reset when stopped
      setRemainingTime(totalTime)
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    if (started) {
      intervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            if (!calledRef.current) {
              calledRef.current = true
              setStart(false)
              onComplete()
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [started, totalTime, onComplete])

  useEffect(() => {
    if (program) {
      setStart(false)
    }
  }, [program])
  // return (
  //   <Card>
  //     <CardContent className="flex items-center justify-between">
  //       <span className="font-semibold">Program Run</span>
  //       <span className="text-2xl font-semibold text-secondary">{formatTime(remainingTime)}</span>
  //       <Button
  //         variant="destructive"
  //         className="w-26 font-semibold"
  //         onClick={() => setStart(!started)}
  //       >
  //         {started ? 'Stop' : 'Start'}
  //       </Button>
  //     </CardContent>
  //   </Card>
  // )
  const onStartStop = async (): Promise<void> => {
    if (started) {
      await window.api.treatmentStop()
      await window.api.measurementStart()
    } else {
      await window.api.measurementStop()
      await window.api.treatmentStart({
        blood: blood || 100,
        saliva: saliva || 200,
        photo: photo || 300,
        remedies: selectedRemedies.filter((r) => !!r).map((r) => r.frequency),
        durationMs: totalTime * 1000
      })
    }
    setStart(!started)
  }
  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <span className="font-semibold">Run</span>
        <span className="text-2xl font-semibold text-secondary">{formatTime(remainingTime)}</span>
        <Button variant="destructive" className="font-semibold size-10" onClick={onStartStop}>
          {started ? <CircleStop className="size-6" /> : <CirclePlay className="size-6" />}
        </Button>
      </CardContent>
    </Card>
  )
}
