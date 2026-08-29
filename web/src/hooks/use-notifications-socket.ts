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
      reconnection: false,
      autoConnect: true,
    })

    socket.on('notification:new', (payload: { title?: string; body?: string }) => {
      toast.message(payload.title ?? 'Notification', {
        description: payload.body,
      })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    })

    return () => {
      socket.removeAllListeners()
      socket.close()
    }
  }, [token, qc])
}
