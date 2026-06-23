import { useState, useRef } from 'react'
import { AlertOctagon, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PriorityBadge, CategoryTag, AssigneeAvatar } from '@/components/ui/DashboardShared'
import type { Priority } from '@/components/ui/DashboardShared'

// ── Types ─────────────────────────────────────────────────────────────
export interface OpsCardData {
  id: string
  title: string
  flight: string
  priority: Priority
  category: string
  dueTime: string
  assignee?: string
  notes?: string
  createdAt?: string
}

// ── Ops Card Detail Modal ─────────────────────────────────────────────
function OpsCardDetail({ card, onClose, onBlock }: {
  card: OpsCardData
  onClose: () => void
  onBlock: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-primary/20 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface-raised border border-surface-border rounded-xl shadow-panel w-full max-w-sm mx-4 overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="px-4 py-3 border-b border-surface-border flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-ink-primary leading-snug">{card.title}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryTag tag={card.category} />
              <PriorityBadge priority={card.priority} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink-primary transition-colors shrink-0"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] font-display font-bold tracking-widest uppercase text-ink-muted mb-1">Flight</p>
              <p className="text-xs font-mono font-semibold text-ink-primary">{card.flight}</p>
            </div>
            <div>
              <p className="text-[9px] font-display font-bold tracking-widest uppercase text-ink-muted mb-1">Due</p>
              <div className="flex items-center gap-1">
                <Clock size={10} className="text-status-warn" strokeWidth={2} />
                <p className="text-xs font-mono text-status-warn font-semibold">{card.dueTime}</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-display font-bold tracking-widest uppercase text-ink-muted mb-1">Assignee</p>
              {card.assignee ? (
                <div className="flex items-center gap-1.5">
                  <AssigneeAvatar name={card.assignee} size="sm" />
                  <span className="text-xs text-ink-secondary">{card.assignee}</span>
                </div>
              ) : (
                <span className="text-xs text-ink-muted">Unassigned</span>
              )}
            </div>
            <div>
              <p className="text-[9px] font-display font-bold tracking-widest uppercase text-ink-muted mb-1">Created</p>
              <p className="text-xs font-mono text-ink-secondary">{card.createdAt ?? 'Today'}</p>
            </div>
          </div>

          {/* Notes */}
          {card.notes && (
            <div>
              <p className="text-[9px] font-display font-bold tracking-widest uppercase text-ink-muted mb-1.5">Notes</p>
              <p className="text-xs text-ink-secondary leading-relaxed bg-surface-subtle rounded-md px-3 py-2.5">
                {card.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-4 py-3 border-t border-surface-border flex items-center gap-2">
          <button
            onClick={() => { onBlock(); onClose() }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <AlertOctagon size={12} strokeWidth={2} />
            Mark Blocked
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-xs font-display font-semibold text-ink-muted border border-surface-border hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Ops Card ──────────────────────────────────────────────────────────
interface OpsCardProps {
  card: OpsCardData
  onAdvance: (cardId: string) => void
  onBlock: (cardId: string) => void
  isBlocked?: boolean
}

export function OpsCard({ card, onAdvance, onBlock, isBlocked }: OpsCardProps) {
  const [showDetail, setShowDetail] = useState(false)
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clickCount = useRef(0)

  function handleClick() {
    clickCount.current += 1

    if (clickTimer.current) clearTimeout(clickTimer.current)

    clickTimer.current = setTimeout(() => {
      if (clickCount.current === 1) {
        setShowDetail(true)
      } else if (clickCount.current >= 2) {
        onAdvance(card.id)
      }
      clickCount.current = 0
    }, 220)
  }

  return (
    <>
      <div
        onClick={handleClick}
        className={cn(
          'panel p-3 flex flex-col gap-2 cursor-pointer group relative',
          'hover:border-indigo-300 hover:shadow-panel transition-all duration-150',
          isBlocked && 'border-red-200 bg-red-50/40',
        )}
      >
        {/* Top row: title + block button */}
        <div className="flex items-start gap-2">
          <p className="text-xs text-ink-primary leading-relaxed flex-1 font-medium">{card.title}</p>
          {/* Tiny block button */}
          <button
            onClick={(e) => { e.stopPropagation(); onBlock(card.id) }}
            title="Move to Blocked"
            className={cn(
              'shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all duration-150',
              'opacity-0 group-hover:opacity-100',
              isBlocked
                ? 'text-red-500 bg-red-100 opacity-100'
                : 'text-ink-muted hover:text-red-500 hover:bg-red-50',
            )}
          >
            <AlertOctagon size={10} strokeWidth={2.5} />
          </button>
        </div>

        {/* Flight + category row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-mono font-semibold text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
            {card.flight}
          </span>
          <CategoryTag tag={card.category} />
        </div>

        {/* Priority + due time */}
        <div className="flex items-center justify-between gap-2">
          <PriorityBadge priority={card.priority} />
          <div className="flex items-center gap-1">
            <Clock size={9} className="text-ink-muted" strokeWidth={2} />
            <span className="text-[9px] font-mono text-ink-muted">{card.dueTime}</span>
          </div>
        </div>

        {/* Assignee */}
        {card.assignee ? (
          <div className="flex items-center gap-1.5 pt-0.5 border-t border-surface-border">
            <AssigneeAvatar name={card.assignee} size="sm" />
            <span className="text-[9px] text-ink-muted">{card.assignee}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 pt-0.5 border-t border-surface-border">
            <div className="w-5 h-5 rounded-full border border-dashed border-surface-border flex items-center justify-center">
              <span className="text-[8px] text-ink-muted">?</span>
            </div>
            <span className="text-[9px] text-ink-muted italic">Unassigned</span>
          </div>
        )}

        {/* Double-click hint */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg" />
      </div>

      {showDetail && (
        <OpsCardDetail
          card={card}
          onClose={() => setShowDetail(false)}
          onBlock={() => onBlock(card.id)}
        />
      )}
    </>
  )
}
