// src/renderer/src/pages/settings/SettingsPage.tsx
import { useState, useEffect } from 'react'
import {
  BuildingStorefrontIcon,
  CalculatorIcon,
  ComputerDesktopIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  PercentBadgeIcon,
  Cog6ToothIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline'
import { useSettings } from '../../hooks/useSettings'
import { BranchesTab } from './BranchesTab'

type Tab = 'general' | 'branches'

export default function SettingsPage() {
  const { settingsQuery, updateMutation } = useSettings()
  const settings = settingsQuery.data
  const [activeTab, setActiveTab] = useState<Tab>('general')

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
    <div
      style={{
        background: '#080810',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(ellipse 900px 600px at 20% 0%, rgba(124,58,237,0.10) 0%, transparent 70%)',
        }}
      />

      {/* Content wrapper */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        {/* Page header */}
        <div
          style={{
            padding: '28px 36px 20px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 38,
                height: 38,
                background: 'rgba(99,102,241,0.12)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Cog6ToothIcon style={{ width: 20, height: 20, color: '#818cf8' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Settings
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.40)',
                  margin: '2px 0 0 0',
                }}
              >
                Configure your store, tax rules, and terminal identity
              </p>
            </div>
          </div>

          {/* Header action button — changes per tab */}
          {activeTab === 'general' && (
            <button
              type="submit"
              form="settings-form"
              disabled={updateMutation.isPending}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', fontSize: 14, fontWeight: 600, opacity: updateMutation.isPending ? 0.5 : 1 }}
            >
              <CheckIcon style={{ width: 16, height: 16 }} />
              {updateMutation.isPending ? 'Saving…' : 'Save Settings'}
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div style={{ padding: '0 36px', marginBottom: '4px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '0' }}>
            {([
              { key: 'general',  label: 'General',  Icon: Cog6ToothIcon },
              { key: 'branches', label: 'Branches', Icon: BuildingOffice2Icon },
            ] as { key: Tab; label: string; Icon: React.ElementType }[]).map(({ key, label, Icon }) => {
              const active = activeTab === key
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '9px 14px', fontSize: '13px', fontWeight: active ? 600 : 500,
                    color: active ? '#ffffff' : 'rgba(255,255,255,0.40)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
                    marginBottom: '-1px', transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.70)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.40)' }}
                >
                  <Icon style={{ width: '15px', height: '15px' }} />
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content area */}
        <div style={{ padding: '20px 36px 36px', flex: 1 }}>
          {activeTab === 'branches' ? (
            <BranchesTab />
          ) : settingsQuery.isLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 14,
                color: 'rgba(255,255,255,0.40)',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.12)',
                  borderTopColor: '#4F46E5',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Loading settings…
            </div>
          ) : (
            <form id="settings-form" onSubmit={handleSave}>

              {/* Store Information */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  padding: 24,
                  marginBottom: 16,
                }}
              >
                {/* Section title row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: 'rgba(99,102,241,0.10)',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <BuildingStorefrontIcon style={{ width: 18, height: 18, color: '#818cf8' }} />
                  </div>
                  <div>
                    <h2
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.88)',
                        margin: 0,
                      }}
                    >
                      Store Information
                    </h2>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.38)',
                        margin: '2px 0 0 0',
                      }}
                    >
                      Basic details displayed on receipts and the POS interface
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div
                  style={{
                    height: 1,
                    background: 'rgba(255,255,255,0.06)',
                    margin: '16px 0',
                  }}
                />

                {/* Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label
                      htmlFor="settings-store-name"
                      style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.55)',
                        marginBottom: 6,
                      }}
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
                    <p
                      style={{
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.28)',
                        marginTop: 4,
                      }}
                    >
                      Printed at the top of every receipt and shown in reports.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="settings-receipt-header"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.55)',
                        marginBottom: 6,
                      }}
                    >
                      <DocumentTextIcon style={{ width: 14, height: 14 }} />
                      Receipt Header
                    </label>
                    <textarea
                      id="settings-receipt-header"
                      rows={2}
                      value={receiptHeader}
                      onChange={e => setReceiptHeader(e.target.value)}
                      placeholder="e.g. Thank you for visiting!"
                      className="dark-input w-full px-3 py-2.5 text-sm"
                    />
                    <p
                      style={{
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.28)',
                        marginTop: 4,
                      }}
                    >
                      Appears at the top of the printed receipt, below the store name.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="settings-receipt-footer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.55)',
                        marginBottom: 6,
                      }}
                    >
                      <DocumentTextIcon style={{ width: 14, height: 14 }} />
                      Receipt Footer
                    </label>
                    <textarea
                      id="settings-receipt-footer"
                      rows={2}
                      value={receiptFooter}
                      onChange={e => setReceiptFooter(e.target.value)}
                      placeholder="e.g. No returns without receipt."
                      className="dark-input w-full px-3 py-2.5 text-sm"
                    />
                    <p
                      style={{
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.28)',
                        marginTop: 4,
                      }}
                    >
                      Closing message or policy text printed at the bottom of each receipt.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tax & Currency */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  padding: 24,
                  marginBottom: 16,
                }}
              >
                {/* Section title row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: 'rgba(99,102,241,0.10)',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CalculatorIcon style={{ width: 18, height: 18, color: '#818cf8' }} />
                  </div>
                  <div>
                    <h2
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.88)',
                        margin: 0,
                      }}
                    >
                      Tax &amp; Currency
                    </h2>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.38)',
                        margin: '2px 0 0 0',
                      }}
                    >
                      Applied to all sales unless overridden per product
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div
                  style={{
                    height: 1,
                    background: 'rgba(255,255,255,0.06)',
                    margin: '16px 0',
                  }}
                />

                {/* Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label
                        htmlFor="settings-tax-rate"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'rgba(255,255,255,0.55)',
                          marginBottom: 6,
                        }}
                      >
                        <PercentBadgeIcon style={{ width: 14, height: 14 }} />
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
                      <p
                        style={{
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.28)',
                          marginTop: 4,
                        }}
                      >
                        Global VAT applied to taxable items (e.g. 12 for 12%).
                      </p>
                    </div>
                    <div>
                      <label
                        htmlFor="settings-currency"
                        style={{
                          display: 'block',
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'rgba(255,255,255,0.55)',
                          marginBottom: 6,
                        }}
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
                      <p
                        style={{
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.28)',
                          marginTop: 4,
                        }}
                      >
                        Shown before all monetary values (max 3 chars).
                      </p>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="settings-low-stock"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.55)',
                        marginBottom: 6,
                      }}
                    >
                      <ExclamationTriangleIcon style={{ width: 14, height: 14 }} />
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
                    <p
                      style={{
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.28)',
                        marginTop: 4,
                      }}
                    >
                      Products at or below this quantity will appear in low stock alerts on the dashboard.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terminal Identity */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  padding: 24,
                  marginBottom: 16,
                }}
              >
                {/* Section title row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: 'rgba(99,102,241,0.10)',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ComputerDesktopIcon style={{ width: 18, height: 18, color: '#818cf8' }} />
                  </div>
                  <div>
                    <h2
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.88)',
                        margin: 0,
                      }}
                    >
                      Terminal Identity
                    </h2>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.38)',
                        margin: '2px 0 0 0',
                      }}
                    >
                      Identifies this machine in transaction logs and reports
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div
                  style={{
                    height: 1,
                    background: 'rgba(255,255,255,0.06)',
                    margin: '16px 0',
                  }}
                />

                {/* Fields */}
                <div>
                  <label
                    htmlFor="settings-terminal-id"
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.55)',
                      marginBottom: 6,
                    }}
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
                  <p
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.28)',
                      marginTop: 4,
                    }}
                  >
                    A short, unique identifier for this POS terminal. Changes take effect immediately on save.
                  </p>
                </div>
              </div>

              {/* Feedback messages */}
              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 16,
                    fontSize: 14,
                    borderRadius: 12,
                    background: 'rgba(220,38,38,0.06)',
                    border: '1px solid rgba(220,38,38,0.15)',
                    color: '#dc2626',
                    marginBottom: 16,
                  }}
                >
                  <ExclamationTriangleIcon style={{ width: 16, height: 16, flexShrink: 0 }} />
                  {error}
                </div>
              )}
              {saved && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 16,
                    fontSize: 14,
                    borderRadius: 12,
                    background: 'rgba(22,163,74,0.08)',
                    border: '1px solid rgba(22,163,74,0.20)',
                    color: '#16a34a',
                    marginBottom: 16,
                  }}
                >
                  <CheckIcon style={{ width: 16, height: 16, flexShrink: 0 }} />
                  Settings saved successfully.
                </div>
              )}

              {/* Bottom submit row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 4,
                }}
              >
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>
                  All changes are applied immediately unless otherwise noted.
                </p>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 24px',
                    fontSize: 14,
                    fontWeight: 600,
                    opacity: updateMutation.isPending ? 0.5 : 1,
                  }}
                >
                  <CheckIcon style={{ width: 16, height: 16 }} />
                  {updateMutation.isPending ? 'Saving…' : 'Save Settings'}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  )
}
