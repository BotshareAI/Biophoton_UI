import { Button } from '@renderer/components/ui/button'
import { Session } from '@shared/types/session'
import { isoFormatDate } from '@renderer/utils/iso-format'
import { User } from '@shared/types/user'
import { MoveLeft } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'

type SessionsPageProps = {
  user: User
  sessions: Session[]
  onClick: (id: number) => void
}

export function SessionsPage({ sessions, onClick, user }: SessionsPageProps): React.JSX.Element {
  const router = useRouter()
  return (
    <div>
      <div className="flex flex-row gap-2 items-center">
        <Button variant="ghost" onClick={() => router.history.back()}>
          <MoveLeft />
        </Button>
        <p className="font-semibold">{`${user?.firstName} ${user?.lastName}'s sessions`}</p>
      </div>
      <div className="w-full grid grid-cols-2 gap-8 mt-4">
        {sessions.map((session, idx) => (
          <Button
            key={idx}
            variant="outline"
            onClick={() => onClick(session.id)}
            className="relative"
          >
            <span className="absolute left-4">{idx + 1}.</span>
            {isoFormatDate(session.dateTime)}
          </Button>
        ))}
      </div>
    </div>
  )
}
