import * as React from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
// Keep these shadcn imports if you use them; otherwise swap with your own
import { Button } from './button'
import { cn } from '@renderer/lib/utils'
import { StepId } from '@shared/types/step'

// ========================= Helpers & Types =========================
export type StepContent = React.ReactNode | (() => React.ReactNode) | null | undefined

/** Return a ReactNode from either a node or a render function. */
function asNode(c: StepContent): React.ReactNode {
  return typeof c === 'function' ? (c as () => React.ReactNode)() : (c ?? null)
}

/** Width of the progress bar based on the current step. */
function progressWidth(step: StepId): string {
  return step === 1 ? '50%' : '100%'
}

/** Prefer two children over renderStep1/2 when both exist. */
function chooseSteps(
  children: React.ReactNode,
  renderStep1?: StepContent,
  renderStep2?: StepContent
): [React.ReactNode, React.ReactNode] {
  const kids = React.Children.toArray(children).filter(Boolean)
  if (kids.length === 2) return [kids[0] as React.ReactNode, kids[1] as React.ReactNode]
  return [asNode(renderStep1 ?? null), asNode(renderStep2 ?? null)]
}

/** Business rule: can we navigate to a target step? */
function canGoToStep(target: StepId, canProceed: boolean, current: StepId): boolean {
  if (target === current) return true
  if (target === 1) return true // always allow going back to 1
  // Going to step 2 requires step 1 to be valid
  if (target === 2) return !!canProceed
  return false
}

/** Minimal fade-in helper using pure CSS transitions. */
function FadeIn({ dep, children }: { dep: unknown; children: React.ReactNode }): React.JSX.Element {
  const [show, setShow] = React.useState(false)
  React.useEffect(() => {
    setShow(false)
    const id = requestAnimationFrame(() => setShow(true))
    return () => cancelAnimationFrame(id)
  }, [dep])
  return (
    <div className={cn('transition-opacity duration-150', show ? 'opacity-100' : 'opacity-0')}>
      {children}
    </div>
  )
}

// ========================= Component =========================
export type StepperProps = {
  step: StepId
  onStepChange: (next: StepId) => void
  validate: () => boolean
  disableHeaderClick?: boolean
  labels?: { step1?: string; step2?: string }
  canProceedFromStep?: boolean
  renderStep1?: StepContent
  renderStep2?: StepContent
  className?: string
  children?: React.ReactNode // alternative to renderStep1/2
}

export default function Stepper(props: StepperProps): React.JSX.Element {
  const {
    step,
    onStepChange,
    validate,
    disableHeaderClick,
    labels = { step1: 'Step 1', step2: 'Step 2' },
    canProceedFromStep = false,
    renderStep1,
    renderStep2,
    className,
    children
  } = props

  const canNext = step === 1 ? true : canProceedFromStep

  const goPrev = (): void => onStepChange(1)
  const goNext = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault()
    if (step === 1) {
      const isValid = validate()
      isValid && onStepChange(2)
    }
  }

  const [step1Node, step2Node] = chooseSteps(children, renderStep1, renderStep2)

  const handleHeaderSelect = (s: StepId): void => {
    if (disableHeaderClick) return
    if (!canGoToStep(s, canProceedFromStep, step)) return // enforce: Step 2 blocked until Step 1 valid
    onStepChange(s)
  }

  return (
    <div
      className={cn(
        'w-full max-w-[1000px] mx-auto rounded-2xl border bg-background shadow-sm p-4 md:p-6',
        className
      )}
      aria-label="Two step form"
    >
      <StepperHeader
        step={step}
        labels={labels}
        onSelectStep={handleHeaderSelect}
        canProceedFromStep={canProceedFromStep}
      />

      <div className="mt-4 md:mt-6">
        {/* Minimal CSS fade for step change; no JS animation loop beyond class toggle */}
        <FadeIn dep={step}>
          <div role="region" aria-labelledby={step === 1 ? 'step-1-title' : 'step-2-title'}>
            {step === 1 ? (
              <>
                <h2 id="step-1-title" className="sr-only">
                  {labels.step1 || 'Step 1'}
                </h2>
                {step1Node}
              </>
            ) : (
              <>
                <h2 id="step-2-title" className="sr-only">
                  {labels.step2 || 'Step 2'}
                </h2>
                {step2Node}
              </>
            )}
          </div>
        </FadeIn>
      </div>

      <FooterControls step={step} canNext={canNext} onPrev={goPrev} onNext={goNext} />
    </div>
  )
}

function StepperHeader({
  step,
  labels,
  onSelectStep,
  canProceedFromStep
}: {
  step: StepId
  labels: { step1?: string; step2?: string }
  onSelectStep: (s: StepId) => void
  canProceedFromStep: boolean
}): React.JSX.Element {
  const step2Disabled = !canGoToStep(2, canProceedFromStep, step)
  return (
    <div className="select-none">
      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 w-full rounded-full bg-muted" />
        <div
          className="absolute top-0 left-0 h-2 rounded-full bg-primary transition-[width] duration-150"
          style={{ width: progressWidth(step) }}
        />
      </div>

      {/* Bullets */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <HeaderBullet
          idx={1}
          active={step === 1}
          complete={step === 2}
          label={labels.step1 || 'Step 1'}
          onClick={() => onSelectStep(1)}
        />
        <HeaderBullet
          idx={2}
          active={step === 2}
          complete={false}
          label={labels.step2 || 'Step 2'}
          onClick={() => onSelectStep(2)}
          disabled={step2Disabled}
        />
      </div>
    </div>
  )
}

function HeaderBullet({
  idx,
  active,
  complete,
  label,
  onClick,
  disabled
}: {
  idx: 1 | 2
  active: boolean
  complete: boolean
  label: string
  onClick: () => void
  disabled?: boolean
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-3 rounded-xl p-2 md:p-3 transition-[background,transform,opacity] duration-150',
        'touch-manipulation',
        disabled ? 'opacity-50 cursor-not-allowed' : active ? 'bg-primary/5' : 'hover:bg-muted'
      )}
      aria-current={active ? 'step' : undefined}
      aria-disabled={disabled ? true : undefined}
      aria-label={`${label}${complete ? ' (completed)' : active ? ' (current)' : disabled ? ' (disabled)' : ''}`}
    >
      <div
        className={cn(
          'grid size-11 place-items-center rounded-full border-2 transition-[transform,opacity,background] duration-150',
          'text-base md:text-lg font-semibold',
          active
            ? 'border-primary bg-primary text-primary-foreground'
            : complete
              ? 'border-primary bg-primary/90 text-primary-foreground'
              : 'border-muted-foreground/30 bg-background text-foreground'
        )}
      >
        {complete && idx === 1 ? <Check className="size-5" aria-hidden="true" /> : idx}
      </div>
      <div className="text-left">
        <div className={cn('text-sm md:text-base leading-tight', active && 'font-medium')}>
          {label}
        </div>
        <div className="text-[12px] md:text-sm text-muted-foreground">
          {disabled
            ? 'Locked'
            : active
              ? 'Currently editing'
              : complete
                ? 'Completed'
                : 'Not started'}
        </div>
      </div>
    </button>
  )
}

function FooterControls({
  step,
  canNext,
  onPrev,
  onNext
}: {
  step: StepId
  canNext: boolean
  onPrev: () => void
  onNext: (e: React.MouseEvent<HTMLButtonElement>) => void
}): React.JSX.Element {
  return (
    <div className="mt-6 md:mt-8 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="text-sm text-muted-foreground">
        {step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
      </div>
      <div className="flex gap-4 sm:gap-6 w-full sm:w-auto">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1 sm:flex-none min-h-12 min-w-[7rem] px-4 md:px-5 touch-manipulation"
          onClick={onPrev}
          disabled={step === 1}
        >
          <ChevronLeft className="mr-2 size-5" /> Back
        </Button>
        <Button
          type={step === 2 ? 'submit' : 'button'}
          size="lg"
          className="flex-1 sm:flex-none min-h-12 min-w-[7rem] px-4 md:px-5 touch-manipulation"
          onClick={step === 1 ? onNext : undefined}
          disabled={step === 2 ? !canNext : false}
        >
          {step === 1 ? (
            <>
              Continue <ChevronRight className="ml-2 size-5" />
            </>
          ) : (
            <>Save</>
          )}
        </Button>
      </div>
    </div>
  )
}
