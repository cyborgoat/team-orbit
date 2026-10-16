import { queryKeys } from '@/lib/query-keys'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AvatarPicker } from '@/components/avatar-picker'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { isDefaultAvatar } from '@/lib/avatar'
import { useAuth } from '@/lib/auth'
import { orbit } from '@/lib/api'

export function AvatarSettingsDialog({
  member,
  onClose,
}: {
  member: { id: string; fullName: string; avatarUrl?: string | null }
  onClose: () => void
}) {
  const [avatar, setAvatar] = useState(
    isDefaultAvatar(member.avatarUrl) ? '' : (member.avatarUrl ?? ''),
  )
  const [uploading, setUploading] = useState(false)
  const { user, refreshUser } = useAuth()
  const qc = useQueryClient()
  const save = useMutation({
    mutationFn: () =>
      orbit.users.update(member.id, { avatarUrl: avatar || null }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.users })
      if (member.id === user?.id) await refreshUser()
      toast.success('Avatar updated')
      onClose()
    },
    onError: (error: Error) => toast.error(error.message),
  })
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault()
            if (!uploading && !save.isPending) save.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>Avatar for {member.fullName}</DialogTitle>
            <DialogDescription>
              Pick a bird portrait, upload an image, or use an image link.
            </DialogDescription>
          </DialogHeader>
          <AvatarPicker
            name={member.fullName}
            value={avatar}
            onChange={setAvatar}
            onUploadingChange={setUploading}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || save.isPending}>
              {save.isPending ? 'Saving…' : 'Save avatar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
