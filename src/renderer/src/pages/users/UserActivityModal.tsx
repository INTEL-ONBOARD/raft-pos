// src/renderer/src/pages/users/UserActivityModal.tsx
import { X, Activity } from 'lucide-react'
import type { ActivityLogEntry } from '@shared/types/user.types'

interface Props {
  userName: string
  activity: ActivityLogEntry[]
  isLoading: boolean
  onClose: () => void
}

export function UserActivityModal({ userName, activity, isLoading, onClose }: Props) {
  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-panel w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(79,70,229,0.10)' }}>
              <Activity className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Activity — {userName}</h2>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {isLoading ? (
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>
          ) : activity.length === 0 ? (
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No activity recorded.</div>
          ) : (
            <div className="space-y-2">
              {activity.map(entry => (
                <div key={entry._id} className="flex items-start gap-3 p-3 text-sm rounded-xl" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex-1">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{entry.action.replace(/_/g, ' ')}</span>
                    {entry.targetCollection && (
                      <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{entry.targetCollection}</span>
                    )}
                  </div>
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 shrink-0"
          style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button type="button" onClick={onClose} className="btn-secondary px-5 py-2">Close</button>
        </div>

      </div>
    </div>
  )
}
