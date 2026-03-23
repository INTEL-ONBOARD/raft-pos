// src/renderer/src/pages/pos/SupervisorPinModal.tsx
import { useState } from 'react'
import { X, Shield } from 'lucide-react'

interface SupervisorPinModalProps {
  onApproved: () => void
  onClose: () => void
  validatePin: (email: string, pin: string) => Promise<{ valid: boolean; error?: string }>
}

export function SupervisorPinModal({ onApproved, onClose, validatePin }: SupervisorPinModalProps) {
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!email.trim() || pin.length < 4) return
    setLoading(true)
    setError(null)
    try {
      const result = await validatePin(email.trim(), pin)
      if (result.valid) {
        onApproved()
      } else {
        setError(result.error ?? 'Invalid credentials')
      }
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = !loading && email.trim() && pin.length === 4

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-panel w-full max-w-[320px] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(79,70,229,0.10)' }}>
              <Shield className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Supervisor Approval</h2>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Discount exceeds your limit. A supervisor must approve this override.
          </p>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Supervisor email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="dark-input mt-1"
              autoFocus
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Supervisor PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.slice(0, 4))}
              maxLength={4}
              placeholder="4-digit PIN"
              className="dark-input mt-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm"
              style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button type="button" onClick={onClose} className="btn-secondary px-5 py-2">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="btn-primary px-5 py-2 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Approve'}
          </button>
        </div>

      </div>
    </div>
  )
}
