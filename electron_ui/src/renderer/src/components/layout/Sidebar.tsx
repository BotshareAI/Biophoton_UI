import { Button } from '@renderer/components/ui/button'
import {
  Star,
  Pill,
  UserRoundPlus,
  Settings,
  LogOut,
  SquareCode,
  ChevronDown,
  PillIcon
} from 'lucide-react'
import { useRemediesStore } from '@renderer/store/remediesStore'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../ui/collapsible'
import { useEffect, useRef, useState } from 'react'
import { useSessionStore } from '@renderer/store/sessionStore'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { Step } from '@shared/types/step'
import { useProgramsStore } from '@renderer/store/programsStore'

interface SidebarProps {
  selected: string
  onSelect: (page: string) => void
  onLogout: () => void
}

const menuItems = [
  { name: 'select_user', Icon: Star },
  { name: 'new_client', Icon: UserRoundPlus },
  { name: 'remedy', Icon: Pill },
  { name: 'settings', Icon: Settings }
]

const mainSidebarNames = [
  ...menuItems.map(({ name }) => name),
  'sessions',
  'session_summary',
  'user_edit',
  'user_details'
]

export function Sidebar({ selected, onSelect, onLogout }: SidebarProps): React.JSX.Element {
  const check = mainSidebarNames.includes(selected)
  const selectedRemedies = useRemediesStore((state) => state.selectedRemedies)
  const footplateRemedies = useRemediesStore((state) => state.footplateRemedies)
  const resetAndSelectSlot = useRemediesStore((state) => state.resetAndSelectSlot)
  // const deleteAll = useRemediesStore((state) => state.deleteAll)
  const currentStep = useSessionStore((state) => state.currentStep)
  const setCurrentStep = useSessionStore((s) => s.setCurrentStep)
  const sessionType = useSessionStore((state) => state.type)
  const isAdults = useSessionStore((state) => state.isAdultSession)
  const [isOpen, setIsOpen] = useState(false)
  const [isOpen2, setIsOpen2] = useState(false)
  const steps = useProgramsStore((s) => s.getSteps)(isAdults)
  const showRemedies = sessionType == 1 ? steps[currentStep - 1]?.showRemedies : true

  const remediesContainerRef = useRef<HTMLDivElement>(null)

  const { t } = useTranslation('common', { keyPrefix: 'sidebar' })

  useEffect(() => {
    setIsOpen(showRemedies)
  }, [showRemedies])

  const toggleOpen = (): void => {
    !isOpen && setIsOpen2(false)
    setIsOpen(!isOpen)
  }
  const toggleOpen2 = (): void => {
    !isOpen2 && setIsOpen(false)
    setIsOpen2(!isOpen2)
  }

  const renderSteps = (step: Step): React.JSX.Element => {
    return (
      <Button
        key={step.label}
        variant="link"
        className={clsx('px-4 justify-start', step.stepNumber === currentStep && 'font-bold')}
        onClick={() => setCurrentStep(step.stepNumber)}
      >
        {step.label}
      </Button>
    )
  }
  return (
    <aside className="w-64 border-r bg-muted h-full flex flex-col">
      <div className="px-4 pt-6">
        <p className="self-center text-xl font-semibold whitespace-nowrap">Biophoton</p>
      </div>
      {check ? (
        <div className="p-4 space-y-2">
          {menuItems.map(({ name, Icon }) => (
            <Button
              key={name}
              variant={name === selected ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => onSelect(name)}
            >
              <Icon />
              {t(name)}
            </Button>
          ))}
        </div>
      ) : (
        sessionType == 1 && (
          <div className="px-4 mt-4 space-y-2">
            <Collapsible
              open={!isOpen}
              onOpenChange={toggleOpen}
              className="flex w-fill flex-col gap-2"
            >
              <CollapsibleTrigger asChild>
                <Button variant="default" className="w-full">
                  <SquareCode />
                  <span className="w-full font-semibold text-start">Session</span>
                  <ChevronDown />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col">
                {steps.map(renderSteps)}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )
      )}
      {!check && showRemedies && (
        <Collapsible open={isOpen} onOpenChange={toggleOpen} className="px-4 mt-4">
          <CollapsibleTrigger asChild>
            <Button variant="default" className="w-full">
              <PillIcon />
              <p className="w-full font-semibold text-start">Remedies</p>
              <ChevronDown />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-2 mt-4">
            <div
              className="flex flex-col gap-1 overflow-y-scroll no-scrollbar"
              ref={remediesContainerRef}
            >
              {selectedRemedies.map((r, index) => (
                <Button
                  key={index}
                  onClick={() => resetAndSelectSlot(index, false)}
                  className={clsx(index >= 8 && 'bg-[#A3B8B5]', 'relative')}
                >
                  <span className="truncate">{r?.name}</span>
                  {/* <X className="absolute right-2" /> */}
                </Button>
              ))}
            </div>
            {/* <Button variant="destructive" onClick={() => deleteAll()}>
              Delete All
            </Button> */}
          </CollapsibleContent>
        </Collapsible>
      )}
      {!check && sessionType == 3 && (
        <Collapsible open={isOpen2} onOpenChange={toggleOpen2} className="px-4 mt-4">
          <CollapsibleTrigger asChild>
            <Button variant="default" className="w-full">
              <PillIcon />
              <p className="w-full font-semibold text-start">Footplate Remedies</p>
              <ChevronDown />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-2 mt-4">
            <div className="flex flex-col gap-1 overflow-y-scroll no-scrollbar">
              {footplateRemedies.map((r, index) => (
                <Button
                  key={index}
                  onClick={() => resetAndSelectSlot(index, true)}
                  className={clsx(index >= 8 && 'bg-[#A3B8B5]', 'relative')}
                >
                  <span className="truncate">{r?.name}</span>
                </Button>
              ))}
            </div>
            {/* <Button variant="destructive" onClick={() => deleteAll(true)}>
              Delete All
            </Button> */}
          </CollapsibleContent>
        </Collapsible>
      )}
      {check && (
        <div className="mt-auto p-4">
          <Button variant="destructive" className="w-full" onClick={onLogout}>
            <LogOut />
            {t('logout')}
          </Button>
        </div>
      )}
    </aside>
  )
}
