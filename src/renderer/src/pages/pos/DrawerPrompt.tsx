// src/renderer/src/pages/pos/DrawerPrompt.tsx
import { useState } from 'react'
import { useCashDrawer } from '../../hooks/useCashDrawer'
import { StatusModal } from '../../components/ui/StatusModal'

export function DrawerPrompt() {
  const [openingCash, setOpeningCash] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { openMutation } = useCashDrawer()

  async function handleOpen(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const amount = parseFloat(openingCash)
    if (isNaN(amount) || amount < 0) {
      setError('Enter a valid opening cash amount (0 or more)')
      return
    }
    try {
      await openMutation.mutateAsync({ openingCash: amount })
    } catch (err: any) {
      setError(err.message ?? 'Failed to open drawer')
    }
  }

  return (
    <div
      className="flex h-full items-center justify-center"
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        className="p-8 w-full max-w-sm"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '1rem',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <div className="flex flex-col items-center gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(79,70,229,0.10)', border: '1px solid rgba(79,70,229,0.18)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Open Cash Drawer
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              A cash drawer must be open before you can make sales.
            </p>
          </div>
        </div>

        <form onSubmit={handleOpen} className="space-y-4">
          <div>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--text-muted)'
              }}
            >
              Opening Cash Amount
            </label>
            <div className="relative mt-1">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                ₱
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                className="dark-input w-full pl-7"
                autoFocus
              />
            </div>
          </div>

          <StatusModal
            isOpen={!!error}
            type="error"
            message={error || ''}
            onClose={() => setError(null)}
          />

          <button
            type="submit"
            disabled={openMutation.isPending}
            className="btn-primary w-full disabled:opacity-60 font-medium py-2.5 rounded-xl text-sm transition-colors"
          >
            {openMutation.isPending ? 'Opening…' : 'Open Drawer'}
          </button>
        </form>
      </div>
    </div>
  )
}
