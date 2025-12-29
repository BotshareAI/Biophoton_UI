import { Sidebar } from '@renderer/components/layout/Sidebar'
// import { AppBar } from '@renderer/components/layout/AppBar'
import { Outlet, useRouter, useRouterState } from '@tanstack/react-router'
import { useMemo } from 'react'
// import { useTranslation } from 'react-i18next'

export function HomePage({ onLogout }: { onLogout: () => void }): React.JSX.Element {
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  // const { t } = useTranslation('common', { keyPrefix: 'sidebar' })

  const selected = useMemo(() => {
    if (pathname.startsWith('/users/add')) return 'new_client'
    if (/\/users\/\d+/.test(pathname)) return 'user_details'
    if (/\/users\/\d+\/edit/.test(pathname)) return 'user_edit'
    if (pathname.startsWith('/users')) return 'select_user'
    if (pathname.startsWith('/settings')) return 'settings'
    if (pathname.startsWith('/remedy')) return 'remedy'
    if (pathname.startsWith('/sessions')) return 'sessions'
    if (pathname.startsWith('/session/summary')) return 'session_summary'
    if (pathname.startsWith('/session')) return 'session'
    return ''
  }, [pathname])

  return (
    <div className="flex h-screen">
      <Sidebar
        selected={selected}
        onSelect={(page) => {
          if (page === 'select_user') router.navigate({ to: '/users' })
          else if (page === 'new_client') router.navigate({ to: '/users/add' })
          else if (page === 'remedy') router.navigate({ to: '/remedy' })
          else router.navigate({ to: '/settings' })
        }}
        onLogout={onLogout}
      />
      <div className="flex flex-col flex-1">
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
