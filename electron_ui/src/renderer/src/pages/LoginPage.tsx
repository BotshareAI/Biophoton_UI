import { useForm } from 'react-hook-form'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { useAuthStore } from '@renderer/store/authStore'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { Drawer, DrawerContent } from '@renderer/components/ui/drawer'
import Keyboard from '@renderer/components/keyboard'

type LoginFormValues = {
  username: string
  password: string
}

export function LoginPage(): React.JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue
  } = useForm<LoginFormValues>()
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState<null | string>(null)

  const onSubmit = (data: LoginFormValues): void => {
    const success = login(data.username, data.password)
    if (success) navigate({ to: '/users' })
    else setError('Invalid credentials')
  }

  const handleFocus = useCallback((fieldName: string) => () => setFocusedField(fieldName), [])

  const setInput: React.Dispatch<React.SetStateAction<string>> = useCallback(
    (value) => {
      if (!focusedField) return
      if (typeof value === 'function') {
        const currentValue = getValues(focusedField as keyof LoginFormValues) || ''
        setValue(focusedField as keyof LoginFormValues, value(currentValue as string))
      } else {
        setValue(focusedField as keyof LoginFormValues, value)
      }
    },
    [focusedField, getValues, setValue]
  )

  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                placeholder="Username"
                {...register('username', { required: 'Username is required' })}
                onFocus={handleFocus('username')}
                autoFocus
              />
              {errors.username && (
                <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <Input
                type="password"
                placeholder="Password"
                {...register('password', { required: 'Password is required' })}
                onFocus={handleFocus('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <Button type="submit" variant="default" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
      <Drawer open={true} dismissible={false} modal={false}>
        <DrawerContent className="px-4 pt-1 pb-3 bg-[#e3e7e6] w-full left-0">
          <Keyboard setInput={setInput} />
        </DrawerContent>
      </Drawer>
    </div>
  )
}
