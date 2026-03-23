// src/renderer/src/pages/suppliers/SupplierFormModal.tsx
import { useState, useEffect } from 'react'
import { X, Truck } from 'lucide-react'
import { useSuppliers } from '../../hooks/useSuppliers'
import type { ISupplier, CreateSupplierInput, UpdateSupplierInput } from '@shared/types/supplier.types'

interface Props {
  supplier: ISupplier | null   // null = create mode
  onClose: () => void
}

export function SupplierFormModal({ supplier, onClose }: Props) {
  const { create, update } = useSuppliers()
  const isEdit = !!supplier

  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        notes: supplier.notes
      })
    }
  }, [supplier])

  const field = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    try {
      if (isEdit) {
        await update.mutateAsync({ id: supplier!._id, input: form as UpdateSupplierInput })
      } else {
        await create.mutateAsync(form as CreateSupplierInput)
      }
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Unexpected error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-panel w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(79,70,229,0.10)' }}>
              <Truck className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isEdit ? 'Edit Supplier' : 'New Supplier'}
              </h2>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-3">
            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm"
                style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)' }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input value={form.name} onChange={field('name')} className="dark-input mt-1" placeholder="Supplier name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Contact Person</label>
                <input value={form.contactPerson} onChange={field('contactPerson')} className="dark-input mt-1" placeholder="Full name" />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Phone</label>
                <input value={form.phone} onChange={field('phone')} className="dark-input mt-1" placeholder="+63 9XX XXX XXXX" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Email</label>
              <input value={form.email} onChange={field('email')} type="email" className="dark-input mt-1" placeholder="supplier@example.com" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Address</label>
              <input value={form.address} onChange={field('address')} className="dark-input mt-1" placeholder="Street, City, Province" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Notes</label>
              <textarea value={form.notes} onChange={field('notes')} rows={2} className="dark-input resize-none mt-1" placeholder="Internal notes..." />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4"
            style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" onClick={onClose} className="btn-secondary px-5 py-2">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2 disabled:opacity-50">
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Supplier'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
