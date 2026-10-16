import {
  createFileRoute,
  Navigate,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { getToken } from '@/lib/session'
import { useAuth } from '@/lib/auth'
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/login' })
  },
  component: AuthenticatedLayout,
})
function AuthenticatedLayout() {
  const { user, loading } = useAuth()
  if (loading) return <p>Loading…</p>
  if (!user) return <Navigate to="/login" />
  return <Outlet />
}
