/* eslint-disable react-hooks/rules-of-hooks */
import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useLoaderData
} from '@tanstack/react-router'

import { LoginPage } from '@renderer/pages/LoginPage'
import { UsersPage } from '@renderer/pages/UsersPage'
import { UserPage } from '@renderer/pages/UserPage'
import { useUserStore } from '@renderer/store/userStore'
import { ProtectedLayout } from './pages/ProtectedLayout'
import { useParams } from '@tanstack/react-router'
import { SettingsPage } from '@renderer/pages/SettingsPage'
import { AddRemedyPage } from './pages/AddRemedy'
import { SessionSummary } from './pages/SessionSummary'
import { SessionsPage } from './pages/SessionsPage'
import { SessionPage } from './pages/SessionPage'
import { useSessionStore } from './store/sessionStore'
import { useRemediesStore } from './store/remediesStore'
import { checkAdult } from './utils/check-adult'
import { useCategoriesStore } from './store/categoriesStore'
import { useProgramsStore } from './store/programsStore'

const rootRoute = createRootRoute({
  component: () => <Outlet />
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage
})

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: ProtectedLayout
})

const usersRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/users',
  loader: async () => {
    await useUserStore.getState().fetchUsers('')
    const data = await window.api.getStaticData()
    useCategoriesStore.setState({
      loading: false,
      categories: data.categories,
      subcategories: data.subcategories,
      meridians: data.meridians.map((m) => ({ value: m.id.toString(), label: m.name }))
    })
    useProgramsStore.setState({
      loading: false,
      programs: data.programs,
      steps: data.steps
    })
    return null
  },
  component: () => {
    const users = useUserStore((s) => s.users)
    const startSession = useSessionStore((s) => s.startSession)
    const resetAll = useRemediesStore((s) => s.resetAll)
    const onClickAction = (screen: string, id: number): void => {
      if (screen == 'edit') router.navigate({ to: `/users/${id}/edit` })
      else if (screen == 'details') router.navigate({ to: `/users/${id}` })
      else router.navigate({ to: `/sessions/${id}` })
    }
    return (
      <UsersPage
        users={users}
        onClickAction={onClickAction}
        goToSession={(type, id) => {
          if (id) {
            const user = users.filter((u) => u.id === id)[0]
            startSession(type, checkAdult(user.dateOfBirth), user)
          } else {
            startSession(type, true, undefined)
          }
          resetAll()
          router.navigate({ to: '/session/$type', params: { type } })
        }}
      />
    )
  }
})

const addUserRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/users/add',
  component: () => {
    const addUser = useUserStore((s) => s.addUser)
    return (
      <UserPage
        mode="create"
        onCancel={() => router.navigate({ to: '/users' })}
        onSubmit={(newUser) => {
          addUser(newUser)
          router.navigate({ to: '/users' })
        }}
      />
    )
  }
})

const editUserRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/users/$userId/edit',
  component: () => {
    const { userId } = useParams({ from: '/users/$userId/edit' })
    const user = useUserStore((s) => s.users.find((u) => u.id === +userId))
    const updateUser = useUserStore((s) => s.updateUser)

    return user ? (
      <UserPage
        mode="edit"
        user={user}
        onCancel={() => router.navigate({ to: '/users' })}
        onSubmit={(updated) => {
          updateUser(user.id, updated)
          router.navigate({ to: '/users' })
        }}
      />
    ) : (
      <div>User not found</div>
    )
  }
})

const userDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/users/$userId',
  component: () => {
    const { userId } = useParams({ from: '/users/$userId' })
    const user = useUserStore((s) => s.users.find((u) => u.id === +userId))
    return user ? <UserPage mode="view" user={user} /> : <div>User not found</div>
  }
})

const settingsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/settings',
  loader: async () => {
    await useRemediesStore.getState().fetchRemedies()
    const settings = await window.api.getAll()
    return settings
  },
  component: () => {
    const settings = useLoaderData({ from: settingsRoute.id })
    return <SettingsPage defaultSettings={settings} />
  }
})

const sessionRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/session/$type',
  loader: async () => {
    await useRemediesStore.getState().fetchRemedies()
    return null
  },
  component: () => {
    const { type } = useParams({ from: '/session/$type' })
    return (
      <SessionPage type={type} endSession={() => router.navigate({ to: '/session/summary' })} />
    )
  }
})

const sessionsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/sessions/$id',
  loader: async ({ params }) => {
    const sessions = await window.api.getSessionsByClientId(parseInt(params.id))
    return sessions
  },
  component: () => {
    const sessions = useLoaderData({ from: sessionsRoute.id })
    const { id } = useParams({ from: '/sessions/$id' })
    const user = useUserStore((s) => s.users.find((u) => u.id === +id))
    return user ? (
      <SessionsPage
        user={user}
        sessions={sessions || []}
        onClick={(id) => router.navigate({ to: '/session/summary/$id', params: { id } })}
      />
    ) : (
      <div>User not found</div>
    )
  }
})

const endSessionRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/session/summary',
  component: () => {
    const user = useSessionStore((s) => s.user)
    const savedPrograms = useSessionStore((s) => s.savedPrograms)
    const meridians = useSessionStore((s) => s.focusedMeridians)
    const meridianNames = useSessionStore((s) => s.meridianNames)
    const symptoms = useSessionStore((s) => s.symptoms)
    const isAdult = useSessionStore((s) => s.isAdultSession)
    const type = useSessionStore((s) => s.type)
    const droppingPoints = useSessionStore((s) => s.droppingPoints)
    const droppingAfterPoints = useSessionStore((s) => s.droppingAfterPoints)
    return (
      <SessionSummary
        programs={savedPrograms}
        user={user}
        meridians={meridianNames}
        symptoms={symptoms}
        onSave={async (recommendation) => {
          await window.api.createSession({
            programs: savedPrograms,
            userId: user?.id,
            meridians,
            recommendation,
            symptoms,
            isAdult,
            type,
            droppingPoints,
            droppingAfterPoints
          })
          router.navigate({ to: '/users' })
        }}
        isAdult={isAdult}
        droppingPoints={droppingPoints}
        droppingAfterPoints={droppingAfterPoints}
      />
    )
  }
})

const sessionSummaryRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/session/summary/$id',
  loader: async ({ params }) => {
    const session = await window.api.getSessionsById(parseInt(params.id))
    return session
  },
  component: () => {
    const session = useLoaderData({ from: sessionSummaryRoute.id })
    return (
      <SessionSummary
        programs={session.programs}
        meridians={session.meridians}
        user={session.user}
        recommendation={session.recommendation}
        dateTime={session.dateTime}
        symptoms={session.symptoms}
        isAdult={session.isAdult}
        droppingPoints={session.droppingPoints}
        droppingAfterPoints={session.droppingAfterPoints}
      />
    )
  }
})

const addRemedyRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/remedy',
  component: () => {
    return <AddRemedyPage />
  }
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedRoute.addChildren([
    usersRoute,
    addUserRoute,
    editUserRoute,
    userDetailRoute,
    settingsRoute,
    endSessionRoute,
    addRemedyRoute,
    sessionsRoute,
    sessionRoute,
    sessionSummaryRoute
  ])
])

export const router = createRouter({
  routeTree,
  history: createHashHistory()
})
