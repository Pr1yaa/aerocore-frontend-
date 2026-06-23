import { useState, useRef, type KeyboardEvent } from 'react'
import { Send, Paperclip, Mic, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MessageCategory, ComposerPayload } from '@/types'

const TAG_CHIPS: MessageCategory[] = ['TASK', 'INFO', 'ALERT', 'APPROVAL', 'ESCALATION']

const CHIP_ACTIVE: Partial<Record<MessageCategory, string>> = {
  ALERT:      'border-red-400 text-red-700 bg-red-50',
  ESCALATION: 'border-amber-400 text-amber-700 bg-amber-50',
  APPROVAL:   'border-sky-400 text-sky-700 bg-sky-50',
  TASK:       'border-violet-400 text-violet-700 bg-violet-50',
  LEAVE:      'border-pink-400 text-pink-700 bg-pink-50',
}

function Chip({
  label,
  active,
  onClick,
  disabled,
}: {
  label: MessageCategory
  active: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={`Tag as ${label}`}
      className={cn(
        'action-chip',
        active && (CHIP_ACTIVE[label] ?? 'border-indigo-500 text-indigo-700 bg-indigo-50 active-chip'),
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      {label}
    </button>
  )
}

interface ComposerProps {
  flightId: string
  onSubmit: (payload: ComposerPayload) => Promise<void>
  disabled?: boolean
}

export function Composer({ flightId, onSubmit, disabled = false }: ComposerProps) {
  const [text, setText] = useState('')
  const [tagType, setTagType] = useState<MessageCategory | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const canSend = text.trim().length > 0 && !disabled

  function toggleTag(cat: MessageCategory) {
    setTagType((prev) => (prev === cat ? null : cat))
  }

  async function handleSend() {
    if (!canSend) return
    const payload: ComposerPayload = {
      message: text.trim(),
      row1Type: null,
      row2Type: tagType,
      flightId,
    }
    setText('')
    setTagType(null)
    await onSubmit(payload)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="shrink-0 bg-surface-raised border-t border-surface-border px-4 py-3 flex flex-col gap-2.5"
      style={{ minHeight: 'var(--composer-height)' }}
      role="region"
      aria-label="Message composer"
    >
      {/* Tag chips */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[9px] font-display font-bold tracking-widest uppercase text-ink-muted mr-1" aria-hidden="true">
          Tag
        </span>
        {TAG_CHIPS.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            active={tagType === cat}
            onClick={() => toggleTag(cat)}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Active tag pill */}
      {tagType && (
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-600" aria-live="polite">
          <span className="text-ink-muted">Tagged as:</span>
          <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 font-bold">
            {tagType}
          </span>
          <button
            onClick={() => setTagType(null)}
            aria-label="Remove tag"
            className="ml-0.5 text-ink-muted hover:text-red-500 transition-colors text-[11px] leading-none"
          >
            ×
          </button>
        </div>
      )}

      <div className="h-px bg-surface-border" />

      {/* Input row */}
      <div className="flex items-center gap-2">
        <button
          aria-label="Attach file"
          disabled={disabled}
          className={cn('rail-btn w-8 h-8 rounded shrink-0', disabled && 'opacity-40 cursor-not-allowed')}
        >
          <Paperclip size={15} strokeWidth={1.8} />
        </button>

        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md bg-surface-base border border-surface-border focus-within:border-indigo-400 transition-colors duration-150">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={disabled ? 'Sending…' : 'Type a message… (Enter to send)'}
            aria-label="Message input"
            className="flex-1 bg-transparent text-sm font-sans text-ink-primary placeholder:text-ink-muted outline-none disabled:cursor-not-allowed"
          />
          <button
            aria-label="Voice message"
            disabled={disabled}
            className={cn('text-ink-muted hover:text-indigo-500 transition-colors shrink-0', disabled && 'opacity-40')}
          >
            <Mic size={14} strokeWidth={1.8} />
          </button>
        </div>

        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md font-display font-semibold text-xs tracking-wide shrink-0 transition-all duration-150 active:scale-95 min-w-[72px] justify-center',
            canSend
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600 shadow-sm'
              : 'bg-surface-subtle text-ink-muted border border-surface-border cursor-not-allowed',
          )}
        >
          {disabled ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <>
              <span>SEND</span>
              <Send size={12} strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
