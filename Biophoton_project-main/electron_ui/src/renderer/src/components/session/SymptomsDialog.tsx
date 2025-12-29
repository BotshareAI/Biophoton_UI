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
import { Textarea } from '../ui/textarea'
import { useSessionStore } from '@renderer/store/sessionStore'
import { useState } from 'react'

export function SymptomsDialog({
  open,
  setOpen
}: {
  open: boolean
  setOpen: (open: boolean) => void
}): React.JSX.Element {
  const symptoms = useSessionStore((state) => state.symptoms)
  const setSymptoms = useSessionStore((state) => state.setSymptoms)
  const [value, onChange] = useState(symptoms)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="[&>button]:hidden bg-white">
        <DialogHeader>{<DialogTitle>Symptoms</DialogTitle>}</DialogHeader>
        <DialogDescription>
          <Textarea value={value} onChange={(e) => onChange(e.target.value)} />
        </DialogDescription>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button
            onClick={() => {
              setSymptoms(value)
              setOpen(false)
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
