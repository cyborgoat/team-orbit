import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DEFAULT_AVATAR_URL } from '@/lib/avatar'

export function UserAvatar({
  name,
  avatarUrl,
  size = 'default',
  className,
}: {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'default' | 'lg'
  className?: string
}) {
  const [failed, setFailed] = useState<string | null>(null)
  const primary = avatarUrl || DEFAULT_AVATAR_URL
  const src = failed === primary ? DEFAULT_AVATAR_URL : primary
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <Avatar size={size} className={className}>
      <AvatarImage
        src={src}
        alt={`${name}'s avatar`}
        onLoadingStatusChange={(status) => {
          if (status === 'error' && src !== DEFAULT_AVATAR_URL)
            setFailed(primary)
        }}
      />
      <AvatarFallback>{initials || '?'}</AvatarFallback>
    </Avatar>
  )
}
