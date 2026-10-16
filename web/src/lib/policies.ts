import type { User } from '@goatcheese/team-orbit-client'
export const canManage = (user: Pick<User, 'role'> | null) =>
  user?.role === 'ADMIN' || user?.role === 'SUPERUSER'
export const canModerate = (
  user: Pick<User, 'id' | 'role'> | null,
  authorId: string,
) => !!user && (user.id === authorId || canManage(user))
