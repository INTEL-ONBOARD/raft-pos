import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { StatusModal } from '../../components/ui/StatusModal'
import type { IBranch, CreateBranchInput, UpdateBranchInput } from '../../hooks/useBranches'

function deriveCode(name: string): string {
  return name.trim().toUpperCase().replace(/\s+/g, '-').slice(0, 10)
}

interface Props {
  branch?: IBranch | null
  onConfirm: (data: CreateBranchInput | UpdateBranchInput) => void
  onClose: () => void
  isLoading: boolean
}

export function BranchFormModal({ branch, onConfirm, onClose, isLoading }: Props) {
  const [name, setName] = useState(branch?.name ?? '')
  const [code, setCode] = useState(branch?.code ?? '')
  const [address, setAddress] = useState(branch?.address ?? '')
  const [phone, setPhone] = useState(branch?.phone ?? '')
  const [email, setEmail] = useState(branch?.email ?? '')
  const [codeTouched, setCodeTouched] = useState(!!branch)
  const [error, setError] = useState('')

  useEffect(() => {
    setName(branch?.name ?? '')
    setCode(branch?.code ?? '')
    setAddress(branch?.address ?? '')
    setPhone(branch?.phone ?? '')
    setEmail(branch?.email ?? '')
    setCodeTouched(!!branch)
    setError('')
  }, [branch])

  function handleNameChange(v: string) {
    setName(v)
    if (!codeTouched) setCode(deriveCode(v))
  }

  function handleCodeChange(v: string) {
    setCode(
      v
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, '')
        .slice(0, 10)
    )
    setCodeTouched(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Name is required')
    if (!code.trim()) return setError('Code is required')
    onConfirm({ name, code, address, phone, email })
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--text-muted)'
  }

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-panel w-full max-w-md overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(79,70,229,0.10)' }}
            >
              <BuildingOffice2Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {branch ? 'Edit Branch' : 'Add Branch'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-3">
            <div>
              <label style={labelStyle}>Name *</label>
              <input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Main Branch"
                className="dark-input mt-1"
              />
            </div>
            <div>
              <label style={labelStyle}>Code *</label>
              <input
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="e.g. MAIN"
                className="dark-input mt-1 font-mono"
              />
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                Auto-generated from name. Unique, max 10 chars.
              </p>
            </div>
            <div>
              <label style={labelStyle}>Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 123 Main St"
                className="dark-input mt-1"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+63 9XX XXX XXXX"
                  className="dark-input mt-1"
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="branch@example.com"
                  className="dark-input mt-1"
                />
              </div>
            </div>
            <StatusModal
              isOpen={!!error}
              type="error"
              message={error || ''}
              onClose={() => setError('')}
            />
          </div>

          {/* Footer */}
          <div
            className="flex justify-end gap-2 px-6 py-4"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <button type="button" onClick={onClose} className="btn-secondary px-5 py-2">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary px-5 py-2 disabled:opacity-50"
            >
              {isLoading ? 'Saving…' : branch ? 'Save Changes' : 'Add Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
