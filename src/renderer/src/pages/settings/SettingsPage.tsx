// src/renderer/src/pages/settings/SettingsPage.tsx
import { useState, useEffect } from 'react'
import { Save, Store, Percent, Monitor, CheckCircle2, AlertTriangle, FileText } from 'lucide-react'
import { useSettings } from '../../hooks/useSettings'

export default function SettingsPage() {
  const { settingsQuery, updateMutation } = useSettings()
  const settings = settingsQuery.data

  const [storeName, setStoreName] = useState('')
  const [receiptHeader, setReceiptHeader] = useState('')
  const [receiptFooter, setReceiptFooter] = useState('')
  const [globalTaxRate, setGlobalTaxRate] = useState(12)
  const [currencySymbol, setCurrencySymbol] = useState('₱')
  const [lowStockDefaultThreshold, setLowStockDefaultThreshold] = useState(10)
  const [terminalId, setTerminalId] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName)
      setReceiptHeader(settings.receiptHeader)
      setReceiptFooter(settings.receiptFooter)
      setGlobalTaxRate(settings.globalTaxRate)
      setCurrencySymbol(settings.currencySymbol)
      setLowStockDefaultThreshold(settings.lowStockDefaultThreshold)
      setTerminalId(settings.terminalId)
    }
  }, [settings])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSaved(false)
    try {
      await updateMutation.mutateAsync({
        storeName, receiptHeader, receiptFooter,
        globalTaxRate, currencySymbol, lowStockDefaultThreshold,
        terminalId
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message ?? 'Failed to save settings')
    }
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Configure your store, tax rules, and terminal identity
          </p>
        </div>
      </div>

      <div className="p-8 flex-1 max-w-2xl">
        {settingsQuery.isLoading ? (
          <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            <div
              className="w-4 h-4 rounded-full animate-spin"
              style={{ border: '2px solid var(--border-subtle)', borderTopColor: '#4F46E5' }}
            />
            Loading settings…
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">

            {/* Store Information */}
            <div className="content-card overflow-hidden">
              <div
                className="flex items-center gap-3 px-6 py-4"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(79,70,229,0.10)' }}
                >
                  <Store className="w-4 h-4" style={{ color: '#4F46E5' }} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Store Information</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Basic details displayed on receipts and the POS interface
                  </p>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label
                    htmlFor="settings-store-name"
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Store Name
                  </label>
                  <input
                    id="settings-store-name"
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    placeholder="e.g. Raft Flagship Store"
                    className="dark-input w-full px-3 py-2.5 text-sm"
                  />
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    Printed at the top of every receipt and shown in reports.
                  </p>
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3 h-3" />
                      Receipt Header
                    </span>
                  </label>
                  <textarea
                    id="settings-receipt-header"
                    rows={2}
                    value={receiptHeader}
                    onChange={e => setReceiptHeader(e.target.value)}
                    placeholder="e.g. Thank you for visiting!"
                    className="dark-input w-full px-3 py-2.5 text-sm"
                  />
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    Appears at the top of the printed receipt, below the store name.
                  </p>
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3 h-3" />
                      Receipt Footer
                    </span>
                  </label>
                  <textarea
                    id="settings-receipt-footer"
                    rows={2}
                    value={receiptFooter}
                    onChange={e => setReceiptFooter(e.target.value)}
                    placeholder="e.g. No returns without receipt."
                    className="dark-input w-full px-3 py-2.5 text-sm"
                  />
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    Closing message or policy text printed at the bottom of each receipt.
                  </p>
                </div>
              </div>
            </div>

            {/* Tax & Currency */}
            <div className="content-card overflow-hidden">
              <div
                className="flex items-center gap-3 px-6 py-4"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(22,163,74,0.10)' }}
                >
                  <Percent className="w-4 h-4" style={{ color: '#16a34a' }} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Tax &amp; Currency</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Applied to all sales unless overridden per product
                  </p>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="settings-tax-rate"
                      className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Tax Rate (%)
                    </label>
                    <input
                      id="settings-tax-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      inputMode="decimal"
                      value={globalTaxRate}
                      onChange={e => setGlobalTaxRate(Number(e.target.value))}
                      className="dark-input w-full px-3 py-2.5 text-sm tabular-nums"
                    />
                    <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                      Global VAT applied to taxable items (e.g. 12 for 12%).
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="settings-currency"
                      className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Currency Symbol
                    </label>
                    <input
                      id="settings-currency"
                      value={currencySymbol}
                      onChange={e => setCurrencySymbol(e.target.value)}
                      maxLength={3}
                      placeholder="₱"
                      className="dark-input w-full px-3 py-2.5 text-sm"
                    />
                    <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                      Shown before all monetary values (max 3 chars).
                    </p>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="settings-low-stock"
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Default Low Stock Threshold
                  </label>
                  <input
                    id="settings-low-stock"
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={lowStockDefaultThreshold}
                    onChange={e => setLowStockDefaultThreshold(Number(e.target.value))}
                    className="dark-input w-full px-3 py-2.5 text-sm tabular-nums"
                  />
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    Products at or below this quantity will appear in low stock alerts on the dashboard.
                  </p>
                </div>
              </div>
            </div>

            {/* Terminal */}
            <div className="content-card overflow-hidden">
              <div
                className="flex items-center gap-3 px-6 py-4"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(180,83,9,0.10)' }}
                >
                  <Monitor className="w-4 h-4" style={{ color: '#b45309' }} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Terminal Identity</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Identifies this machine in transaction logs and reports
                  </p>
                </div>
              </div>
              <div className="p-6">
                <div>
                  <label
                    htmlFor="settings-terminal-id"
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Terminal ID
                  </label>
                  <input
                    id="settings-terminal-id"
                    value={terminalId}
                    onChange={e => setTerminalId(e.target.value)}
                    placeholder="e.g. T01"
                    className="dark-input w-full px-3 py-2.5 text-sm font-mono"
                  />
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    A short, unique identifier for this POS terminal. Changes take effect on next launch.
                  </p>
                </div>
              </div>
            </div>

            {/* Feedback messages */}
            {error && (
              <div
                className="flex items-center gap-3 p-4 text-sm rounded-xl"
                style={{
                  background: 'rgba(220,38,38,0.06)',
                  border: '1px solid rgba(220,38,38,0.15)',
                  color: '#dc2626'
                }}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            {saved && (
              <div
                className="flex items-center gap-3 p-4 text-sm rounded-xl"
                style={{
                  background: 'rgba(22,163,74,0.08)',
                  border: '1px solid rgba(22,163,74,0.20)',
                  color: '#16a34a'
                }}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Settings saved successfully.
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                All changes are applied immediately unless otherwise noted.
              </p>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? 'Saving…' : 'Save Settings'}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  )
}
