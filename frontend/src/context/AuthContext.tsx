import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import * as authApi from '../api/auth'
import type { RegisterData } from '../api/auth'
import { ApiError } from '../api/client'
import type { User } from '../types/user'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    authApi
      .getMe()
      .then(setUser)
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 401)) {
          console.error(err)
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  const queryClient = useQueryClient()

  // Cached queries belong to whoever was signed in; never show them to the next account.
  function switchUser(next: User | null) {
    queryClient.clear()
    setUser(next)
  }

  async function login(email: string, password: string) {
    switchUser(await authApi.login({ email, password }))
  }

  async function register(data: RegisterData) {
    switchUser(await authApi.register(data))
  }

  async function startDemo() {
    switchUser(await authApi.startDemo())
  }

  async function logout() {
    await authApi.logout()
    switchUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, startDemo, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}
