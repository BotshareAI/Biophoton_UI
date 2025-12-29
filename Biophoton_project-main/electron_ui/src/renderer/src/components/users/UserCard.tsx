import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardTitle } from '@renderer/components/ui/card'
import { MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { User } from '@shared/types/user'
import { Avatar } from './Avatar'
import clsx from 'clsx'
import { useUserStore } from '@renderer/store/userStore'
import { useSessionStore } from '@renderer/store/sessionStore'
import { calculateAgeFromISO } from '@renderer/utils/check-adult'

interface UserCardProps {
  user: User
  onClick: (userId: number) => void
  onClickAction: (screen: string, userId: number) => void
  userId?: number
}

export function UserCard({
  user,
  onClick,
  onClickAction,
  userId
}: UserCardProps): React.JSX.Element {
  const deleteUser = useUserStore((s) => s.deleteUser)
  const setUser = useSessionStore((s) => s.setUser)
  const onClickDetails = (): void => {
    onClickAction('details', user.id)
  }
  const onClickEdit = (): void => {
    onClickAction('edit', user.id)
  }
  const onClickSessions = (): void => {
    setUser(user)
    onClickAction('sessions', user.id)
  }
  const onClickDelete = (e): void => {
    e.stopPropagation()
    deleteUser(user.id)
  }
  const renderText = (days?: number): React.JSX.Element => {
    if (!days || days <= 0) return <div />
    return (
      <p className="text-sm text-primary mt-2">{`${user.daysSinceLastSession} day${days > 1 ? 's' : ''} since last session`}</p>
    )
  }
  return (
    <Card
      className={clsx(
        'relative border transition-colors pb-5',
        userId == user.id && 'border-primary'
      )}
      onClick={() => onClick(user.id)}
    >
      <CardContent className="flex gap-4">
        <div>
          <div className="rounded-full overflow-hidden bg-muted size-16">
            <Avatar src={user.photoFile ? `avatar:///${user.photoFile}` : undefined} />
          </div>
        </div>
        <div className="flex w-full justify-between items-start">
          <div className="flex flex-col gap-1">
            <CardTitle>{`${user.firstName} ${user.lastName}`}</CardTitle>
            {user.dateOfBirth && (
              <p className="text-sm text-muted-foreground">{`${calculateAgeFromISO(user.dateOfBirth)} years`}</p>
            )}
            {/* {user.reason && <p className="text-sm text-muted-foreground">{user.reason}</p>} */}
            {renderText(user.daysSinceLastSession)}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="absolute right-3 top-4" asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onClickEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={onClickDetails}>Details</DropdownMenuItem>
              <DropdownMenuItem onClick={onClickSessions}>Sessions</DropdownMenuItem>
              <DropdownMenuItem className="text-red-500" onClick={onClickDelete}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
