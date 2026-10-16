import { queryKeys } from '@/lib/query-keys'
import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'
import { useQueryClient } from '@tanstack/react-query'

export function useNotificationsSocket() {
  const { token } = useAuth()
  const qc = useQueryClient()

  useEffect(() => {
    if (!token) return

    const socket = io('/', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      autoConnect: false,
    })

    socket.on('connect', () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications })
    })
    socket.on(
      'notification:new',
      (payload: { title?: string; body?: string }) => {
        toast.message(payload.title ?? 'Notification', {
          description: payload.body,
        })
        qc.invalidateQueries({ queryKey: queryKeys.notifications })
      },
    )

    // Strict Mode replays effects in development. Its initial cleanup should
    // cancel startup before opening a WebSocket that would be closed mid-upgrade.
    const connectTimer = window.setTimeout(() => socket.connect(), 0)

    return () => {
      window.clearTimeout(connectTimer)
      socket.removeAllListeners()
      socket.close()
    }
  }, [token, qc])
}
