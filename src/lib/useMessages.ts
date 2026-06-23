/**
 * useMessages.ts
 * ──────────────
 * Data-aware hook: fetch messages for a flight, handle sends,
 * and subscribe to realtime inserts.
 * Messages persisted in localStorage per flight.
 */
import { useState, useEffect, useCallback } from 'react'
import { fetchMessages, sendMessage } from '@/lib/data-access'
import { useMessageRealtime } from '@/lib/useRealtime'
import type { Message, ComposerPayload } from '@/types'

export interface UseMessagesResult {
  messages: Message[]
  loading: boolean
  error: string | null
  send: (payload: ComposerPayload) => Promise<void>
  sending: boolean
}

function getStorageKey(flightId: string) {
  return `workspace_msgs_${flightId}`
}

function loadFromStorage(flightId: string): Message[] {
  try {
    const stored = localStorage.getItem(getStorageKey(flightId))
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return []
}

function saveToStorage(flightId: string, messages: Message[]) {
  try {
    // Keep last 100 messages per flight to avoid localStorage size limits
    const toSave = messages.slice(-100)
    localStorage.setItem(getStorageKey(flightId), JSON.stringify(toSave))
  } catch { /* ignore */ }
}

export function useMessages(flightId: string | undefined): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (!flightId) return []
    return loadFromStorage(flightId)
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  // When flightId changes, load that flight's cached messages immediately
  useEffect(() => {
    if (!flightId) return
    const cached = loadFromStorage(flightId)
    setMessages(cached)
  }, [flightId])

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (!flightId || messages.length === 0) return
    saveToStorage(flightId, messages)
  }, [messages, flightId])

  // Initial fetch — merges with cached messages
  useEffect(() => {
    if (!flightId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchMessages(flightId)
      .then((data) => {
        if (!cancelled) {
          setMessages((prev) => {
            // Merge fetched with cached — deduplicate by id
            const ids = new Set(data.map((m) => m.id))
            const localOnly = prev.filter((m) => !ids.has(m.id))
            const merged = [...data, ...localOnly]
            merged.sort((a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            )
            return merged
          })
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load messages.')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [flightId])

  // Realtime subscription
  const handleNewMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === msg.id)
      if (exists) return prev
      return [...prev, msg]
    })
  }, [])
  useMessageRealtime(flightId, handleNewMessage)

  // Send
  const send = useCallback(
    async (payload: ComposerPayload) => {
      setSending(true)
      try {
        const msg = await sendMessage(payload)
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === msg.id)
          return exists ? prev : [...prev, msg]
        })
      } finally {
        setSending(false)
      }
    },
    [],
  )

  return { messages, loading, error, send, sending }
}