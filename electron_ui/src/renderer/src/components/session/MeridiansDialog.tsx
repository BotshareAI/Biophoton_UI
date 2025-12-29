import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Button } from '../ui/button'
import { MultiSelect } from '../ui/multi-select'
import { useSessionStore } from '@renderer/store/sessionStore'
import { useState } from 'react'
import { useCategoriesStore } from '@renderer/store/categoriesStore'

export function MeridiansDialog({
  open,
  setOpen,
  onDone
}: {
  open: boolean
  setOpen: (open: boolean) => void
  onDone: (meridianNames: string[]) => void
}): React.JSX.Element {
  const [selectedMeridians, setSelectedMeridians] = useState<string[]>([])
  const setFocusedMeridians = useSessionStore((state) => state.setFocusedMeridians)
  const meridians = useCategoriesStore((s) => s.meridians)
  const onSave = (): void => {
    const meridianNames = meridians
      .filter((m) => selectedMeridians.includes(m.value))
      .map((m) => m.label)
    setFocusedMeridians(selectedMeridians, meridianNames)
    onDone(meridianNames)
    setOpen(false)
  }
  const skip = (): void => {
    onDone([])
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="[&>button]:hidden bg-white">
        <DialogHeader>{<DialogTitle>Select Meridians</DialogTitle>}</DialogHeader>
        <DialogDescription>
          <p className="mb-2">Select which meridians you were treating</p>
          <MultiSelect
            options={meridians}
            onValueChange={setSelectedMeridians}
            defaultValue={[]}
            placeholder="Select meridians"
            maxCount={4}
            hideSelectAll={true}
            searchable={false}
          />
          <p className="pt-2">* You can select up to 4 meridians</p>
        </DialogDescription>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={skip} variant="outline">
              Skip
            </Button>
          </DialogClose>
          <Button onClick={onSave}>Save and Proceed</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
