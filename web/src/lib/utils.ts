import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const TOKEN_KEY = 'team-orbit-token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export type User = {
  id: string
  username: string
  fullName: string
  email: string | null
  role: string
  status: string
  avatarUrl?: string | null
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) { super(message); this.status = status }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(path, { ...options, headers })
  if (!res.ok) {
    const text = await res.text()
    let message = text
    try {
      const json = JSON.parse(text)
      message = json.message || JSON.stringify(json)
    } catch {
      /* keep text */
    }
    throw new ApiError(Array.isArray(message) ? message.join(', ') : message, res.status)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}
