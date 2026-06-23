/**
 * QAgentPage.tsx — wired to AEROCORE v4 backend
 * Uses POST /ingress/chat + GET /dashboard/chat/session/{id}
 * Session and message history persisted in localStorage
 */
import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles, ChevronRight, Zap, Loader2, Trash2 } from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'
import { QAGENT_PROMPTS } from '@/lib/mock-data'
import { sendChatMessage, fetchChatSession } from '@/lib/api'
import type { QAgentMessage } from '@/types'
import type { MessageCategory } from '@/types'
import { useAuth } from '@/lib/auth'

const QAGENT_TYPES: MessageCategory[] = ['QUERY', 'SUPPORT', 'CAB', 'HOTEL', 'LEAVE']

const TYPE_ACTIVE: Partial<Record<MessageCategory, string>> = {
  QUERY:   'border-indigo-400 text-indigo-700 bg-indigo-50',
  SUPPORT: 'border-green-400 text-green-700 bg-green-50',
  CAB:     'border-orange-400 text-orange-700 bg-orange-50',
  HOTEL:   'border-teal-400 text-teal-700 bg-teal-50',
  LEAVE:   'border-pink-400 text-pink-700 bg-pink-50',
}

const TYPE_TO_BACKEND: Partial<Record<MessageCategory, string>> = {
  QUERY:   'general_query',
  SUPPORT: 'general_query',
  CAB:     'cab',
  HOTEL:   'hotel',
  LEAVE:   'leave',
}

type AgentStatus = 'ready' | 'thinking' | 'routed'

const WELCOME_MSG = {
  id: 'welcome',
  role: 'agent' as const,
  content: "Hello! I'm QAgent — your AI-powered crew operations assistant. Select a type then ask me anything about flights, crew, hotels, cabs, leave requests, or escalations.",
  timestamp: new Date().toISOString(),
}

function StatusBadge({ status }: { status: AgentStatus }) {
  const cfg = {
    ready:    { dot: 'bg-status-ok',   label: 'Ready',    text: 'text-status-ok'   },
    thinking: { dot: 'bg-status-warn', label: 'Thinking', text: 'text-status-warn' },
    routed:   { dot: 'bg-status-info', label: 'Routed',   text: 'text-status-info' },
  }[status]
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-overlay border border-surface-border">
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot, status === 'thinking' && 'animate-pulse-dot')} />
      <span className={cn('text-[10px] font-mono font-bold uppercase tracking-wider', cfg.text)}>{cfg.label}</span>
    </div>
  )
}

interface QAMessage extends QAgentMessage {
  msgType?: MessageCategory
}

function QABubble({ msg }: { msg: QAMessage }) {
  const isAgent = msg.role === 'agent'
  return (
    <div className={cn('flex gap-3 animate-fade-in', isAgent ? 'flex-row' : 'flex-row-reverse')}>
      {isAgent ? (
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
          <Bot size={14} className="text-white" strokeWidth={1.8} />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-center shrink-0 text-[11px] font-display font-bold text-ink-secondary">
          ME
        </div>
      )}
      <div className={cn('flex flex-col max-w-[78%]', !isAgent && 'items-end')}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-medium text-ink-primary">{isAgent ? 'QAgent' : 'You'}</span>
          {!isAgent && (msg as any).msgType && (
            <span className="text-[9px] font-display font-bold tracking-widest px-1.5 py-0.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-600">
              {(msg as any).msgType}
            </span>
          )}
          <span className="text-[10px] text-ink-muted font-mono">{formatTime(msg.timestamp)}</span>
        </div>
        <div className={cn(
          'px-3.5 py-2.5 rounded-xl text-sm leading-relaxed shadow-card whitespace-pre-wrap',
          isAgent
            ? 'bg-indigo-50 border border-indigo-200 text-ink-primary rounded-tl-sm'
            : 'bg-indigo-600 text-white rounded-tr-sm',
        )}>
          {msg.content}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
        <Bot size={14} className="text-white" strokeWidth={1.8} />
      </div>
      <div className="px-3.5 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 shadow-card flex items-center gap-1.5">
        {[0, 150, 300].map((delay) => (
          <span key={delay} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse-dot" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </div>
  )
}

function SuggestionPrompt({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-surface-border text-xs text-ink-secondary hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 transition-all duration-150 text-left group">
      <ChevronRight size={12} className="text-ink-muted group-hover:text-indigo-500 shrink-0" strokeWidth={2} />
      <span>{text}</span>
    </button>
  )
}

function TypeChip({ label, active, onClick }: { label: MessageCategory; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn('action-chip', active && (TYPE_ACTIVE[label] ?? 'border-indigo-500 text-indigo-700 bg-indigo-50 active-chip'))}>
      {label}
    </button>
  )
}

export function QAgentPage() {
  const { user } = useAuth()

  // Persist session ID across tab switches
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem('qagent_session_id')
    if (stored) return stored
    const newId = `sess_${Date.now()}`
    localStorage.setItem('qagent_session_id', newId)
    return newId
  })

  // Restore messages from localStorage on mount
  const [messages, setMessages] = useState<QAMessage[]>(() => {
    try {
      const stored = localStorage.getItem('qagent_messages')
      if (stored) return JSON.parse(stored)
    } catch { /* ignore */ }
    return [WELCOME_MSG]
  })

  const [text, setText] = useState('')
  const [msgType, setMsgType] = useState<MessageCategory | null>(null)
  const [status, setStatus] = useState<AgentStatus>('ready')
  const [isTyping, setIsTyping] = useState(false)
  const [pendingChatId, setPendingChatId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('qagent_messages', JSON.stringify(messages))
    } catch { /* ignore */ }
  }, [messages])

  // Load history from backend on first mount (in case localStorage is empty)
  useEffect(() => {
    async function loadHistory() {
      if (messages.length > 1) return // already have history in localStorage
      try {
        const data = await fetchChatSession(sessionId)
        if (data.messages && data.messages.length > 0) {
          const restored: QAMessage[] = data.messages.map((m, i) => ({
            id: `restored-${i}`,
            role: m.role === 'assistant' ? 'agent' as const : 'user' as const,
            content: m.content,
            timestamp: (m as any).received_at ?? (m as any).processed_at ?? new Date().toISOString(),
          }))
          setMessages([WELCOME_MSG, ...restored])
        }
      } catch { /* ignore */ }
    }
    loadHistory()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Poll for response after sending
  useEffect(() => {
    if (!pendingChatId) return
    pollRef.current = setInterval(async () => {
      try {
        const data = await fetchChatSession(sessionId)
        const lastMsg = data.messages[data.messages.length - 1]
        if (lastMsg?.role === 'assistant') {
          setIsTyping(false)
          setStatus('routed')
          setMessages((prev) => {
            if (prev.some((m) => m.content === lastMsg.content && m.role === 'agent')) return prev
            return [...prev, {
              id: `a-${Date.now()}`,
              role: 'agent' as const,
              content: lastMsg.content,
              timestamp: (lastMsg as any).processed_at ?? new Date().toISOString(),
            }]
          })
          setPendingChatId(null)
          if (pollRef.current) clearInterval(pollRef.current)
          setTimeout(() => setStatus('ready'), 1500)
        }
      } catch (err) {
        console.error('[QAgent] Poll error:', err)
      }
    }, 2000)

    const timeout = setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current)
      setIsTyping(false)
      setStatus('ready')
      setPendingChatId(null)
    }, 60000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      clearTimeout(timeout)
    }
  }, [pendingChatId, sessionId])

  async function sendMessage(content: string, type?: MessageCategory | null) {
    if (!content.trim() || status === 'thinking') return
    const resolvedType = type ?? msgType
    const userMsg: QAMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      msgType: resolvedType ?? undefined,
    }
    setMessages((prev) => [...prev, userMsg])
    setText('')
    setMsgType(null)
    setStatus('thinking')
    setIsTyping(true)
    try {
      const backendQueryType = resolvedType ? (TYPE_TO_BACKEND[resolvedType] ?? 'general_query') : 'general_query'
      const result = await sendChatMessage({
        raw_content: content.trim(),
        query_type: backendQueryType,
        session_id: sessionId,
        conversation_history: messages
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({ role: m.role === 'agent' ? 'assistant' : 'user', content: m.content })),
      })
      setPendingChatId(result.chat_id)
    } catch (err) {
      console.error('[QAgent] Send error:', err)
      setIsTyping(false)
      setStatus('ready')
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`,
        role: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }])
    }
  }

  function clearHistory() {
    localStorage.removeItem('qagent_messages')
    localStorage.removeItem('qagent_session_id')
    const newId = `sess_${Date.now()}`
    localStorage.setItem('qagent_session_id', newId)
    setMessages([WELCOME_MSG])
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(text)
    }
  }

  const canSend = text.trim().length > 0 && status !== 'thinking'

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-surface-base">
      <header className="shrink-0 flex items-center justify-between px-5 bg-surface-raised border-b border-surface-border" style={{ height: 'var(--header-height)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
            <Bot size={16} className="text-white" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="font-display font-bold text-base text-ink-primary tracking-wide flex items-center gap-1.5">
              QAgent <Sparkles size={13} className="text-indigo-400" strokeWidth={1.5} />
            </h1>
            <p className="text-[10px] text-ink-muted font-mono -mt-0.5">AI Crew Ops Assistant · {user?.name ?? 'User'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearHistory}
            title="Clear chat history"
            className="p-1.5 rounded-lg hover:bg-surface-subtle text-ink-muted hover:text-red-500 transition-colors"
          >
            <Trash2 size={13} strokeWidth={2} />
          </button>
          <StatusBadge status={status} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {messages.map((msg) => <QABubble key={msg.id} msg={msg} />)}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div className="px-5 pb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap size={11} className="text-indigo-400" strokeWidth={2} />
            <span className="text-[10px] font-display font-bold tracking-widest uppercase text-ink-muted">Suggested</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {QAGENT_PROMPTS.map((prompt) => (
              <SuggestionPrompt key={prompt} text={prompt} onClick={() => sendMessage(prompt)} />
            ))}
          </div>
        </div>
      )}

      <div className="shrink-0 px-5 py-3 bg-surface-raised border-t border-surface-border flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] font-display font-bold tracking-widest uppercase text-ink-muted mr-1">Type</span>
          {QAGENT_TYPES.map((t) => (
            <TypeChip key={t} label={t} active={msgType === t} onClick={() => setMsgType((prev) => prev === t ? null : t)} />
          ))}
        </div>
        {msgType && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-600">
            <span className="text-ink-muted">Routing as:</span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 font-bold">{msgType}</span>
          </div>
        )}
        <div className="h-px bg-surface-border" />
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface-base border border-surface-border focus-within:border-indigo-400 transition-colors">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask QAgent anything about ops…"
              className="flex-1 bg-transparent text-sm font-sans text-ink-primary placeholder:text-ink-muted outline-none"
              disabled={status === 'thinking'}
            />
          </div>
          <button
            onClick={() => sendMessage(text)}
            disabled={!canSend}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg font-display font-semibold text-xs tracking-wide transition-all duration-150 active:scale-95',
              canSend ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' : 'bg-surface-subtle text-ink-muted cursor-not-allowed',
            )}
          >
            {status === 'thinking' ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} strokeWidth={2.5} />}
          </button>
        </div>
        <p className="text-[9px] text-ink-muted font-mono text-center">
          QAgent responses are AI-generated. Always verify critical ops decisions.
        </p>
      </div>
    </div>
  )
}