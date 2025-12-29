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

export function RemediesDialog({
  open,
  setOpen,
  type,
  onScan,
  onCancel,
  onSet,
  onCancelSet
}: {
  open: boolean
  setOpen: (open: boolean) => void
  type: string
  onScan: () => void
  onCancel: () => void
  onSet: () => void
  onCancelSet: () => void
}): React.JSX.Element {
  const renderDialogContent = (): React.JSX.Element => {
    switch (type) {
      case 'error':
        return (
          <>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>You can add only 10 remedies.</DialogDescription>
          </>
        )
      case 'scan5':
        return (
          <>
            <DialogTitle>Scan Top 5</DialogTitle>
            <DialogDescription>
              Would you like to scan top 5 remedies in this category?
            </DialogDescription>
          </>
        )
      default:
        return (
          <>
            <DialogTitle>Set Remedy</DialogTitle>
            <DialogDescription>
              Would you like to set this remedy in the main list?
            </DialogDescription>
          </>
        )
    }
  }
  const renderFooter = (): React.JSX.Element => {
    switch (type) {
      case 'error':
        return (
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        )
      case 'scan5':
        return (
          <>
            <Button variant="outline" onClick={onScan}>
              Scan
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </>
        )
      default:
        return (
          <>
            <Button variant="outline" onClick={onSet}>
              Set
            </Button>
            <Button variant="outline" onClick={onCancelSet}>
              Cancel
            </Button>
          </>
        )
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="[&>button]:hidden bg-white">
        <DialogHeader>{renderDialogContent()}</DialogHeader>
        <DialogFooter>{renderFooter()}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
