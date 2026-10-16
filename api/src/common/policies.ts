import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
export type Actor = { id: string; role: Role };
export function isAdministrator(role: Role) {
  return role === Role.ADMIN || role === Role.SUPERUSER;
}
export function assertCanModerate(actor: Actor, authorId: string) {
  if (actor.id !== authorId && !isAdministrator(actor.role))
    throw new ForbiddenException('Not allowed to modify this content');
}
export function assertCanAssignRole(actorRole: Role, targetRole?: Role) {
  if (targetRole === Role.SUPERUSER && actorRole !== Role.SUPERUSER)
    throw new ForbiddenException('Only superuser can assign superuser role');
}
export function assertCanModifyUser(
  actor: Actor,
  existing: Actor,
  targetRole?: Role,
) {
  if (
    existing.role === Role.SUPERUSER &&
    actor.role !== Role.SUPERUSER &&
    actor.id !== existing.id
  )
    throw new ForbiddenException('Cannot modify superuser');
  assertCanAssignRole(actor.role, targetRole);
  if (
    actor.role === Role.ADMIN &&
    targetRole &&
    targetRole !== existing.role &&
    existing.role !== Role.USER
  )
    throw new ForbiddenException('Admins cannot change admin roles');
}
