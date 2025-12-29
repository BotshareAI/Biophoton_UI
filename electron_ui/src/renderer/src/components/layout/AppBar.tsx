import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from '@renderer/components/ui/breadcrumb'
import { House } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Clock } from '../ui/clock'
import { useSessionStore } from '@renderer/store/sessionStore'

interface AppBarProps {
  selected: string
  other?: string[]
}

export function AppBar({ selected, other }: AppBarProps): React.JSX.Element {
  const navigate = useNavigate()
  const user = useSessionStore((state) => state.user)
  const getLink = (): string => {
    if (selected == 'Sessions') {
      return `/sessions/${user?.id}`
    }
    return `/${selected.toLocaleLowerCase()}`
  }
  return (
    <header className="border-b p-4 flex justify-between items-center">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <p
                onClick={() => navigate({ to: '/users' })}
                className="flex gap-2 items-center cursor-pointer"
              >
                <House size={18} />
                Home
              </p>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {other !== undefined ? (
            <BreadcrumbLink asChild>
              <p
                onClick={() => navigate({ to: getLink() })}
                className="flex gap-2 items-center cursor-pointer"
              >
                {selected}
              </p>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbItem>{selected}</BreadcrumbItem>
          )}
          {other &&
            other.map((o) => (
              <div key={o} className="flex items-center gap-2">
                <BreadcrumbSeparator />
                <BreadcrumbItem>{o}</BreadcrumbItem>
              </div>
            ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="text-sm text-gray-500">
        <Clock />
      </div>
    </header>
  )
}
