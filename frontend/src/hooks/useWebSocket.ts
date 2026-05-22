import { useEffect, useRef, useCallback } from 'react'
import { Client, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '@/store/authStore'

type MessageHandler = (body: unknown) => void

export function useWebSocket() {
  const clientRef = useRef<Client | null>(null)
  const { accessToken, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) return

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
    }
  }, [isAuthenticated, accessToken])

  const subscribe = useCallback((destination: string, handler: MessageHandler): StompSubscription | null => {
    const client = clientRef.current
    if (!client?.connected) return null
    return client.subscribe(destination, (msg) => {
      try {
        handler(JSON.parse(msg.body))
      } catch {
        handler(msg.body)
      }
    })
  }, [])

  const subscribeWhenReady = useCallback((destination: string, handler: MessageHandler) => {
    const client = clientRef.current
    if (!client) return

    if (client.connected) {
      return client.subscribe(destination, (msg) => {
        try { handler(JSON.parse(msg.body)) } catch { handler(msg.body) }
      })
    }

    const originalOnConnect = client.onConnect
    client.onConnect = (frame) => {
      originalOnConnect?.(frame)
      client.subscribe(destination, (msg) => {
        try { handler(JSON.parse(msg.body)) } catch { handler(msg.body) }
      })
    }
  }, [])

  return { subscribe, subscribeWhenReady, client: clientRef }
}
