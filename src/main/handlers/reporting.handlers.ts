// src/main/handlers/reporting.handlers.ts
import { ipcMain, dialog } from 'electron'
import { IPC } from '@shared/types/ipc.types'
import { requireAuth } from '../services/auth.service'
import store from '../store/electron-store'
import {
  getSalesSummary,
  getSalesByProduct,
  getInventoryValuation,
  getCashDrawerReport
} from '../services/reporting.service'
import type { ReportFilters } from '@shared/types/reporting.types'
import fs from 'fs'
import path from 'path'
import os from 'os'
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'

function requireReporting(auth: any) {
  if (!auth.role.permissions.includes('can_view_reports')) throw new Error('Permission denied')
}

function scopeFilters(auth: any, filters: ReportFilters): ReportFilters {
  const canViewAll = auth.role.permissions.includes('can_view_all_branches')
  if (canViewAll) {
    // Admin can query a specific branch OR all branches (branchId undefined = all)
    return { ...filters }
  }
  // Non-admin: always scope to own branch, ignore any branchId in filters
  return { ...filters, branchId: auth.user.branchId }
}

export function registerReportingHandlers(): void {
  ipcMain.handle(IPC.REPORTING_GET_SALES_SUMMARY, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      requireReporting(auth)
      const filters = scopeFilters(auth, req as ReportFilters)
      const result = await getSalesSummary(filters)
      return { success: true, ...result }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to generate report' }
    }
  })

  ipcMain.handle(IPC.REPORTING_GET_SALES_BY_PRODUCT, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      requireReporting(auth)
      const filters = scopeFilters(auth, req as ReportFilters)
      const data = await getSalesByProduct(filters)
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to generate report' }
    }
  })

  ipcMain.handle(IPC.REPORTING_GET_INVENTORY_VALUATION, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      requireReporting(auth)
      const filters = scopeFilters(auth, req as ReportFilters)
      const result = await getInventoryValuation(filters)
      return { success: true, ...result }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to generate report' }
    }
  })

  ipcMain.handle(IPC.REPORTING_GET_CASH_DRAWER_REPORT, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      requireReporting(auth)
      const filters = scopeFilters(auth, req as ReportFilters)
      const data = await getCashDrawerReport(filters)
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to generate report' }
    }
  })

  ipcMain.handle(IPC.REPORTING_EXPORT_EXCEL, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_export_reports'))
        return { success: false, error: 'Permission denied' }
      const r = req as { filters: ReportFilters; rows: any[][]; headers: string[]; title: string }
      // Sanitize title: strip path separators to prevent path traversal in defaultPath
      const safeTitle = path
        .basename(String(r.title ?? 'Report').replace(/[/\\]/g, '_'))
        .slice(0, 100)

      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet(safeTitle)
      ws.addRow(r.headers)
      r.rows.forEach((row: any[]) => {
        // Force each cell value to String to prevent CSV/formula injection (=, +, -, @ prefixes)
        ws.addRow(
          row.map((cell) => {
            const s = String(cell ?? '')
            return /^[=+\-@]/.test(s) ? `'${s}` : s
          })
        )
      })

      const { filePath } = await dialog.showSaveDialog({
        defaultPath: path.join(os.homedir(), `${safeTitle.replace(/\s+/g, '_')}.xlsx`),
        filters: [{ name: 'Excel', extensions: ['xlsx'] }]
      })
      if (!filePath) return { success: false, error: 'Cancelled' }
      await wb.xlsx.writeFile(filePath)
      return { success: true, filePath }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Export failed' }
    }
  })

  ipcMain.handle(IPC.REPORTING_EXPORT_PDF, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_export_reports'))
        return { success: false, error: 'Permission denied' }
      const r = req as { filters: ReportFilters; rows: any[][]; headers: string[]; title: string }
      const safeTitle = path
        .basename(String(r.title ?? 'Report').replace(/[/\\]/g, '_'))
        .slice(0, 100)

      const { filePath } = await dialog.showSaveDialog({
        defaultPath: path.join(os.homedir(), `${safeTitle.replace(/\s+/g, '_')}.pdf`),
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      })
      if (!filePath) return { success: false, error: 'Cancelled' }

      const doc = new PDFDocument({ margin: 40, size: 'A4' })
      const stream = fs.createWriteStream(filePath)
      doc.pipe(stream)
      doc.fontSize(16).text(safeTitle, { align: 'center' })
      doc.moveDown(0.5)
      doc.fontSize(9).text(r.headers.join('  |  '), { continued: false })
      doc.moveDown(0.2)
      for (const row of r.rows) {
        doc.fontSize(8).text((row as any[]).join('  |  '))
      }
      doc.end()
      await new Promise<void>((resolve, reject) => {
        stream.on('finish', resolve)
        stream.on('error', reject)
      })
      return { success: true, filePath }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Export failed' }
    }
  })
}
