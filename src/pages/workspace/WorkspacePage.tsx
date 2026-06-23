import { useParams, Navigate } from 'react-router-dom'
import { FlightSidebar } from '@/components/nav/FlightSidebar'
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader'
import { MessageFeed } from './MessageFeed'
import { Composer } from './Composer'
import { useFlights } from '@/lib/useFlights'
import { useMessages } from '@/lib/useMessages'
import { MOCK_FLIGHTS } from '@/lib/mock-data'
import { useEffect } from 'react'

export function WorkspacePage() {
  const { flightId } = useParams<{ flightId: string }>()
  const { flights, loading: flightsLoading } = useFlights()
  const { messages, loading: messagesLoading, error, send, sending } = useMessages(flightId)

  const flightList = flights.length > 0 ? flights : MOCK_FLIGHTS
  const flight = flightList.find((f) => f.id === flightId) ?? null

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (!flightId || !messages || messages.length === 0) return
    try {
      localStorage.setItem(`workspace_msgs_${flightId}`, JSON.stringify(messages))
    } catch { /* ignore */ }
  }, [messages, flightId])

  if (flightId && !flight && !flightsLoading) {
    return <Navigate to={`/workspace/${flightList[0]?.id ?? ''}`} replace />
  }

  return (
    <div className="flex flex-1 min-w-0 overflow-hidden">
      <FlightSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <WorkspaceHeader flight={flight} />
        <MessageFeed
          messages={messages}
          loading={messagesLoading}
          error={error}
        />
        {flight && (
          <Composer flightId={flight.id} onSubmit={send} disabled={sending} />
        )}
      </div>
    </div>
  )
}