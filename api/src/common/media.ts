import { Transform } from 'class-transformer';
import { registerDecorator } from 'class-validator';
import { DEFAULT_AVATAR_PATH } from '../avatars/presets';

export function mediaPath(value: string): string {
  if (value.startsWith('/uploads/') || value.startsWith('/avatars/'))
    return value;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return value;
  }
  return url.origin === new URL(process.env.PUBLIC_BASE_URL!).origin &&
    (url.pathname.startsWith('/uploads/') ||
      url.pathname.startsWith('/avatars/'))
    ? url.pathname
    : value;
}
export function mediaUrl(value: string): string {
  return value.startsWith('/')
    ? new URL(value, process.env.PUBLIC_BASE_URL).href
    : value;
}
export function MediaInput(): PropertyDecorator {
  return (target, propertyKey) => {
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string'
        ? value.trim()
          ? mediaPath(value.trim())
          : null
        : value,
    )(target, propertyKey);
    registerDecorator({
      name: 'mediaInput',
      target: target.constructor,
      propertyName: String(propertyKey),
      validator: {
        validate(value: unknown) {
          if (value === null || value === undefined) return true;
          if (typeof value !== 'string') return false;
          if (
            /^\/(uploads|avatars)\/[^\s?#]+$/.test(value) &&
            !value.includes('..')
          )
            return true;
          try {
            const url = new URL(value);
            return (
              ['http:', 'https:'].includes(url.protocol) &&
              !url.username &&
              !url.password
            );
          } catch {
            return false;
          }
        },
        defaultMessage: () =>
          'Image must be an HTTP(S) URL or a service media path',
      },
    });
  };
}
export const userSelect = {
  id: true,
  username: true,
  fullName: true,
  email: true,
  role: true,
  status: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} as const;
export const authorSelect = {
  id: true,
  username: true,
  fullName: true,
  avatarUrl: true,
} as const;
export function presentUser<T extends { avatarUrl: string | null }>(user: T) {
  return {
    ...user,
    avatarUrl: mediaUrl(user.avatarUrl || DEFAULT_AVATAR_PATH),
  };
}
export function presentContent<
  T extends {
    author?: {
      id: string;
      username: string;
      fullName: string;
      avatarUrl: string | null;
    };
    createdBy?: {
      id: string;
      username: string;
      fullName: string;
      avatarUrl: string | null;
    };
    coverImageUrl?: string | null;
  },
>(item: T) {
  return {
    ...item,
    ...(item.author ? { author: presentUser(item.author) } : {}),
    ...(item.createdBy ? { createdBy: presentUser(item.createdBy) } : {}),
    ...('coverImageUrl' in item
      ? {
          coverImageUrl: item.coverImageUrl
            ? mediaUrl(item.coverImageUrl)
            : null,
        }
      : {}),
  };
}
