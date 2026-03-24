// src/renderer/src/pages/reporting/ReportingPage.tsx
import { useState } from 'react'
import { ChartBarSquareIcon, ArrowDownTrayIcon, TableCellsIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../../stores/auth.store'
import { PERMISSIONS } from '@shared/types/permissions'
import {
  useSalesSummary,
  useSalesByProduct,
  useInventoryValuation,
  useCashDrawerReport,
  useExportExcel,
  useExportPdf,
} from '../../hooks/useReporting'
import { useSettings } from '../../hooks/useSettings'
import type { ReportFilters, ReportType } from '@shared/types/reporting.types'

function fmt(n: number) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'sales_summary', label: 'Sales Summary' },
  { value: 'sales_by_product', label: 'Sales by Product' },
  { value: 'inventory_valuation', label: 'Inventory Valuation' },
  { value: 'cash_drawer_report', label: 'Cash Drawer Report' },
]

export default function ReportingPage() {
  const role = useAuthStore(s => s.role)
  const canExport = role?.permissions.includes(PERMISSIONS.CAN_EXPORT_REPORTS) ?? false
  const canViewAll = role?.permissions.includes(PERMISSIONS.CAN_VIEW_ALL_BRANCHES) ?? false
  const { settingsQuery } = useSettings()
  const currencySymbol = settingsQuery.data?.currencySymbol ?? '₱'

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
    setActiveFilters({
      reportType,
      dateFrom,
      dateTo,
      ...(canViewAll && branchId ? { branchId } : {}),
    })
  }

  function buildExportPayload(filters: ReportFilters) {
    if (filters.reportType === 'sales_summary') {
      const rows = salesSummaryQuery.data?.data ?? []
      return {
        filters,
        title: 'Sales Summary',
        headers: ['Date', 'Transactions', 'Items Sold', 'Revenue', 'Tax', 'Discount', 'Net Revenue'],
        rows: rows.map(r => [r.date, r.transactions, r.itemsSold, r.revenue, r.tax, r.discount, r.netRevenue]),
      }
    }
    if (filters.reportType === 'sales_by_product') {
      const rows = salesByProductQuery.data?.data ?? []
      return {
        filters,
        title: 'Sales by Product',
        headers: ['SKU', 'Name', 'Units Sold', 'Revenue', 'COGS', 'Gross Profit'],
        rows: rows.map(r => [r.sku, r.name, r.unitsSold, r.revenue, r.cogs, r.grossProfit]),
      }
    }
    if (filters.reportType === 'inventory_valuation') {
      const rows = inventoryQuery.data?.data ?? []
      return {
        filters,
        title: 'Inventory Valuation',
        headers: ['SKU', 'Name', 'Category', 'Qty', 'Cost Price', 'Total Value'],
        rows: rows.map(r => [r.sku, r.name, r.category, r.quantity, r.costPrice, r.totalValue]),
      }
    }
    const rows = drawerReportQuery.data?.data ?? []
    return {
      filters,
      title: 'Cash Drawer Report',
      headers: ['Opened At', 'Closed At', 'Cashier', 'Opening', 'Total Sales', 'Expected', 'Closing', 'Variance', 'Status'],
      rows: rows.map(r => [
        r.openedAt, r.closedAt ?? '', r.cashierName,
        r.openingCash, r.totalSales, r.expectedCash ?? '',
        r.closingCash ?? '', r.variance ?? '', r.status,
      ]),
    }
  }

  async function handleExportExcel() {
    if (!activeFilters) return
    setExportError('')
    try {
      await exportExcel.mutateAsync(buildExportPayload(activeFilters))
    } catch (err: any) {
      setExportError(err.message ?? 'Export failed')
    }
  }

  async function handleExportPdf() {
    if (!activeFilters) return
    setExportError('')
    try {
      await exportPdf.mutateAsync(buildExportPayload(activeFilters))
    } catch (err: any) {
      setExportError(err.message ?? 'Export failed')
    }
  }

  const isLoading =
    (activeFilters?.reportType === 'sales_summary' && salesSummaryQuery.isFetching) ||
    (activeFilters?.reportType === 'sales_by_product' && salesByProductQuery.isFetching) ||
    (activeFilters?.reportType === 'inventory_valuation' && inventoryQuery.isFetching) ||
    (activeFilters?.reportType === 'cash_drawer_report' && drawerReportQuery.isFetching)

  const thStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    color: 'rgba(255,255,255,0.28)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '10px 16px',
    textAlign: 'left',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  }

  return (
    <div style={{ background: '#080810', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 900px 600px at 20% 0%, rgba(124,58,237,0.10) 0%, transparent 70%)' }} />

      {/* Content wrapper */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* Page header */}
        <div style={{ padding: '28px 36px 20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', background: 'rgba(99,102,241,0.12)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ChartBarSquareIcon style={{ width: '18px', height: '18px', color: '#a5b4fc' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>Reports</h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.40)', marginTop: '2px', marginBottom: 0 }}>Generate and export business reports</p>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div style={{ padding: '0 36px 36px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Report type tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {REPORT_TYPES.map(rt => (
              <button
                key={rt.value}
                onClick={() => setReportType(rt.value as ReportType)}
                style={reportType === rt.value
                  ? { height: '32px', borderRadius: '999px', padding: '0 14px', fontSize: '12px', fontWeight: 500, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.30)', color: '#a5b4fc', cursor: 'pointer' }
                  : { height: '32px', borderRadius: '999px', padding: '0 14px', fontSize: '12px', fontWeight: 500, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }}
              >
                {rt.label}
              </button>
            ))}
          </div>

          {/* Filter controls card */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
              {reportType !== 'inventory_valuation' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px', color: 'rgba(255,255,255,0.50)' }}>From</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className="dark-input"
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px', color: 'rgba(255,255,255,0.50)' }}>To</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className="dark-input"
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                    />
                  </div>
                </>
              )}

              {canViewAll && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px', color: 'rgba(255,255,255,0.50)' }}>Branch ID (optional)</label>
                  <input
                    type="text"
                    value={branchId}
                    onChange={e => setBranchId(e.target.value)}
                    placeholder="All branches"
                    inputMode="search"
                    className="dark-input"
                    style={{ padding: '8px 12px', fontSize: '13px', width: '160px' }}
                  />
                </div>
              )}

              <button
                onClick={handleRun}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
              >
                Run Report
              </button>

              {activeFilters && canExport && (
                <>
                  <button
                    onClick={handleExportExcel}
                    disabled={exportExcel.isPending || isLoading}
                    aria-label="Export report as Excel spreadsheet"
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', fontSize: '13px' }}
                  >
                    <TableCellsIcon style={{ width: '16px', height: '16px', color: '#16a34a' }} />
                    Excel
                  </button>
                  <button
                    onClick={handleExportPdf}
                    disabled={exportPdf.isPending || isLoading}
                    aria-label="Export report as PDF"
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', fontSize: '13px' }}
                  >
                    <ArrowDownTrayIcon style={{ width: '16px', height: '16px', color: '#dc2626' }} />
                    PDF
                  </button>
                </>
              )}
            </div>

            {exportError && (
              <p style={{ fontSize: '12px', marginTop: '12px', color: '#dc2626' }}>{exportError}</p>
            )}
          </div>

          {activeFilters && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden', overflowX: 'auto' }}>
              {isLoading ? (
                <div style={{ padding: '24px', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Loading report…</div>
              ) : activeFilters.reportType === 'sales_summary' ? (
                <SalesSummaryTable data={salesSummaryQuery.data} currency={currencySymbol} thStyle={thStyle} />
              ) : activeFilters.reportType === 'sales_by_product' ? (
                <SalesByProductTable data={salesByProductQuery.data?.data ?? []} currency={currencySymbol} thStyle={thStyle} />
              ) : activeFilters.reportType === 'inventory_valuation' ? (
                <InventoryValuationTable data={inventoryQuery.data} currency={currencySymbol} thStyle={thStyle} />
              ) : (
                <CashDrawerTable data={drawerReportQuery.data?.data ?? []} currency={currencySymbol} thStyle={thStyle} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const tdBase: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  fontSize: '13px',
  color: 'rgba(255,255,255,0.65)',
}

const tdLast: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '13px',
  color: 'rgba(255,255,255,0.65)',
}

function SalesSummaryTable({ data, currency, thStyle }: { data: any; currency: string; thStyle: React.CSSProperties }) {
  const rows = data?.data ?? []
  const totals = data?.totals
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={thStyle}>Date</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Transactions</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Items Sold</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Revenue</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Tax</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Discount</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Net Revenue</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={7} style={{ padding: '24px 16px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>No data for the selected period.</td></tr>
        ) : rows.map((r: any, i: number) => {
          const isLast = i === rows.length - 1 && !totals
          const td = isLast ? tdLast : tdBase
          return (
            <tr key={i}>
              <td style={{ ...td, color: 'rgba(255,255,255,0.55)' }}>{r.date}</td>
              <td style={{ ...td, textAlign: 'right' }}>{r.transactions}</td>
              <td style={{ ...td, textAlign: 'right' }}>{r.itemsSold}</td>
              <td style={{ ...td, textAlign: 'right' }}>{currency}{fmt(r.revenue)}</td>
              <td style={{ ...td, textAlign: 'right' }}>{currency}{fmt(r.tax)}</td>
              <td style={{ ...td, textAlign: 'right' }}>{currency}{fmt(r.discount)}</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 500, color: 'rgba(255,255,255,0.88)' }}>{currency}{fmt(r.netRevenue)}</td>
            </tr>
          )
        })}
        {totals && (
          <tr style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.88)', fontWeight: 600, fontSize: '12px' }}>
            <td style={{ padding: '10px 16px' }}>Total</td>
            <td style={{ padding: '10px 16px', textAlign: 'right' }}>{totals.transactions}</td>
            <td style={{ padding: '10px 16px', textAlign: 'right' }}>{totals.itemsSold}</td>
            <td style={{ padding: '10px 16px', textAlign: 'right' }}>{currency}{fmt(totals.revenue)}</td>
            <td style={{ padding: '10px 16px', textAlign: 'right' }}>{currency}{fmt(totals.tax)}</td>
            <td style={{ padding: '10px 16px', textAlign: 'right' }}>{currency}{fmt(totals.discount)}</td>
            <td style={{ padding: '10px 16px', textAlign: 'right' }}>{currency}{fmt(totals.netRevenue)}</td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

function SalesByProductTable({ data, currency, thStyle }: { data: any[]; currency: string; thStyle: React.CSSProperties }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={thStyle}>SKU</th>
          <th style={thStyle}>Name</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Units Sold</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Revenue</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>COGS</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Gross Profit</th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr><td colSpan={6} style={{ padding: '24px 16px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>No data for the selected period.</td></tr>
        ) : data.map((r, i) => {
          const isLast = i === data.length - 1
          const td = isLast ? tdLast : tdBase
          return (
            <tr key={i}>
              <td style={{ ...td, fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.40)' }}>{r.sku}</td>
              <td style={{ ...td, color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>{r.name}</td>
              <td style={{ ...td, textAlign: 'right' }}>{r.unitsSold}</td>
              <td style={{ ...td, textAlign: 'right' }}>{currency}{fmt(r.revenue)}</td>
              <td style={{ ...td, textAlign: 'right' }}>{currency}{fmt(r.cogs)}</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 500, color: r.grossProfit < 0 ? '#dc2626' : '#16a34a' }}>
                {currency}{fmt(r.grossProfit)}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function InventoryValuationTable({ data, currency, thStyle }: { data: any; currency: string; thStyle: React.CSSProperties }) {
  const rows = data?.data ?? []
  const totalValue = data?.totalValue ?? 0
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={thStyle}>SKU</th>
          <th style={thStyle}>Name</th>
          <th style={thStyle}>Category</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Qty</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Cost Price</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Total Value</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={6} style={{ padding: '24px 16px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>No data.</td></tr>
        ) : rows.map((r: any, i: number) => {
          const isLast = i === rows.length - 1 && rows.length === 0
          const td = isLast ? tdLast : tdBase
          return (
            <tr key={i}>
              <td style={{ ...td, fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.40)' }}>{r.sku}</td>
              <td style={{ ...td, color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>{r.name}</td>
              <td style={{ ...td, color: 'rgba(255,255,255,0.55)' }}>{r.category}</td>
              <td style={{ ...td, textAlign: 'right' }}>{r.quantity}</td>
              <td style={{ ...td, textAlign: 'right' }}>{currency}{fmt(r.costPrice)}</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 500, color: 'rgba(255,255,255,0.88)' }}>{currency}{fmt(r.totalValue)}</td>
            </tr>
          )
        })}
        {rows.length > 0 && (
          <tr style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.88)', fontWeight: 600, fontSize: '12px' }}>
            <td colSpan={5} style={{ padding: '10px 16px' }}>Total Inventory Value</td>
            <td style={{ padding: '10px 16px', textAlign: 'right' }}>{currency}{fmt(totalValue)}</td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

function CashDrawerTable({ data, currency, thStyle }: { data: any[]; currency: string; thStyle: React.CSSProperties }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={thStyle}>Opened At</th>
          <th style={thStyle}>Closed At</th>
          <th style={thStyle}>Cashier</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Opening</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Total Sales</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Expected</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Closing</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Variance</th>
          <th style={thStyle}>Status</th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr><td colSpan={9} style={{ padding: '24px 16px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>No data for the selected period.</td></tr>
        ) : data.map((r, i) => {
          const isLast = i === data.length - 1
          const td = isLast ? tdLast : tdBase
          return (
            <tr key={i}>
              <td style={{ ...td, fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>{new Date(r.openedAt).toLocaleString()}</td>
              <td style={{ ...td, fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>{r.closedAt ? new Date(r.closedAt).toLocaleString() : '—'}</td>
              <td style={{ ...td, color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>{r.cashierName}</td>
              <td style={{ ...td, textAlign: 'right' }}>{currency}{fmt(r.openingCash)}</td>
              <td style={{ ...td, textAlign: 'right' }}>{currency}{fmt(r.totalSales)}</td>
              <td style={{ ...td, textAlign: 'right' }}>{r.expectedCash !== null ? `${currency}${fmt(r.expectedCash)}` : '—'}</td>
              <td style={{ ...td, textAlign: 'right' }}>{r.closingCash !== null ? `${currency}${fmt(r.closingCash)}` : '—'}</td>
              <td style={{
                ...td,
                textAlign: 'right',
                fontWeight: 500,
                color: r.variance === null
                  ? 'rgba(255,255,255,0.35)'
                  : r.variance < 0 ? '#dc2626'
                  : r.variance > 0 ? '#b45309'
                  : '#16a34a'
              }}>
                {r.variance !== null ? `${currency}${fmt(r.variance)}` : '—'}
              </td>
              <td style={td}>
                {r.status === 'open' ? <span className="badge-green">Open</span> : <span className="badge-gray">Closed</span>}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
