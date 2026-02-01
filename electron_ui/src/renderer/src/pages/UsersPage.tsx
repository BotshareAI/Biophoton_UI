import { useState, useRef, useLayoutEffect } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { UserCard } from '@renderer/components/users/UserCard'
import { ArrowUpDown, BedSingle, Search, Star, UserRoundX, X } from 'lucide-react'
import { User } from '@shared/types/user'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@renderer/components/ui/drawer'
import Keyboard from '@renderer/components/keyboard'
import clsx from 'clsx'

interface UsersPageProps {
  users: User[]
  onClickAction: (screen: string, userId: number) => void
  goToSession: (type: number, userId?: number) => void
}

export function UsersPage({
  users,
  onClickAction,
  goToSession
}: UsersPageProps): React.JSX.Element {
  // const [query, setQuery] = useState('')
  const [userId, setUserId] = useState<number>()
  const [open, setOpen] = useState(false)
  const [keyboard, setOpenKeyboard] = useState(false)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  // const parentRef = useRef<HTMLDivElement>(null)
  // const [divEl, setDivEl] = useState<HTMLDivElement | null>(null)

  // useEffect(() => {
  //   if (parentRef.current) {
  //     setDivEl(parentRef.current)
  //   }
  // }, [])

  useLayoutEffect(() => {
    document.addEventListener('focusin', (e) => e.stopImmediatePropagation())
    document.addEventListener('focusout', (e) => e.stopImmediatePropagation())
  }, [])

  // useEffect(() => {
  //   // Force focus on input whenever the drawer is open and keyboard is active
  //   if (open && keyboard) {
  //     requestAnimationFrame(() => {
  //       inputRef.current?.focus()
  //     })
  //   }
  // }, [open, keyboard])

  const filtered = users.filter((user) =>
    `${user.firstName.toLowerCase()} ${user.lastName.toLowerCase()}`.includes(input)
  )

  const onClickUser = (id: number): void => {
    setUserId(id)
    setOpenKeyboard(false)
    setOpen(true)
  }

  const onClickSkip = (): void => {
    setUserId(undefined)
    setOpenKeyboard(false)
    setOpen(true)
  }

  const onOpenChange = (open: boolean): void => {
    if (!open) setUserId(undefined)
    setOpen(open)
  }

  const openKeyboard = (): void => {
    if (!open) {
      setOpen(true)
    }
    if (!keyboard) {
      setOpenKeyboard(true)
    }
    inputRef.current?.focus()
  }

  const closeKeyboard = (): void => {
    setOpen(false)
  }

  const handleInput: React.Dispatch<React.SetStateAction<string>> = (value) => {
    setInput(value)
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-8">
      <p className="text-lg font-semibold mb-4">Start a session</p>
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-2">
        <div className="w-full sm:w-[49%] relative">
          <Input
            ref={inputRef}
            placeholder="Search client"
            value={input}
            // onChange={(e) => setQuery(e.target.value)}
            className="pl-9 w-full"
            onClick={openKeyboard}
          />
          <Search className="absolute left-0 top-0 m-2.5 h-4 w-4 text-gray-500" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={onClickSkip} className="w-full sm:w-auto">
            <UserRoundX className="mr-2 h-4 w-4" />
            Skip Client
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((user) => (
          <UserCard
            key={user.id}
            userId={userId}
            user={user}
            onClickAction={onClickAction}
            onClick={onClickUser}
          />
        ))}
      </div>
      <Drawer open={open} onOpenChange={onOpenChange} modal={false}>
        <DrawerContent className={clsx(keyboard && 'px-4 pt-1 pb-3', 'bg-[#e3e7e6]')}>
          {keyboard ? (
            <Keyboard setInput={handleInput} onClose={closeKeyboard} />
          ) : (
            <>
              <DrawerHeader className="relative">
                <DrawerTitle className="leading-8">Choose session type</DrawerTitle>
                <DrawerClose className="absolute right-1">
                  <X />
                </DrawerClose>
              </DrawerHeader>
              <DrawerFooter className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-6 py-2 px-4 sm:py-4">
                <Button
                  // variant="outline"
                  className="w-full sm:w-[160px]"
                  onClick={(e) => {
                    e.stopPropagation()
                    goToSession(1, userId)
                  }}
                >
                  <Star />
                  Session
                </Button>
                <Button
                  // variant="outline"
                  className="w-full sm:w-[160px]"
                  onClick={(e) => {
                    e.stopPropagation()
                    goToSession(2, userId)
                  }}
                >
                  <ArrowUpDown />
                  Inversion
                </Button>
                <Button
                  // variant="outline"
                  className="w-full sm:w-[160px]"
                  onClick={(e) => {
                    e.stopPropagation()
                    goToSession(3, userId)
                  }}
                >
                  <BedSingle />
                  Light Lounge
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}
