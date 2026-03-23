// src/renderer/src/pages/reporting/ReportingPage.tsx
import { useState } from 'react'
import { FileSpreadsheet, FileDown, BarChart3 } from 'lucide-react'
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

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(79,70,229,0.10)' }}>
            <BarChart3 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Reports</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Generate and export business reports</p>
          </div>
        </div>
      </div>
      <div className="p-6 flex-1 space-y-6">

      {/* Report type tabs — pill toggle */}
      <div className="flex gap-1.5 flex-wrap">
        {REPORT_TYPES.map(rt => (
          <button
            key={rt.value}
            onClick={() => setReportType(rt.value as ReportType)}
            className="px-3 py-1.5 text-sm font-medium rounded-full transition-all"
            style={reportType === rt.value
              ? { background: 'var(--accent)', color: '#ffffff', border: 'none' }
              : { background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
          >
            {rt.label}
          </button>
        ))}
      </div>

      <div className="content-card p-5">
        <div className="flex flex-wrap gap-4 items-end">
          {reportType !== 'inventory_valuation' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="dark-input px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="dark-input px-3 py-2 text-sm"
                />
              </div>
            </>
          )}

          {canViewAll && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Branch ID (optional)</label>
              <input
                type="text"
                value={branchId}
                onChange={e => setBranchId(e.target.value)}
                placeholder="All branches"
                inputMode="search"
                className="dark-input px-3 py-2 text-sm w-40"
              />
            </div>
          )}

          <button
            onClick={handleRun}
            className="btn-primary flex items-center gap-2 px-4 py-2"
          >
            Run Report
          </button>

          {activeFilters && canExport && (
            <>
              <button
                onClick={handleExportExcel}
                disabled={exportExcel.isPending || isLoading}
                aria-label="Export report as Excel spreadsheet"
                className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-sm disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" style={{ color: '#16a34a' }} />
                Excel
              </button>
              <button
                onClick={handleExportPdf}
                disabled={exportPdf.isPending || isLoading}
                aria-label="Export report as PDF"
                className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-sm disabled:opacity-50"
              >
                <FileDown className="w-4 h-4" style={{ color: '#dc2626' }} />
                PDF
              </button>
            </>
          )}
        </div>

        {exportError && (
          <p className="text-xs mt-3" style={{ color: '#dc2626' }}>{exportError}</p>
        )}
      </div>

      {activeFilters && (
        <div className="content-card overflow-x-auto">
          {isLoading ? (
            <div className="p-6 text-sm" style={{ color: 'var(--text-muted)' }}>Loading report…</div>
          ) : activeFilters.reportType === 'sales_summary' ? (
            <SalesSummaryTable data={salesSummaryQuery.data} currency={currencySymbol} />
          ) : activeFilters.reportType === 'sales_by_product' ? (
            <SalesByProductTable data={salesByProductQuery.data?.data ?? []} currency={currencySymbol} />
          ) : activeFilters.reportType === 'inventory_valuation' ? (
            <InventoryValuationTable data={inventoryQuery.data} currency={currencySymbol} />
          ) : (
            <CashDrawerTable data={drawerReportQuery.data?.data ?? []} currency={currencySymbol} />
          )}
        </div>
      )}
      </div>
    </div>
  )
}

function SalesSummaryTable({ data, currency }: { data: any; currency: string }) {
  const rows = data?.data ?? []
  const totals = data?.totals
  return (
    <table className="dark-table">
      <thead>
        <tr>
          <th className="text-left">Date</th>
          <th className="text-right">Transactions</th>
          <th className="text-right">Items Sold</th>
          <th className="text-right">Revenue</th>
          <th className="text-right">Tax</th>
          <th className="text-right">Discount</th>
          <th className="text-right">Net Revenue</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={7} className="px-4 py-6 text-center" style={{ color: 'var(--text-muted)' }}>No data for the selected period.</td></tr>
        ) : rows.map((r: any, i: number) => (
          <tr key={i}>
            <td style={{ color: 'var(--text-secondary)' }}>{r.date}</td>
            <td className="text-right">{r.transactions}</td>
            <td className="text-right">{r.itemsSold}</td>
            <td className="text-right">{currency}{fmt(r.revenue)}</td>
            <td className="text-right">{currency}{fmt(r.tax)}</td>
            <td className="text-right">{currency}{fmt(r.discount)}</td>
            <td className="text-right font-medium">{currency}{fmt(r.netRevenue)}</td>
          </tr>
        ))}
        {totals && (
          <tr className="font-semibold text-xs" style={{ background: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
            <td className="px-4 py-2.5">Total</td>
            <td className="px-4 py-2.5 text-right">{totals.transactions}</td>
            <td className="px-4 py-2.5 text-right">{totals.itemsSold}</td>
            <td className="px-4 py-2.5 text-right">{currency}{fmt(totals.revenue)}</td>
            <td className="px-4 py-2.5 text-right">{currency}{fmt(totals.tax)}</td>
            <td className="px-4 py-2.5 text-right">{currency}{fmt(totals.discount)}</td>
            <td className="px-4 py-2.5 text-right">{currency}{fmt(totals.netRevenue)}</td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

function SalesByProductTable({ data, currency }: { data: any[]; currency: string }) {
  return (
    <table className="dark-table">
      <thead>
        <tr>
          <th className="text-left">SKU</th>
          <th className="text-left">Name</th>
          <th className="text-right">Units Sold</th>
          <th className="text-right">Revenue</th>
          <th className="text-right">COGS</th>
          <th className="text-right">Gross Profit</th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr><td colSpan={6} className="px-4 py-6 text-center" style={{ color: 'var(--text-muted)' }}>No data for the selected period.</td></tr>
        ) : data.map((r, i) => (
          <tr key={i}>
            <td className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{r.sku}</td>
            <td>{r.name}</td>
            <td className="text-right">{r.unitsSold}</td>
            <td className="text-right">{currency}{fmt(r.revenue)}</td>
            <td className="text-right">{currency}{fmt(r.cogs)}</td>
            <td className={`text-right font-medium ${r.grossProfit < 0 ? '' : ''}`}
              style={{ color: r.grossProfit < 0 ? '#dc2626' : '#16a34a' }}>
              {currency}{fmt(r.grossProfit)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function InventoryValuationTable({ data, currency }: { data: any; currency: string }) {
  const rows = data?.data ?? []
  const totalValue = data?.totalValue ?? 0
  return (
    <table className="dark-table">
      <thead>
        <tr>
          <th className="text-left">SKU</th>
          <th className="text-left">Name</th>
          <th className="text-left">Category</th>
          <th className="text-right">Qty</th>
          <th className="text-right">Cost Price</th>
          <th className="text-right">Total Value</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={6} className="px-4 py-6 text-center" style={{ color: 'var(--text-muted)' }}>No data.</td></tr>
        ) : rows.map((r: any, i: number) => (
          <tr key={i}>
            <td className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{r.sku}</td>
            <td>{r.name}</td>
            <td style={{ color: 'var(--text-secondary)' }}>{r.category}</td>
            <td className="text-right">{r.quantity}</td>
            <td className="text-right">{currency}{fmt(r.costPrice)}</td>
            <td className="text-right font-medium">{currency}{fmt(r.totalValue)}</td>
          </tr>
        ))}
        {rows.length > 0 && (
          <tr className="font-semibold text-xs" style={{ background: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
            <td colSpan={5} className="px-4 py-2.5">Total Inventory Value</td>
            <td className="px-4 py-2.5 text-right">{currency}{fmt(totalValue)}</td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

function CashDrawerTable({ data, currency }: { data: any[]; currency: string }) {
  return (
    <table className="dark-table">
      <thead>
        <tr>
          <th className="text-left">Opened At</th>
          <th className="text-left">Closed At</th>
          <th className="text-left">Cashier</th>
          <th className="text-right">Opening</th>
          <th className="text-right">Total Sales</th>
          <th className="text-right">Expected</th>
          <th className="text-right">Closing</th>
          <th className="text-right">Variance</th>
          <th className="text-left">Status</th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr><td colSpan={9} className="px-4 py-6 text-center" style={{ color: 'var(--text-muted)' }}>No data for the selected period.</td></tr>
        ) : data.map((r, i) => (
          <tr key={i}>
            <td className="text-xs" style={{ color: 'var(--text-secondary)' }}>{new Date(r.openedAt).toLocaleString()}</td>
            <td className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.closedAt ? new Date(r.closedAt).toLocaleString() : '—'}</td>
            <td>{r.cashierName}</td>
            <td className="text-right">{currency}{fmt(r.openingCash)}</td>
            <td className="text-right">{currency}{fmt(r.totalSales)}</td>
            <td className="text-right">{r.expectedCash !== null ? `${currency}${fmt(r.expectedCash)}` : '—'}</td>
            <td className="text-right">{r.closingCash !== null ? `${currency}${fmt(r.closingCash)}` : '—'}</td>
            <td className="text-right font-medium"
              style={{
                color: r.variance === null
                  ? 'var(--text-muted)'
                  : r.variance < 0 ? '#dc2626'
                  : r.variance > 0 ? '#b45309'
                  : '#16a34a'
              }}>
              {r.variance !== null ? `${currency}${fmt(r.variance)}` : '—'}
            </td>
            <td>
              {r.status === 'open' ? <span className="badge-green">Open</span> : <span className="badge-gray">Closed</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
