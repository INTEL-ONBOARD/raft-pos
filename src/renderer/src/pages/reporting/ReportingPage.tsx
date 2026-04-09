import { useState } from 'react'
import {
  ChartBarSquareIcon,
  ArrowDownTrayIcon,
  TableCellsIcon,
  FunnelIcon,
  PlayIcon,
  DocumentTextIcon,
  PresentationChartLineIcon,
  BanknotesIcon,
  CubeIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../stores/auth.store'
import { PERMISSIONS } from '@shared/types/permissions'
import {
  useSalesSummary,
  useSalesByProduct,
  useInventoryValuation,
  useCashDrawerReport,
  useExportExcel,
  useExportPdf
} from '../../hooks/useReporting'
import { useSettings } from '../../hooks/useSettings'
import type { ReportFilters, ReportType } from '@shared/types/reporting.types'

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const REPORT_TYPES: { value: ReportType; label: string; icon: React.ReactNode }[] = [
  { value: 'sales_summary', label: 'Sales Summary', icon: <PresentationChartLineIcon style={{ width: 16 }} /> },
  { value: 'sales_by_product', label: 'Sales by Product', icon: <ChartBarSquareIcon style={{ width: 16 }} /> },
  { value: 'inventory_valuation', label: 'Inventory Valuation', icon: <CubeIcon style={{ width: 16 }} /> },
  { value: 'cash_drawer_report', label: 'Cash Drawer Report', icon: <BanknotesIcon style={{ width: 16 }} /> }
]

function TH({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
   return (
      <th style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.28)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 14px', textAlign: align, borderBottom: '1px solid rgba(255,255,255,0.055)', whiteSpace: 'nowrap' }}>
         <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' }}>
            {children}
         </span>
      </th>
   )
}

const tdBase: React.CSSProperties = { padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px', color: 'rgba(255,255,255,0.65)' }
const tdLast: React.CSSProperties = { padding: '12px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.65)' }

export default function ReportingPage() {
  const role = useAuthStore((s) => s.role)
  const canExport = role?.permissions.includes(PERMISSIONS.CAN_EXPORT_REPORTS) ?? false
  const canViewAll = role?.permissions.includes(PERMISSIONS.CAN_VIEW_ALL_BRANCHES) ?? false
  const { settingsQuery } = useSettings()
  const currency = settingsQuery.data?.currencySymbol ?? '₱'

  const today = new Date().toISOString().slice(0, 10)
  const monthStart = today.slice(0, 8) + '01'
  const [reportType, setReportType] = useState<ReportType>('sales_summary')
  const [dateFrom, setDateFrom] = useState(monthStart)
  const [dateTo, setDateTo] = useState(today)
  const [branchId, setBranchId] = useState('')
  const [activeFilters, setActiveFilters] = useState<ReportFilters | null>(null)
  const [exportError, setExportError] = useState('')

  const salesSummaryQuery = useSalesSummary(activeFilters?.reportType === 'sales_summary' ? activeFilters : null)
  const salesByProductQuery = useSalesByProduct(activeFilters?.reportType === 'sales_by_product' ? activeFilters : null)
  const inventoryQuery = useInventoryValuation(activeFilters?.reportType === 'inventory_valuation' ? activeFilters : null)
  const drawerReportQuery = useCashDrawerReport(activeFilters?.reportType === 'cash_drawer_report' ? activeFilters : null)

  const exportExcel = useExportExcel()
  const exportPdf = useExportPdf()

  function handleRun() {
    setExportError('')
    setActiveFilters({ reportType, dateFrom, dateTo, ...(canViewAll && branchId ? { branchId } : {}) })
  }

  function buildExportPayload(filters: ReportFilters) {
    if (filters.reportType === 'sales_summary') {
      const rows = salesSummaryQuery.data?.data ?? []
      return {
        filters, title: 'Sales Summary',
        headers: ['Date', 'Transactions', 'Items Sold', 'Revenue', 'Tax', 'Discount', 'Net Revenue'],
        rows: rows.map(r => [r.date, r.transactions, r.itemsSold, r.revenue, r.tax, r.discount, r.netRevenue])
      }
    }
    if (filters.reportType === 'sales_by_product') {
      const rows = salesByProductQuery.data?.data ?? []
      return {
        filters, title: 'Sales by Product',
        headers: ['SKU', 'Name', 'Units Sold', 'Revenue', 'COGS', 'Gross Profit'],
        rows: rows.map(r => [r.sku, r.name, r.unitsSold, r.revenue, r.cogs, r.grossProfit])
      }
    }
    if (filters.reportType === 'inventory_valuation') {
      const rows = inventoryQuery.data?.data ?? []
      return {
        filters, title: 'Inventory Valuation',
        headers: ['SKU', 'Name', 'Category', 'Qty', 'Cost Price', 'Total Value'],
        rows: rows.map(r => [r.sku, r.name, r.category, r.quantity, r.costPrice, r.totalValue])
      }
    }
    const rows = drawerReportQuery.data?.data ?? []
    return {
      filters, title: 'Cash Drawer Report',
      headers: ['Opened At', 'Closed At', 'Cashier', 'Opening', 'Total Sales', 'Expected', 'Closing', 'Variance', 'Status'],
      rows: rows.map(r => [r.openedAt, r.closedAt ?? '', r.cashierName, r.openingCash, r.totalSales, r.expectedCash ?? '', r.closingCash ?? '', r.variance ?? '', r.status])
    }
  }

  async function handleExportExcel() {
    if (!activeFilters) return
    setExportError('')
    try { await exportExcel.mutateAsync(buildExportPayload(activeFilters)) }
    catch (err: any) { setExportError(err.message ?? 'Export failed') }
  }

  async function handleExportPdf() {
    if (!activeFilters) return
    setExportError('')
    try { await exportPdf.mutateAsync(buildExportPayload(activeFilters)) }
    catch (err: any) { setExportError(err.message ?? 'Export failed') }
  }

  const isLoading = (activeFilters?.reportType === 'sales_summary' && salesSummaryQuery.isFetching) ||
                    (activeFilters?.reportType === 'sales_by_product' && salesByProductQuery.isFetching) ||
                    (activeFilters?.reportType === 'inventory_valuation' && inventoryQuery.isFetching) ||
                    (activeFilters?.reportType === 'cash_drawer_report' && drawerReportQuery.isFetching)

  function RightPanel() {
      return (
         <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 0' }}>
            <div style={{ padding: '0 20px 20px' }}>
               <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FunnelIcon style={{ width: 14 }} /> Report Configuration
               </h3>
               <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>Set parameters and generate</p>
            </div>

            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
               <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '10px' }}>Report Type</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                     {REPORT_TYPES.map(rt => {
                        const isSel = reportType === rt.value
                        return (
                           <button key={rt.value} onClick={() => setReportType(rt.value)}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 120ms', width: '100%', textAlign: 'left',
                                       background: isSel ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                                       border: isSel ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.05)',
                                       color: isSel ? '#818cf8' : 'rgba(255,255,255,0.6)' }}>
                              {rt.icon} {rt.label}
                           </button>
                        )
                     })}
                  </div>
               </div>

               <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '10px' }}>Filters</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     {reportType !== 'inventory_valuation' && (
                        <>
                           <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}><CalendarDaysIcon style={{ width: 12 }} /> Start Date</div>
                              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                                 style={{ width: '100%', padding: '8px 10px', fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                           </div>
                           <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}><CalendarDaysIcon style={{ width: 12 }} /> End Date</div>
                              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                                 style={{ width: '100%', padding: '8px 10px', fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                           </div>
                        </>
                     )}
                     {canViewAll && (
                        <div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}><BuildingOfficeIcon style={{ width: 12 }} /> Branch Filter</div>
                           <input type="text" value={branchId} onChange={(e) => setBranchId(e.target.value)} placeholder="Leave blank for all"
                              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                        </div>
                     )}
                  </div>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={handleRun} disabled={isLoading} style={{ width: '100%', padding: '12px', background: '#4f46e5', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                     <PlayIcon style={{ width: 16 }} /> {isLoading ? 'Generating Data...' : 'Run Report'}
                  </button>

                  <div style={{ display: 'flex', gap: '8px', opacity: activeFilters ? 1 : 0.4, pointerEvents: activeFilters ? 'auto' : 'none' }}>
                     {canExport && (
                        <>
                           <button onClick={handleExportExcel} disabled={exportExcel.isPending || isLoading} style={{ flex: 1, padding: '10px', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '10px', color: '#4ade80', fontWeight: 500, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                              <TableCellsIcon style={{ width: 14 }} /> Excel
                           </button>
                           <button onClick={handleExportPdf} disabled={exportPdf.isPending || isLoading} style={{ flex: 1, padding: '10px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '10px', color: '#f87171', fontWeight: 500, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                              <ArrowDownTrayIcon style={{ width: 14 }} /> PDF
                           </button>
                        </>
                     )}
                  </div>
                  {exportError && <p style={{ fontSize: '12px', color: '#f87171', margin: '4px 0 0', textAlign: 'center' }}>{exportError}</p>}
               </div>
            </div>
         </div>
      )
  }

  // Report specific tables
  function renderSalesSummary() {
    const data = salesSummaryQuery.data
    const rows = data?.data ?? []
    const totals = data?.totals
    return (
       <>
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
               <tr>
                  <TH>Date</TH>
                  <TH align="right">Txns</TH>
                  <TH align="right">Items Sold</TH>
                  <TH align="right">Revenue</TH>
                  <TH align="right">Tax</TH>
                  <TH align="right">Discount</TH>
                  <TH align="right">Net Revenue</TH>
               </tr>
            </thead>
            <tbody>
               {rows.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '60px 24px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>No data for the selected period.</td></tr>
               ) : (
                  rows.map((r: any, i: number) => {
                     const isLast = i === rows.length - 1 && !totals
                     const td = isLast ? tdLast : tdBase
                     return (
                        <tr key={i} style={{ background: 'transparent' }}>
                           <td style={{ ...td, color: 'rgba(255,255,255,0.6)' }}>{r.date}</td>
                           <td style={{ ...td, textAlign: 'right' }}>{r.transactions}</td>
                           <td style={{ ...td, textAlign: 'right' }}>{r.itemsSold}</td>
                           <td style={{ ...td, textAlign: 'right' }}>{currency}{fmt(r.revenue)}</td>
                           <td style={{ ...td, textAlign: 'right' }}>{currency}{fmt(r.tax)}</td>
                           <td style={{ ...td, textAlign: 'right' }}>{currency}{fmt(r.discount)}</td>
                           <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{currency}{fmt(r.netRevenue)}</td>
                        </tr>
                     )
                  })
               )}
            </tbody>
            {totals && rows.length > 0 && (
               <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
                  <tr style={{ background: 'rgba(99,102,241,0.1)', borderTop: '1px solid rgba(99,102,241,0.3)', color: '#fff', fontWeight: 600 }}>
                     <td style={{ padding: '12px 14px' }}>Total</td>
                     <td style={{ padding: '12px 14px', textAlign: 'right' }}>{totals.transactions}</td>
                     <td style={{ padding: '12px 14px', textAlign: 'right' }}>{totals.itemsSold}</td>
                     <td style={{ padding: '12px 14px', textAlign: 'right' }}>{currency}{fmt(totals.revenue)}</td>
                     <td style={{ padding: '12px 14px', textAlign: 'right' }}>{currency}{fmt(totals.tax)}</td>
                     <td style={{ padding: '12px 14px', textAlign: 'right' }}>{currency}{fmt(totals.discount)}</td>
                     <td style={{ padding: '12px 14px', textAlign: 'right', color: '#10b981' }}>{currency}{fmt(totals.netRevenue)}</td>
                  </tr>
               </tfoot>
            )}
         </table>
       </>
    )
  }

  function renderSalesByProduct() {
      const rows = salesByProductQuery.data?.data ?? []
      return (
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
               <tr>
                  <TH>SKU</TH>
                  <TH>Product Name</TH>
                  <TH align="right">Units Sold</TH>
                  <TH align="right">Revenue</TH>
                  <TH align="right">COGS</TH>
                  <TH align="right">Gross Profit</TH>
               </tr>
            </thead>
            <tbody>
               {rows.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '60px 24px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>No data for the selected period.</td></tr>
               ) : (
                  rows.map((r: any, i: number) => {
                     const isLast = i === rows.length - 1
                     const td = isLast ? tdLast : tdBase
                     const profitPos = r.grossProfit >= 0
                     return (
                        <tr key={i}>
                           <td style={{ ...td, fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{r.sku}</td>
                           <td style={{ ...td, color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>{r.name}</td>
                           <td style={{ ...td, textAlign: 'right' }}>{r.unitsSold}</td>
                           <td style={{ ...td, textAlign: 'right' }}>{currency}{fmt(r.revenue)}</td>
                           <td style={{ ...td, textAlign: 'right' }}>{currency}{fmt(r.cogs)}</td>
                           <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: profitPos ? '#10b981' : '#f87171' }}>{currency}{fmt(r.grossProfit)}</td>
                        </tr>
                     )
                  })
               )}
            </tbody>
         </table>
      )
  }

  function renderInventoryValuation() {
      const data = inventoryQuery.data
      const rows = data?.data ?? []
      const totalValue = data?.totalValue ?? 0
      return (
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
               <tr>
                  <TH>SKU</TH>
                  <TH>Name</TH>
                  <TH>Category</TH>
                  <TH align="right">Qty in Stock</TH>
                  <TH align="right">Unit Cost</TH>
                  <TH align="right">Total Value</TH>
               </tr>
            </thead>
            <tbody>
               {rows.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '60px 24px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>No data.</td></tr>
               ) : (
                  rows.map((r: any, i: number) => {
                     const isLast = i === rows.length - 1
                     const td = isLast ? tdLast : tdBase
                     return (
                        <tr key={i}>
                           <td style={{ ...td, fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{r.sku}</td>
                           <td style={{ ...td, color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>{r.name}</td>
                           <td style={{ ...td, color: 'rgba(255,255,255,0.55)' }}>{r.category}</td>
                           <td style={{ ...td, textAlign: 'right' }}>{r.quantity}</td>
                           <td style={{ ...td, textAlign: 'right' }}>{currency}{fmt(r.costPrice)}</td>
                           <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: '#38bdf8' }}>{currency}{fmt(r.totalValue)}</td>
                        </tr>
                     )
                  })
               )}
            </tbody>
            {rows.length > 0 && (
               <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
                  <tr style={{ background: 'rgba(14,165,233,0.1)', borderTop: '1px solid rgba(14,165,233,0.3)', color: '#fff', fontWeight: 600 }}>
                     <td colSpan={5} style={{ padding: '12px 14px' }}>Total Inventory Asset Value</td>
                     <td style={{ padding: '12px 14px', textAlign: 'right', color: '#38bdf8' }}>{currency}{fmt(totalValue)}</td>
                  </tr>
               </tfoot>
            )}
         </table>
      )
  }

  function renderCashDrawer() {
      const rows = drawerReportQuery.data?.data ?? []
      return (
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
               <tr>
                  <TH>Opened At</TH>
                  <TH>Closed At</TH>
                  <TH>Cashier</TH>
                  <TH align="right">Opening</TH>
                  <TH align="right">Sales</TH>
                  <TH align="right">Expected</TH>
                  <TH align="right">Closing</TH>
                  <TH align="right">Variance</TH>
                  <TH align="center">Status</TH>
               </tr>
            </thead>
            <tbody>
               {rows.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: '60px 24px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>No data for the selected period.</td></tr>
               ) : (
                  rows.map((r: any, i: number) => {
                     const isLast = i === rows.length - 1
                     const td = isLast ? tdLast : tdBase
                     const varColor = r.variance === null ? 'inherit' : r.variance < 0 ? '#f87171' : r.variance > 0 ? '#fbbf24' : '#4ade80'
                     return (
                        <tr key={i}>
                           <td style={{ ...td, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{new Date(r.openedAt).toLocaleString()}</td>
                           <td style={{ ...td, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{r.closedAt ? new Date(r.closedAt).toLocaleString() : '—'}</td>
                           <td style={{ ...td, color: 'rgba(255,255,255,0.88)' }}>{r.cashierName}</td>
                           <td style={{ ...td, textAlign: 'right' }}>{currency}{fmt(r.openingCash)}</td>
                           <td style={{ ...td, textAlign: 'right', color: '#10b981' }}>{currency}{fmt(r.totalSales)}</td>
                           <td style={{ ...td, textAlign: 'right' }}>{r.expectedCash !== null ? `${currency}${fmt(r.expectedCash)}` : '—'}</td>
                           <td style={{ ...td, textAlign: 'right' }}>{r.closingCash !== null ? `${currency}${fmt(r.closingCash)}` : '—'}</td>
                           <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: varColor }}>
                              {r.variance !== null ? `${currency}${fmt(r.variance)}` : '—'}
                           </td>
                           <td style={{ ...td, textAlign: 'center' }}>
                              {r.status === 'open' ? (
                                 <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(34,197,94,0.1)', color: '#4ade80', fontSize: '10px', border: '1px solid rgba(34,197,94,0.2)', textTransform: 'uppercase' }}>Open</span>
                              ) : (
                                 <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontSize: '10px', border: '1px solid rgba(255,255,255,0.1)', textTransform: 'uppercase' }}>Closed</span>
                              )}
                           </td>
                        </tr>
                     )
                  })
               )}
            </tbody>
         </table>
      )
  }

  return (
    <div style={{ background: 'linear-gradient(160deg,#0a0b14 0%,#080810 100%)', display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-100px', left: '-80px', width: '600px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div style={{ flex: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,rgba(99,102,241,0.22) 0%,rgba(99,102,241,0.08) 100%)', border: '1px solid rgba(99,102,241,0.22)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChartBarSquareIcon style={{ width: '18px', height: '18px', color: '#818cf8' }} />
            </div>
            <div>
               <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Business Reports</h1>
               <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Analytics & Data Export</p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', padding: '0 28px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.065)', borderRadius: '16px', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            
            {!activeFilters ? (
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', height: '100%', padding: '60px', opacity: 0.6 }}>
                  <DocumentTextIcon style={{ width: 64, height: 64, color: 'rgba(255,255,255,0.2)' }} />
                  <p style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginTop: '20px', marginBottom: '8px' }}>No Report Generated</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: '300px' }}>Configure your report parameters in the sidebar and click "Run Report" to view data.</p>
               </div>
            ) : isLoading ? (
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Fetching data...</p>
               </div>
            ) : (
               <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                  {activeFilters.reportType === 'sales_summary' && renderSalesSummary()}
                  {activeFilters.reportType === 'sales_by_product' && renderSalesByProduct()}
                  {activeFilters.reportType === 'inventory_valuation' && renderInventoryValuation()}
                  {activeFilters.reportType === 'cash_drawer_report' && renderCashDrawer()}
               </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ width: '1px', background: 'rgba(255,255,255,0.07)', flexShrink: 0, position: 'relative', zIndex: 1 }} />

      <div style={{ flex: 1, minWidth: '260px', maxWidth: '320px', overflowY: 'auto', position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.15)' }}>
        <RightPanel />
      </div>

    </div>
  )
}
