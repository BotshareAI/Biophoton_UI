import { Button } from '@renderer/components/ui/button'
import { Card, CardHeader, CardContent } from '@renderer/components/ui/card'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { ProgressBar } from './ProgressBar'
import { timeToSeconds } from '@renderer/utils/time-to-seconds'
import { Program } from '@shared/types/program'

interface ProgramRunProps {
  program?: Program
  isAdults: boolean
  programOption: number
  onComplete: () => void
  setProgramOption: (option: number) => void
  blood?: number
  saliva?: number
  photo?: number
}

export const ProgramRun = ({
  program,
  isAdults,
  programOption,
  setProgramOption,
  onComplete,
  blood,
  saliva,
  photo
}: ProgramRunProps): React.JSX.Element => {
  const totalSeconds = useMemo(() => {
    let totalTime
    if (program) {
      if (Array.isArray(program.totalTime)) {
        if (program.options) {
          totalTime = program.totalTime[programOption]
        } else {
          totalTime = isAdults ? program.totalTime[0] : program.totalTime[1]
        }
      } else {
        totalTime = program.totalTime
      }
    }
    return timeToSeconds(totalTime)
  }, [program, isAdults, programOption])
  const [start, setStart] = useState(false)

  useEffect(() => {
    if (program) {
      setStart(false)
    }
  }, [program])

  const onCompleteProgram = useCallback(async () => {
    await window.api.treatmentStop()
    await window.api.measurementStart()
    setStart(false)
    onComplete()
  }, [onComplete])
  const onStartStop = async (): Promise<void> => {
    if (start) {
      await window.api.treatmentStop()
      await window.api.measurementStart()
    } else {
      await window.api.measurementStop()
      await window.api.treatmentStart({
        blood: blood || 100,
        saliva: saliva || 200,
        photo: photo || 300,
        // TODO set program remedies for the pre session programs
        remedies: [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000],
        durationMs: totalSeconds * 1000
      })
    }
    setStart(!start)
  }
  const onClickOption = (e): void => {
    setProgramOption(parseInt((e.currentTarget as HTMLButtonElement).value))
  }
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <span className="font-semibold">Program Run</span>
        <div className="flex gap-2">
          {program?.options ? (
            program?.options.map((o, i) => (
              <Button
                key={o}
                variant={programOption == i ? 'default' : 'outline'}
                className="border"
                onClick={onClickOption}
                value={i}
                size="sm"
              >
                {o}
              </Button>
            ))
          ) : (
            <div className="h-[43px]" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ProgressBar totalTime={totalSeconds} started={start} onComplete={onCompleteProgram} />
        <div className="flex justify-end mt-10">
          <Button variant="destructive" className="w-26 font-semibold" onClick={onStartStop}>
            {start ? 'Stop' : 'Start'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
