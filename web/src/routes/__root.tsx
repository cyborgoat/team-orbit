import { AuthProvider } from '@/lib/auth'
import { AppShell } from '@/components/app-shell'
import { createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  ),
})
