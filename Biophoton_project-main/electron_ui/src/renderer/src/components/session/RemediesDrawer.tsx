import { useEffect, useState } from 'react'
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from '../ui/drawer'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Remedy } from '@shared/types/remedy'
import { Button } from '../ui/button'

export const RemediesDrawer = ({
  remedies,
  openDrawer,
  setOpenDrawer
}: {
  remedies: Remedy[]
  openDrawer: boolean
  setOpenDrawer: (open: boolean) => void
}): React.JSX.Element => {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (remedies.length > 0) {
      setIndex(remedies.length - 1)
    }
  }, [remedies])
  const goPrev = (): void => {
    setIndex(index - 1)
  }
  const goNext = (): void => {
    setIndex(index + 1)
  }
  const remediesLen = remedies.length
  return (
    <Drawer open={openDrawer} onOpenChange={setOpenDrawer} modal={false}>
      {remediesLen > 0 && (
        <DrawerContent className="bg-[#e3e7e6] pb-4 px-4">
          <DrawerHeader className="relative flex flex-row items-center justify-center gap-4">
            <Button variant="ghost" onClick={goPrev} disabled={index === 0}>
              <ChevronLeft />
            </Button>
            <DrawerTitle>{remedies[index]?.name}</DrawerTitle>
            <Button variant="ghost" onClick={goNext} disabled={index === remediesLen - 1}>
              <ChevronRight />
            </Button>
            <DrawerClose className="absolute top-1 right-1">
              <X />
            </DrawerClose>
          </DrawerHeader>
          <p className="text-gray-800 text-sm mb-4">{`${remedies[index]?.category}  |  ${remedies[index]?.subcategory}  | ${remedies[index]?.meridians?.join(', ')}  | ${remedies[index]?.components}`}</p>
          <p>{remedies[index]?.description}</p>
        </DrawerContent>
      )}
    </Drawer>
  )
}
