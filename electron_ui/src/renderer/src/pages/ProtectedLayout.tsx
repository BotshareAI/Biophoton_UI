import { useAuthStore } from '@renderer/store/authStore'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { HomePage } from './HomePage'

export function ProtectedLayout(): React.JSX.Element | null {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login', replace: true })
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) return null

  return <HomePage onLogout={() => useAuthStore.getState().logout()} />
}
