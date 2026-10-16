import { createFileRoute, redirect } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/image-upload'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { api, getToken, type User } from '@/lib/utils'

export const Route = createFileRoute('/settings')({
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/login' })
  },
  component: SettingsPage,
})

function SettingsPage() {
  const { user, setUser } = useAuth()
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    avatarUrl: '',
  })
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (!user) return
    setProfile({
      fullName: user.fullName,
      email: user.email ?? '',
      avatarUrl: user.avatarUrl ?? '',
    })
  }, [user])

  const saveProfile = useMutation({
    mutationFn: () =>
      api<User>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: profile.fullName,
          email: profile.email.trim() || null,
          avatarUrl: profile.avatarUrl || null,
        }),
      }),
    onSuccess: (next) => {
      setUser(next)
      toast.success('Profile updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const changePassword = useMutation({
    mutationFn: () =>
      api('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: password.currentPassword,
          newPassword: password.newPassword,
        }),
      }),
    onSuccess: () => {
      setPassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      toast.success('Password changed')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Update your profile and change your password."
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Username is fixed. Name, email, and avatar can be updated anytime.
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            saveProfile.mutate()
          }}
        >
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-username">Username</Label>
              <Input
                id="settings-username"
                value={user?.username ?? ''}
                disabled
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-fullname">Full name</Label>
              <Input
                id="settings-fullname"
                value={profile.fullName}
                onChange={(e) =>
                  setProfile({ ...profile, fullName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-email">Email (optional)</Label>
              <Input
                id="settings-email"
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Avatar</Label>
              <ImageUpload
                value={profile.avatarUrl}
                onChange={(url) => setProfile({ ...profile, avatarUrl: url })}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saveProfile.isPending}>
              {saveProfile.isPending ? 'Saving…' : 'Save profile'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            Enter your current password, then choose a new one (min 6 characters).
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (password.newPassword !== password.confirmPassword) {
              toast.error('New passwords do not match')
              return
            }
            changePassword.mutate()
          }}
        >
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-current-password">Current password</Label>
              <Input
                id="settings-current-password"
                type="password"
                autoComplete="current-password"
                value={password.currentPassword}
                onChange={(e) =>
                  setPassword({ ...password, currentPassword: e.target.value })
                }
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-new-password">New password</Label>
              <Input
                id="settings-new-password"
                type="password"
                autoComplete="new-password"
                value={password.newPassword}
                onChange={(e) =>
                  setPassword({ ...password, newPassword: e.target.value })
                }
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-confirm-password">Confirm new password</Label>
              <Input
                id="settings-confirm-password"
                type="password"
                autoComplete="new-password"
                value={password.confirmPassword}
                onChange={(e) =>
                  setPassword({ ...password, confirmPassword: e.target.value })
                }
                required
                minLength={6}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? 'Updating…' : 'Update password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
