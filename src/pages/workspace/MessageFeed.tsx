import { useEffect, useRef } from 'react'
import { Bot, MessagesSquare, AlertCircle } from 'lucide-react'
import { cn, formatRelative, formatTime } from '@/lib/utils'
import type { Message, MessageCategory } from '@/types'

// ── Category badge colours ───────────────────────────────────────────
const CAT_STYLE: Partial<Record<MessageCategory, string>> = {
  ALERT: 'bg-red-50 text-red-600 border-red-200',
  ESCALATION: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVAL: 'bg-sky-50 text-sky-700 border-sky-200',
  TASK: 'bg-violet-50 text-violet-700 border-violet-200',
  INFO: 'bg-slate-50 text-slate-600 border-slate-200',
  QUERY: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  SUPPORT: 'bg-green-50 text-green-700 border-green-200',
  HOTEL: 'bg-teal-50 text-teal-700 border-teal-200',
  CAB: 'bg-orange-50 text-orange-700 border-orange-200',
  LEAVE: 'bg-pink-50 text-pink-700 border-pink-200',
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

// ── Single message bubble ────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isMe = msg.senderId === 'me'
  const isAI = msg.isAI

  return (
    <div
      role="article"
      aria-label={`Message from ${msg.senderName}`}
      className={cn('flex gap-3 animate-fade-in', isMe ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      {isAI ? (
        <div
          aria-hidden="true"
          className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm"
        >
          <Bot size={14} className="text-white" strokeWidth={1.8} />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-display font-bold shadow-sm border',
            isMe
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-surface-subtle text-ink-secondary border-surface-border',
          )}
        >
          {getInitials(msg.senderName)}
        </div>
      )}

      {/* Content */}
      <div className={cn('flex flex-col max-w-[72%] min-w-0', isMe && 'items-end')}>
        {/* Sender + time */}
        <div className={cn('flex items-center gap-2 mb-1', isMe && 'flex-row-reverse')}>
          <span className="text-[11px] font-medium text-ink-primary">
            {isAI ? 'QAgent' : isMe ? 'You' : msg.senderName}
          </span>
          {!isMe && !isAI && (
            <span className="text-[10px] text-ink-muted font-mono">{msg.senderRole}</span>
          )}
          <time
            dateTime={msg.timestamp}
            className="text-[10px] text-ink-muted font-mono"
            title={new Date(msg.timestamp).toLocaleString()}
          >
            {formatTime(msg.timestamp)}
          </time>
        </div>

        {/* Bubble */}
        <div
          className={cn(
            'relative px-3.5 py-2.5 rounded-xl text-sm leading-relaxed shadow-card',
            isMe
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : isAI
                ? 'bg-indigo-50 border border-indigo-200 text-ink-primary rounded-tl-sm'
                : 'bg-surface-raised border border-surface-border text-ink-primary rounded-tl-sm',
          )}
        >
          <p>{msg.content}</p>

          {/* Category badge */}
          <div
            className={cn(
              'mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-display font-bold tracking-wider border',
              isMe
                ? 'bg-white/20 text-white border-white/30'
                : (CAT_STYLE[msg.category] ?? 'bg-slate-50 text-slate-600 border-slate-200'),
            )}
          >
            {msg.category}
          </div>
        </div>

        {/* Relative time */}
        <span className="text-[9px] text-ink-muted mt-1 font-mono">
          {formatRelative(msg.timestamp)}
        </span>
      </div>
    </div>
  )
}

// ── Date divider ─────────────────────────────────────────────────────
function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2" role="separator" aria-label={label}>
      <div className="flex-1 h-px bg-surface-border" />
      <span className="text-[10px] font-mono text-ink-muted px-2 py-0.5 rounded-full bg-surface-subtle border border-surface-border">
        {label}
      </span>
      <div className="flex-1 h-px bg-surface-border" />
    </div>
  )
}

// ── Empty state ──────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8" role="status">
      <div className="w-14 h-14 rounded-xl bg-surface-raised border border-surface-border flex items-center justify-center shadow-panel">
        <MessagesSquare size={24} className="text-indigo-400" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-medium text-ink-secondary">Flight operations channel</p>
        <p className="text-xs text-ink-muted mt-1">
          Messages, tasks, alerts and approvals will appear here.
        </p>
      </div>
    </div>
  )
}

// ── Loading skeleton ─────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-5 py-4" role="status" aria-label="Loading messages">
      {[...Array(4)].map((_, i) => (
        <div key={i} className={cn('flex gap-3', i % 3 === 2 && 'flex-row-reverse')}>
          <div className="w-8 h-8 rounded-lg bg-surface-subtle animate-pulse shrink-0" />
          <div className={cn('flex flex-col gap-1.5', i % 3 === 2 && 'items-end')}>
            <div className="h-2.5 w-24 bg-surface-subtle rounded animate-pulse" />
            <div className={cn('h-14 rounded-xl bg-surface-subtle animate-pulse', i % 3 === 2 ? 'w-48' : 'w-64')} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Error state ──────────────────────────────────────────────────────
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8" role="alert">
      <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
        <AlertCircle size={20} className="text-red-500" strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-sm font-medium text-ink-secondary">Could not load messages</p>
        <p className="text-xs text-ink-muted mt-1">{message}</p>
      </div>
    </div>
  )
}

// ── MessageFeed ──────────────────────────────────────────────────────
interface MessageFeedProps {
  messages: Message[]
  loading?: boolean
  error?: string | null
}

export function MessageFeed({ messages, loading = false, error = null }: MessageFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-surface-base">
        <LoadingSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto bg-surface-base">
        <ErrorState message={error} />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-surface-base">
        <EmptyState />
      </div>
    )
  }

  return (
    <div
      className="flex-1 overflow-y-auto bg-surface-base px-5 py-4 flex flex-col gap-4"
      role="log"
      aria-label="Flight messages"
      aria-live="polite"
    >
      <DateDivider label="Today" />
      {messages.map((msg) => (
        <MessageBubble key={msg.id} msg={msg} />
      ))}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  )
}
