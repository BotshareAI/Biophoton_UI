import { BandageIcon } from '@renderer/components/icons/bandage'
import FootIcon from '@renderer/components/icons/foot'
import NeckIcon from '@renderer/components/icons/neck'
import SpiralIcon from '@renderer/components/icons/spiral'
import { MeasurementChart } from '@renderer/components/session/MeasurementChart'
import { MeridiansDialog } from '@renderer/components/session/MeridiansDialog'
import { Remedies } from '@renderer/components/session/Remedies'
import { SymptomsDialog } from '@renderer/components/session/SymptomsDialog'
import { ProgramRun } from '@renderer/components/session/ProgramRun'
import { Button } from '@renderer/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@renderer/components/ui/card'
import { Drawer, DrawerContent } from '@renderer/components/ui/drawer'
import { Avatar } from '@renderer/components/users/Avatar'
import { useRemediesStore } from '@renderer/store/remediesStore'
import { useSessionStore } from '@renderer/store/sessionStore'
import { useRouter } from '@tanstack/react-router'
import clsx from 'clsx'
import {
  ArrowUpDown,
  BedSingle,
  CircleArrowLeft,
  CircleArrowRight,
  CircleCheckBig,
  ClipboardPlus,
  HandIcon,
  X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { RecordPoints } from '@renderer/components/session/Points'
import { ProgramRunShort } from '@renderer/components/session/ProgramRunShort'
import { nextPointer, prevPointer } from '@renderer/utils/steps'
import { useProgramsStore } from '@renderer/store/programsStore'
import { Remedy } from '@shared/types/remedy'
import { preloadRules } from '@renderer/constants/preload'
import Keyboard from '@renderer/components/keyboard'

export function SessionPage({
  endSession,
  type
}: {
  endSession: () => void
  type: number
}): React.JSX.Element {
  const router = useRouter()
  const remedies = useRemediesStore((state) => state.remedies)
  const isFootplate = useRemediesStore((state) => state.isFootplate)
  const resetAll = useRemediesStore((state) => state.resetAll)
  const selectedRemedies = useRemediesStore((state) => state.selectedRemedies)
  const footplateRemedies = useRemediesStore((state) => state.footplateRemedies)
  const currentStep = useSessionStore((state) => state.currentStep)
  const setCurrentStep = useSessionStore((s) => s.setCurrentStep)
  const isAdults = useSessionStore((state) => state.isAdultSession)
  const user = useSessionStore((state) => state.user)
  const toggleIsAdults = useSessionStore((state) => state.toggleIsAdultSession)
  const addSavedProgram = useSessionStore((state) => state.addSavedProgram)
  const showRecordPoints = useSessionStore((s) => s.showRecordPoints)
  const toggleRecordPoints = useSessionStore((s) => s.toggleRecordPoints)
  const [program, setProgram] = useState(0)
  const [programOption, setProgramOption] = useState(0)
  const [open, setOpen] = useState(false)
  const [openMeridian, setOpenMeridian] = useState(false)
  const [openKeyboard, setOpenKeyboard] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  useEffect(() => {
    if (currentStep == 2) {
      setProgram(user?.active ? 0 : 1)
    } else {
      setProgram(0)
    }
    setProgramOption(0)
  }, [currentStep, user?.active])
  const getIcon = (icon: string, fill: string): React.ReactElement => {
    if (icon == 'neck')
      return (
        <div style={{ width: '30px' }}>
          <NeckIcon fill={fill} style={{ width: '100%', height: 'auto' }} />
        </div>
      )
    if (icon == 'spiral')
      return (
        <div style={{ width: '30px' }}>
          <SpiralIcon fill={fill} style={{ width: '100%', height: 'auto' }} />
        </div>
      )
    if (icon == 'hand')
      return (
        <div style={{ width: '30px' }}>
          <HandIcon fill={fill} style={{ width: '100%', height: 'auto' }} />
        </div>
      )
    if (icon == 'foot')
      return (
        <div style={{ width: '30px' }}>
          <FootIcon fill={fill} style={{ width: '100%', height: 'auto' }} />
        </div>
      )
    if (icon == 'bed')
      return (
        <div style={{ width: '30px' }}>
          <BedSingle fill={fill} style={{ width: '100%', height: 'auto' }} />
        </div>
      )
    if (icon == 'updown')
      return (
        <div style={{ width: '30px' }}>
          <ArrowUpDown fill={fill} style={{ width: '100%', height: 'auto' }} />
        </div>
      )
    return (
      <div style={{ width: '30px' }}>
        <BandageIcon fill={fill} style={{ width: '100%', height: 'auto' }} />
      </div>
    )
  }
  const stepsDef = useProgramsStore((s) => s.getSteps)(isAdults)
  const programs = useProgramsStore((s) => s.getProgramsByStep)(currentStep, isAdults)
  const getLounge = useProgramsStore((s) => s.getLounge)
  const getInversion = useProgramsStore((s) => s.getInversion)
  let stepPrograms
  if (type == 1) {
    stepPrograms = programs
  } else {
    stepPrograms = type == 2 ? [getInversion()] : [getLounge()]
  }
  const onSaveProgram = (): void => {
    const currentProgram = stepPrograms[program]
    let programVariantId
    const programVariantIds = currentProgram.programVariantIds
    if (programVariantIds.length > 1) {
      programVariantId = currentProgram.options
        ? programVariantIds[programOption]
        : isAdults
          ? programVariantIds[0]
          : programVariantIds[1]
    } else {
      programVariantId = programVariantIds[0]
    }
    addSavedProgram({
      programId: currentProgram.id,
      programVariantId: programVariantId,
      step: currentStep,
      remedies:
        type == 3
          ? [
              ...selectedRemedies.filter((r) => r != null),
              ...footplateRemedies.filter((r) => r != null)
            ]
          : selectedRemedies.filter((r) => r != null)
    })
  }
  const goToNextPointer = (preload: Remedy[] = []): void => {
    const next = nextPointer(currentStep, stepsDef)
    resetAll(preload)
    if (!next) {
      endSession()
      return
    }
    setCurrentStep(next)
  }
  const goToPrevPointer = (): void => {
    const prev = prevPointer(currentStep, stepsDef)
    resetAll()
    if (prev) {
      showRecordPoints && toggleRecordPoints(false)
      setCurrentStep(prev)
    } else {
      router.navigate({ to: '/users' })
    }
  }
  const onDoneMeridians = (meridianNames: string[]): void => {
    showRecordPoints && toggleRecordPoints(false)
    let preload: Remedy[] = []
    if (user?.gender == 1) {
      preload = remedies.filter((r) => r.name === 'Populus')
    } else if (user?.gender == 2) {
      preload = remedies.filter((r) => r.name === 'Solidago')
    }
    meridianNames.forEach((m) => {
      preloadRules[m]?.forEach((rem) => preload.push(...remedies.filter((r) => r.name === rem)))
    })
    // Appendicitis N, C,A, or other Appendicitis
    if (selectedRemedies.some((r) => r?.name.startsWith('Appendicitis'))) {
      ;['Tonsilla Comp', 'Chelidonium', 'Nux Vomica'].forEach((rem) =>
        preload.push(...remedies.filter((r) => r.name === rem))
      )
    }
    if (
      meridianNames.includes('Large Intestine') ||
      meridianNames.includes('Small Intestine') ||
      meridianNames.includes('Stomach')
    ) {
      ;[
        'Nux Vomica',
        'Podophyllum',
        'Diarrheel',
        'duodenoheel',
        'Mercurisheel',
        'Mucosa',
        'Erigotheel',
        'Gastircumheel'
      ].forEach((rem) => preload.push(...remedies.filter((r) => r.name === rem)))
    }
    // If any Ulcer remedy was used
    if (selectedRemedies.some((r) => r?.name.startsWith('Ulcer'))) {
      preload.push(...remedies.filter((r) => r.name === 'Anacardium'))
    }
    // If any Stone remedy was used
    if (selectedRemedies.some((r) => r?.name.startsWith('Stone'))) {
      preload.push(...remedies.filter((r) => r.name === 'Reneel'))
    }
    goToNextPointer([...new Set(preload)].slice(0, 10))
  }
  const showRemedies = type == 1 ? currentStep > 1 : true
  const renderButtonOptions = (): React.JSX.Element => (
    <div className="grid grid-cols-3 gap-2 w-full">
      {stepPrograms.map(({ label, icon }, idx) => (
        <Button
          key={label}
          variant={program == idx ? 'default' : 'outline'}
          onClick={() => setProgram(idx)}
          className={clsx(
            program == idx && 'font-semibold',
            currentStep == 2 || currentStep == 4 ? 'w-36' : 'w-34'
          )}
        >
          {icon && getIcon(icon, program == idx ? 'white' : 'black')}
          {label}
        </Button>
      ))}
    </div>
  )
  const onFocus = (): void => {
    setOpenKeyboard(true)
  }
  return (
    <div className="flex flex-col">
      <div className="flex flex-row gap-4">
        {showRecordPoints ? (
          <div className="flex gap-4 flex-[65%] relative">
            <RecordPoints />
            <Button
              variant="ghost"
              className="absolute right-2 top-0 z-20"
              onClick={() => toggleRecordPoints(false)}
            >
              <X />
            </Button>
          </div>
        ) : showRemedies ? (
          <div className="flex flex-col gap-4 flex-[65%] w-1">
            {renderButtonOptions()}
            <Remedies
              footplate={isFootplate}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onFocus={onFocus}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4 flex-[65%]">
            <div className="flex flex-col gap-4 mb-3">
              <p className="text-lg font-semibold mb-4">Choose a program</p>
              {renderButtonOptions()}
            </div>
            <ProgramRun
              program={stepPrograms[program]}
              isAdults={isAdults}
              programOption={programOption}
              onComplete={onSaveProgram}
              setProgramOption={setProgramOption}
              blood={user?.blood}
              saliva={user?.saliva}
              photo={user?.photo}
            />
          </div>
        )}
        <div className="flex flex-col flex-[35%] gap-2">
          <Card className="relative gap-2 h-full">
            <CardHeader className="border-b-1">
              <CardTitle>
                <div className="flex flex-col gap-4 items-center">
                  <div className="rounded-full overflow-hidden bg-muted size-20">
                    <Avatar src={user?.photoFile ? `avatar:///${user.photoFile}` : undefined} />
                  </div>
                  <div className="flex gap-1.5">
                    <p className="text-gray-500">Client:</p>
                    <p className="font-semibold">
                      {user ? `${user.firstName} ${user.lastName}` : '/'}
                    </p>
                  </div>
                  <div className="flex gap-4 pb-2">
                    <Button
                      size="sm"
                      onClick={() => toggleIsAdults(true)}
                      variant={isAdults ? 'default' : 'outline'}
                      className="border"
                    >
                      Adult
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => toggleIsAdults(false)}
                      variant={isAdults ? 'outline' : 'default'}
                      className="px-4 border"
                    >
                      Kid
                    </Button>
                  </div>
                </div>
              </CardTitle>
              <Button
                variant="ghost"
                className="absolute top-3 right-2"
                onClick={() => setOpen(!open)}
              >
                <ClipboardPlus />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-1 py-0 pt-2 h-full">
              <MeasurementChart />
              {currentStep > 1 && (
                <Button onClick={() => toggleRecordPoints(!showRecordPoints)}>Record Points</Button>
              )}
            </CardContent>
          </Card>
          {showRemedies ? (
            <ProgramRunShort
              program={stepPrograms[program]}
              isAdults={isAdults}
              onComplete={onSaveProgram}
              blood={user?.blood}
              saliva={user?.saliva}
              photo={user?.photo}
              selectedRemedies={selectedRemedies}
            />
          ) : (
            <div className="h-[112px]" />
          )}
        </div>
      </div>
      <Drawer open={true} onOpenChange={() => null} modal={false} dismissible={false}>
        <DrawerContent
          className={clsx(
            'flex flex-row justify-center gap-6 pb-4 pt-6 bg-white border-t-[1px]',
            type == 1 && 'justify-between px-6'
          )}
        >
          <Button onClick={endSession} className="w-36">
            <CircleCheckBig />
            End Session
          </Button>
          {type == 1 && (
            <div className="flex flex-row gap-6">
              <Button onClick={goToPrevPointer} className="w-36">
                <CircleArrowLeft />
                Back
              </Button>
              <Button
                onClick={() => {
                  if (currentStep > 4) endSession()
                  else if (currentStep == 2) {
                    setOpenMeridian(true)
                  } else {
                    showRecordPoints && toggleRecordPoints(false)
                    goToNextPointer()
                  }
                }}
                className="w-36"
              >
                <CircleArrowRight />
                Proceed
              </Button>
            </div>
          )}
        </DrawerContent>
      </Drawer>
      <SymptomsDialog open={open} setOpen={setOpen} />
      <MeridiansDialog open={openMeridian} setOpen={setOpenMeridian} onDone={onDoneMeridians} />
      <Drawer open={openKeyboard} dismissible={false} modal={false}>
        <DrawerContent className="px-4 pt-1 pb-3 bg-[#e3e7e6]">
          <Keyboard setInput={setSearchTerm} onClose={() => setOpenKeyboard(false)} />
        </DrawerContent>
      </Drawer>
    </div>
  )
}
