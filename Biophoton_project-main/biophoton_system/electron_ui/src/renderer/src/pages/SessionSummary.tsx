import { useState, useRef } from 'react'
import { Card, CardHeader, CardContent } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Textarea } from '@renderer/components/ui/textarea'
import { SessionProgram } from '@shared/types/session'
import { User } from '@shared/types/user'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader
} from '@renderer/components/ui/dialog'
// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger
// } from '@renderer/components/ui/collapsible'
import { isoFormatDate } from '@renderer/utils/iso-format'
import { ReadPoints } from '@renderer/components/session/ReadPoints'
import { Check, MoveLeft } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import { useProgramsStore } from '@renderer/store/programsStore'
import { Points } from '@shared/types/points'

type SessionSummaryProps = {
  programs: SessionProgram[]
  user?: User
  onSave?: (recommendation: string) => void
  recommendation?: string
  dateTime?: string
  meridians: string[]
  symptoms: string
  isAdult: boolean
  droppingPoints: Points
  droppingAfterPoints: Points
}

export function SessionSummary({
  programs,
  user,
  onSave,
  recommendation,
  dateTime,
  meridians,
  symptoms,
  isAdult,
  droppingPoints,
  droppingAfterPoints
}: SessionSummaryProps): React.JSX.Element {
  const [input, setInput] = useState(recommendation || '')
  const [open, setOpen] = useState(false)
  // const [expand, setExpand] = useState(false)
  const dialogType = useRef('')
  const router = useRouter()

  const remediesLen = programs.reduce((acc, p) => acc + (p.remedies?.length || 0), 0)
  // const fullPrograms = isAdult ? programsAdult : programsKid
  const getProgramsByStep = useProgramsStore((s) => s.getProgramsByStep)
  // const meridians = [
  //   ...new Set(programs.flatMap((program) => program.remedies.map((remedy) => remedy.meridian)))
  // ]

  const openPrograms = (): void => {
    if (programs.length > 0) {
      dialogType.current = 'programs'
      setOpen(true)
    }
  }

  const openRemedies = (): void => {
    if (remediesLen > 0) {
      dialogType.current = 'remedies'
      setOpen(true)
    }
  }

  const openUser = (): void => {
    dialogType.current = 'user'
    setOpen(true)
  }

  const getRemedyCategory = (step: number): string => {
    if (step == 2) return 'Assessed'
    if (step == 3) return 'Support'
    return ''
  }

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex flex-row gap-2 items-center">
        <Button variant="ghost" onClick={() => router.history.back()}>
          <MoveLeft />
        </Button>
        {dateTime ? (
          <h1 className="font-bold">Session Summary ({isoFormatDate(dateTime)})</h1>
        ) : (
          <h1 className="font-bold">Session Summary</h1>
        )}
      </div>
      <div className="flex-1 flex gap-2">
        <Card className="flex-1" onClick={openUser}>
          <CardHeader className="font-semibold">Client</CardHeader>
          <CardContent className="text-center  text-xl">
            {user ? `${user.firstName} ${user.lastName}` : '/'}
          </CardContent>
        </Card>
        <Card className="flex-1 relative" onClick={openPrograms}>
          <CardHeader className="font-semibold">Programs</CardHeader>
          <CardContent className="text-center  text-xl">{programs.length}</CardContent>
        </Card>
        <Card className="flex-1 relative" onClick={openRemedies}>
          <CardHeader className="font-semibold">Remedies</CardHeader>
          <CardContent className="text-center text-xl">{remediesLen}</CardContent>
        </Card>
      </div>

      {/* <Card className="flex-1">
        <CardContent className="grid grid-cols-2 gap-4 text-lg">
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-center">Before Treatment</h3>
            <p className="text-center">Dropping: {beforeDropping}</p>
            <p className="text-center">Stable: {beforeStable}</p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-center">After Treatment</h3>
            <p className="text-center">Dropping: {afterDropping}</p>
            <p className="text-center">Stable: {afterStable}</p>
          </div>
        </CardContent>
      </Card> */}

      <Card className="flex-1 flex flex-col">
        <CardHeader className="font-semibold">Recommendation</CardHeader>
        <CardContent className="flex-1 pb-2">
          <Textarea
            className="w-full h-full text-lg"
            placeholder="Write recommendation here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            readOnly={!!dateTime}
          />
        </CardContent>
      </Card>

      <Card className="flex-1 flex flex-col">
        <CardHeader className="font-semibold">Recorded Points</CardHeader>
        <CardContent className="flex-1 pb-2">
          <div className="flex flex-[65%]">
            <ReadPoints droppingPoints={droppingPoints} droppingAfterPoints={droppingAfterPoints} />
          </div>
        </CardContent>
      </Card>

      {onSave && (
        <div className="flex justify-center">
          <Button className="px-10 mt-2" onClick={() => onSave(input)}>
            Save
          </Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="[&>button]:hidden bg-white">
          <DialogHeader className="font-semibold">
            {dialogType.current === 'programs'
              ? 'Programs completed'
              : dialogType.current === 'user'
                ? user
                  ? `${user.firstName} ${user.lastName}`
                  : 'Client'
                : 'Remedies applied'}
          </DialogHeader>
          {dialogType.current === 'programs' ? (
            <div className="flex flex-row gap-8">
              <div>
                <span className="font-medium">Pre Session:</span>
                {getProgramsByStep(1, isAdult).map((p) => (
                  <div key={p.id} className="flex flex-row gap-1 items-center">
                    {programs.filter((prog) => prog.programId == p.id).length > 0 ? (
                      <Check />
                    ) : (
                      <div className="w-[24px]" />
                    )}
                    {p.label}
                  </div>
                ))}
              </div>
              <div>
                <p className="font-medium">Handrod Session:</p>
                {getProgramsByStep(2, isAdult).map((p) => (
                  <div key={p.id} className="flex flex-row gap-1 items-center">
                    {programs.filter((prog) => prog.programId == p.id).length > 0 ? (
                      <Check />
                    ) : (
                      <div className="w-[24px]" />
                    )}
                    {p.label}
                  </div>
                ))}
                <p className="font-medium mt-4">Footplate Session:</p>
                {getProgramsByStep(3, isAdult).map((p) => (
                  <div key={p.id} className="flex flex-row gap-1 items-center">
                    {programs.filter((prog) => prog.programId == p.id).length > 0 ? (
                      <Check />
                    ) : (
                      <div className="w-[24px]" />
                    )}
                    {p.label}
                  </div>
                ))}
                <p className="font-medium mt-4">Post Session:</p>
                {getProgramsByStep(4, isAdult).map((p) => (
                  <div key={p.id} className="flex flex-row gap-1 items-center">
                    {programs.filter((prog) => prog.programId == p.id).length > 0 ? (
                      <Check />
                    ) : (
                      <div className="w-[24px]" />
                    )}
                    {p.label}
                  </div>
                ))}
              </div>
            </div>
          ) : dialogType.current === 'user' ? (
            <div>
              <div className="mb-4">
                <span className="font-medium">Focus Meridians:</span>{' '}
                {meridians.length > 0 ? meridians.join(', ') : '/'}
              </div>
              <p className="font-medium mb-2">Symptoms</p>
              <Textarea value={symptoms} readOnly />
            </div>
          ) : (
            <div>
              {programs
                .filter((program) => program.remedies && program.remedies.length > 0)
                .map((program) => (
                  <div key={program.programId} className="mb-4">
                    <span className="font-medium">
                      {getRemedyCategory(program.step)} Remedies:{' '}
                    </span>
                    {program.remedies.map((r) => r.name).join(', ')}
                  </div>
                ))}
            </div>
            // <Collapsible
            //   open={expand}
            //   onOpenChange={setExpand}
            //   // className="flex w-fill flex-col gap-2"
            // >
            //   <div>Remedies have been applied for these meridians: {meridians.join(', ')}</div>
            //   <CollapsibleContent className="flex flex-col">
            //     {programs
            //       .filter((program) => program.remedies && program.remedies.length > 0)
            //       .map((program) => (
            //         <div key={program.programLabel}>
            //           - {program.programLabel}: {program.remedies.map((r) => r.name).join(', ')}
            //         </div>
            //       ))}
            //   </CollapsibleContent>
            //   <CollapsibleTrigger asChild>
            //     <p className="text-primary mt-4 cursor-pointer">View {expand ? 'Less' : 'More'}</p>
            //   </CollapsibleTrigger>
            // </Collapsible>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
