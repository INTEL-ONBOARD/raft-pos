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
  LockClosedIcon,
  ArchiveBoxIcon,
  PrinterIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'
import { useSettings } from '../../hooks/useSettings'
import { BranchesTab } from './BranchesTab'

type Tab = 'general' | 'operations' | 'hardware' | 'branches'

export default function SettingsPage() {
  const { settingsQuery, updateMutation } = useSettings()
  const settings = settingsQuery.data
  const [activeTab, setActiveTab] = useState<Tab>('general')

  // General States
  const [storeName, setStoreName] = useState('')
  const [receiptHeader, setReceiptHeader] = useState('')
  const [receiptFooter, setReceiptFooter] = useState('')
  const [globalTaxRate, setGlobalTaxRate] = useState(12)
  const [currencySymbol, setCurrencySymbol] = useState('₱')

  // Operations States
  const [lowStockDefaultThreshold, setLowStockDefaultThreshold] = useState(10)
  const [requireShiftForSales, setRequireShiftForSales] = useState(true)
  const [allowNegativeInventory, setAllowNegativeInventory] = useState(false)

  // Hardware States
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(false)
  const [printerWidth, setPrinterWidth] = useState<'58mm' | '80mm'>('80mm')
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
      setRequireShiftForSales(settings.requireShiftForSales ?? true)
      setAllowNegativeInventory(settings.allowNegativeInventory ?? false)
      setAutoPrintReceipt(settings.autoPrintReceipt ?? false)
      setPrinterWidth(settings.printerWidth ?? '80mm')
      setTerminalId(settings.terminalId)
    }
  }, [settings])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    try {
      await updateMutation.mutateAsync({
        storeName,
        receiptHeader,
        receiptFooter,
        globalTaxRate,
        currencySymbol,
        lowStockDefaultThreshold,
        requireShiftForSales,
        allowNegativeInventory,
        autoPrintReceipt,
        printerWidth,
        terminalId
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message ?? 'Failed to save settings')
    }
  }

  const TABS: { key: Tab; label: string; desc: string; icon: any }[] = [
    { key: 'general', label: 'General', desc: 'Store info, taxes, & currency', icon: BuildingStorefrontIcon },
    { key: 'operations', label: 'Operations & Sales', desc: 'POS flow & restrictions', icon: LockClosedIcon },
    { key: 'hardware', label: 'Hardware', desc: 'Printers & terminal identity', icon: ComputerDesktopIcon },
    { key: 'branches', label: 'Branches', desc: 'Manage multi-location setup', icon: BuildingOffice2Icon }
  ]

  return (
    <div style={{ background: '#080810', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 800px 500px at 20% 0%, rgba(99,102,241,0.06) 0%, transparent 60%)' }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {/* Page header */}
        <div style={{ padding: '28px 36px 20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 100%)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cog6ToothIcon style={{ width: 20, height: 20, color: '#818cf8' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>System Settings</h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', margin: '2px 0 0 0' }}>Configure global constraints, hardware, and localization</p>
            </div>
          </div>

          {activeTab !== 'branches' && (
            <button form="settings-form" type="submit" disabled={updateMutation.isPending} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, opacity: updateMutation.isPending ? 0.5 : 1 }}>
              <CheckIcon style={{ width: 16 }} /> {updateMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </button>
          )}
        </div>

        {/* Layout Row */}
        <div style={{ display: 'flex', flex: 1, padding: '0 16px 0 36px', overflow: 'hidden' }}>
           
          {/* Vertical Sidebar */}
          <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px', borderRight: '1px solid rgba(255,255,255,0.06)', paddingRight: '24px', paddingTop: '24px', overflowY: 'auto', paddingBottom: '24px' }}>
             {TABS.map(tab => {
                const active = activeTab === tab.key
                const Icon = tab.icon
                return (
                   <button key={tab.key} onClick={() => setActiveTab(tab.key)} 
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', borderRadius: '12px', background: active ? 'rgba(99,102,241,0.1)' : 'transparent', border: '1px solid', borderColor: active ? 'rgba(99,102,241,0.2)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                      <Icon style={{ width: 18, height: 18, color: active ? '#818cf8' : 'rgba(255,255,255,0.4)', marginTop: '2px' }} />
                      <div>
                         <p style={{ fontSize: '13px', fontWeight: 600, color: active ? '#a5b4fc' : '#dedede', margin: '0 0 2px' }}>{tab.label}</p>
                         <p style={{ fontSize: '11px', color: active ? 'rgba(165,180,252,0.7)' : 'rgba(255,255,255,0.3)', margin: 0, lineHeight: 1.3 }}>{tab.desc}</p>
                      </div>
                   </button>
                )
             })}
          </div>

          {/* Context Panel right side */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
             {settingsQuery.isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Loading configuration...</div>
             ) : activeTab === 'branches' ? (
                <BranchesTab />
             ) : (
                <form id="settings-form" onSubmit={handleSave} style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                   
                   {error && <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, fontSize: 13, borderRadius: 10, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', color: '#dc2626' }}><ExclamationTriangleIcon style={{ width: 16 }} />{error}</div>}
                   {saved && <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, fontSize: 13, borderRadius: 10, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', color: '#4ade80' }}><CheckIcon style={{ width: 16 }} />Settings saved successfully.</div>}

                   {/* GENERAL TAB */}
                   <div style={{ display: activeTab === 'general' ? 'block' : 'none' }}>
                      <div style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
                         <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Store Information</h2>
                         <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>Basic details used on your localized terminal.</p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
                         <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Store Name</label>
                            <input value={storeName} onChange={e => setStoreName(e.target.value)} className="dark-input w-full" placeholder="Raft Flagship Store" />
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Printed across receipts and operational emails.</p>
                         </div>
                         <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Receipt Header Text</label>
                            <textarea rows={2} value={receiptHeader} onChange={e => setReceiptHeader(e.target.value)} className="dark-input w-full" placeholder="e.g. Thank you for visiting!" />
                         </div>
                         <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Receipt Footer Policy</label>
                            <textarea rows={2} value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} className="dark-input w-full" placeholder="e.g. No returns without receipt." />
                         </div>
                      </div>

                      <div style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
                         <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Tax & Currency</h2>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                         <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Tax Rate (%)</label>
                            <input type="number" step="0.01" value={globalTaxRate} onChange={e => setGlobalTaxRate(Number(e.target.value))} className="dark-input w-full" />
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Fallback VAT % for taxable items.</p>
                         </div>
                         <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Currency Symbol</label>
                            <input maxLength={3} value={currencySymbol} onChange={e => setCurrencySymbol(e.target.value)} className="dark-input w-full" />
                         </div>
                      </div>
                   </div>

                   {/* OPERATIONS TAB */}
                   <div style={{ display: activeTab === 'operations' ? 'block' : 'none' }}>
                      <div style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
                         <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Sales Regulations</h2>
                         <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>Enforce strict flow rules for checkout and shifts.</p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
                         <label style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', cursor: 'pointer', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                            <input type="checkbox" checked={requireShiftForSales} onChange={e => setRequireShiftForSales(e.target.checked)} style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#6366f1' }} />
                            <div>
                               <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>Require Open Cash Drawer</p>
                               <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>Cashiers cannot complete transactions if a shift drawer has not been opened yet.</p>
                            </div>
                         </label>
                         
                         <label style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', cursor: 'pointer', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                            <input type="checkbox" checked={allowNegativeInventory} onChange={e => setAllowNegativeInventory(e.target.checked)} style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#6366f1' }} />
                            <div>
                               <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>Allow Negative Inventory Checkout</p>
                               <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>If enabled, permits selling products even when computed stock is 0 or less.</p>
                            </div>
                         </label>
                      </div>

                      <div style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
                         <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Thresholds</h2>
                      </div>
                      
                      <div>
                         <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Low Stock Warning Limit</label>
                         <input type="number" min="0" value={lowStockDefaultThreshold} onChange={e => setLowStockDefaultThreshold(Number(e.target.value))} className="dark-input w-full" style={{ maxWidth: '200px' }} />
                         <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Products reaching this stock will be flagged on the dashboard.</p>
                      </div>
                   </div>

                   {/* HARDWARE TAB */}
                   <div style={{ display: activeTab === 'hardware' ? 'block' : 'none' }}>
                      <div style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
                         <span style={{ padding: '3px 8px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: '10px', fontWeight: 700, borderRadius: '6px', textTransform: 'uppercase', marginBottom: '8px', display: 'inline-block' }}>Local Configuration</span>
                         <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Terminal Setup</h2>
                         <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>Assign identity to this specific tablet or desktop.</p>
                      </div>

                      <div style={{ marginBottom: '40px' }}>
                         <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Terminal ID</label>
                         <input value={terminalId} onChange={e => setTerminalId(e.target.value)} className="dark-input w-full font-mono" placeholder="T01" style={{ maxWidth: '300px' }} />
                         <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Changes apply immediately. Receipts strictly link to this local ID.</p>
                      </div>

                      <div style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
                         <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Printers & Receipts</h2>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                         <label style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', cursor: 'pointer', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                            <input type="checkbox" checked={autoPrintReceipt} onChange={e => setAutoPrintReceipt(e.target.checked)} style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#6366f1' }} />
                            <div>
                               <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>Auto-Print on Checkout</p>
                               <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>Send the receipt straight to your configured IP/USB printer without showing the manual view modal.</p>
                            </div>
                         </label>

                         <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Receipt Printer Roll Width</label>
                            <select value={printerWidth} onChange={e => setPrinterWidth(e.target.value as any)} className="dark-input w-full" style={{ maxWidth: '200px' }}>
                               <option value="58mm">58mm (Narrow)</option>
                               <option value="80mm">80mm (Standard)</option>
                            </select>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Impacts the CSS grid metrics sent to the printer.</p>
                         </div>
                      </div>
                   </div>

                </form>
             )}
          </div>
        </div>
      </div>
    </div>
  )
}
