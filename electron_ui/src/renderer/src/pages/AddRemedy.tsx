import { Remedy } from '@shared/types/remedy'
import { useRemediesStore } from '@renderer/store/remediesStore'
import { Button } from '@renderer/components/ui/button'
import { useCallback, useEffect, useState } from 'react'
import { ProgressBar } from '@renderer/components/session/ProgressBar'
import Stepper from '@renderer/components/ui/stepper'
import { RemedyFormContent } from '@renderer/components/remedies/RemedyFormContent'
import { useRemedyForm } from '@renderer/hooks/useRemedyForm'
import { StepId } from '@shared/types/step'
import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import { validateRemedy } from '@renderer/utils/validate-remedy'
import { Drawer, DrawerContent } from '@renderer/components/ui/drawer'
import Keyboard from '@renderer/components/keyboard'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import clsx from 'clsx'

enum Scan {
  INIT,
  STARTED,
  COMPLETED
}

export function AddRemedyPage(): React.JSX.Element {
  const [open, setOpen] = useState(true)
  const [scan, setScan] = useState(Scan.INIT)
  const [step, setStep] = useState<StepId>(1)
  const [focusedField, setFocusedField] = useState<null | string>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const addRemedy = useRemediesStore((s) => s.addRemedy)
  const onSubmit = async (remedy: Remedy, setError, onSuccess): Promise<void> => {
    if (!remedy.categoryId) {
      setError('categoryId', { type: 'required', message: 'Category is required' })
      return
    }
    if (!remedy.frequency) {
      alert('Please scan the remedy first!')
      return
    }
    await addRemedy(remedy)
    onSuccess()
    setStep(1)
    setSuccessMessage('Remedy saved successfully.')
  }
  const { handleSubmit, onHandleSubmit, form, categories, subcategories, meridians } =
    useRemedyForm({
      onSubmit
    })
  const onCompleteScan = (): void => {
    setScan(Scan.COMPLETED)
  }
  const validationCallback = (key, label): void =>
    form.setError(key, { type: 'required', message: `${label} is required` })
  const validate = (): boolean => {
    const remedy = form.getValues()
    form.clearErrors()
    return validateRemedy(remedy, validationCallback)
  }
  const setInput: React.Dispatch<React.SetStateAction<string>> = useCallback(
    (value) => {
      if (!focusedField) return
      if (typeof value === 'function') {
        const currentValue = form.getValues(focusedField as keyof Remedy) || ''
        form.setValue(focusedField as keyof Remedy, value(currentValue as string))
      } else {
        form.setValue(focusedField as keyof Remedy, value)
      }
    },
    [focusedField, form]
  )
  const handleFocus = useCallback(
    (fieldName: string) => () => {
      setFocusedField(fieldName)
      setOpen(true)
    },
    []
  )
  const onScan = async (): Promise<void> => {
    await window.api.mode4Start()
    setScan(Scan.STARTED)

    const off = window.api.onMode4Value(async ({ freqHz }) => {
      console.log('Final frequency:', freqHz)
      form.setValue('frequency', freqHz)
      off()
      // await window.api.measurementStop()
      try {
        await window.api.stop()
      } catch {
        /* empty */
      }
    })
  }

  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [successMessage])

  return (
    <form onSubmit={handleSubmit(onHandleSubmit)} className="flex flex-col w-full ">
      <p className="text-lg font-semibold mb-4">New Remedy</p>
      <Dialog open={!!successMessage} onOpenChange={(open) => !open && setSuccessMessage(null)}>
        <DialogContent showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>Saved</DialogTitle>
            <DialogDescription>{successMessage ?? ''}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setSuccessMessage(null)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Stepper
        labels={{ step1: 'Fill Remedy Data', step2: 'Scan Remedy' }}
        canProceedFromStep={scan == Scan.COMPLETED}
        validate={validate}
        step={step}
        onStepChange={setStep}
        className={clsx('flex flex-col flex-1 h-auto overflow-visible', open && 'mb-40')}
      >
        {/* Step 1 */}
        <div className="space-y-4 grid grid-cols-2 gap-4">
          <RemedyFormContent
            form={form}
            categories={categories}
            subcategories={subcategories}
            meridians={meridians}
            handleFocus={handleFocus}
            autoFocus
          />
          <div className="flex items-center gap-3 mt-2 col-span-2">
            <Switch id="invert" className="px-0" />
            <Label htmlFor="invert">Invert the information of the remedy</Label>
          </div>
        </div>
        {/* Step 2 */}
        <div className="space-y-4">
          {scan == Scan.COMPLETED ? (
            <p>Remedy is scanned</p>
          ) : scan == Scan.STARTED ? (
            <p>Remedy is scanning</p>
          ) : (
            <p>Place the remedy on the glass plate and click on Scan</p>
          )}
          {scan == Scan.INIT && (
            <Button type="button" onClick={onScan}>
              Scan
            </Button>
          )}
          {scan == Scan.COMPLETED && (
            <Button type="button" onClick={onScan}>
              Rescan
            </Button>
          )}
          {scan == Scan.STARTED && (
            <ProgressBar totalTime={3} started={true} onComplete={onCompleteScan} />
          )}
        </div>
      </Stepper>
      <Drawer open={open} dismissible={false} modal={false}>
        <DrawerContent className="px-4 pt-1 pb-3 bg-[#e3e7e6]">
          <Keyboard setInput={setInput} onClose={() => setOpen(false)} />
        </DrawerContent>
      </Drawer>
    </form>
  )
}
