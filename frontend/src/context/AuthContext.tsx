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

  async function login(email: string, password: string) {
    setUser(await authApi.login({ email, password }))
  }

  async function register(data: RegisterData) {
    setUser(await authApi.register(data))
  }

  async function logout() {
    await authApi.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
