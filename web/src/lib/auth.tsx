import { queryKeys } from '@/lib/query-keys'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, orbit, type User } from '@/lib/api'
import { getToken, setToken } from '@/lib/session'

type AuthContextValue = {
  user: User | null
  token: string | null
  loading: boolean
  login: (
    identifier: string,
    password: string,
    method?: 'username' | 'email',
  ) => Promise<void>
  register: (payload: {
    username: string
    fullName: string
    email?: string
    password: string
  }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient()
  const [token, setTokenState] = useState<string | null>(getToken())
  const profile = useQuery({
    queryKey: queryKeys.profile(token),
    queryFn: ({ signal }) => orbit.auth.me({ signal }),
    enabled: !!token,
    refetchInterval: 30_000,
    refetchOnWindowFocus: 'always',
    retry: false,
  })
  const user = token ? (profile.data ?? null) : null
  const loading = !!token && profile.isPending
  const setUser = useCallback(
    (next: User | null) => {
      qc.setQueryData(queryKeys.profile(token), next)
    },
    [qc, token],
  )
  const { refetch } = profile

  useEffect(() => {
    if (profile.error instanceof ApiError && profile.error.status === 401) {
      setToken(null)
      // Synchronize the local session with an authentication failure from the API.
      // oxlint-disable-next-line react/set-state-in-effect
      setTokenState(null)
      qc.clear()
    }
  }, [profile.error, qc])

  useEffect(() => {
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERUSER') {
      void qc.cancelQueries({ queryKey: queryKeys.users })
      qc.removeQueries({ queryKey: queryKeys.users })
    }
  }, [user?.role, qc])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      setUser,
      async refreshUser() {
        const result = await refetch()
        if (result.error) throw result.error
      },
      async login(identifier, password, method = 'username') {
        const res = await orbit.auth.login(identifier.trim(), password, method)
        qc.clear()
        orbit.setToken(undefined)
        setToken(res.accessToken)
        setTokenState(res.accessToken)
        qc.setQueryData(queryKeys.profile(res.accessToken), res.user)
      },
      async register(payload) {
        await orbit.auth.register(payload)
      },
      logout() {
        orbit.setToken(undefined)
        setToken(null)
        setTokenState(null)
        qc.clear()
      },
    }),
    [user, token, loading, qc, refetch, setUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
