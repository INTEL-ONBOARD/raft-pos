// src/renderer/src/hooks/useReporting.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { ipc } from '../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import type {
  ReportFilters, SalesSummaryResult, SalesByProductResult,
  InventoryValuationResult, CashDrawerReportResult, ExportResult
} from '@shared/types/reporting.types'

export function useSalesSummary(filters: ReportFilters | null) {
  return useQuery({
    queryKey: ['report', 'sales-summary', filters],
    queryFn: async () => {
      const result = await ipc.invoke<SalesSummaryResult>(IPC.REPORTING_GET_SALES_SUMMARY, filters)
      if (!result.success) throw new Error(result.error)
      return result
    },
    enabled: !!filters,
    staleTime: 60_000
  })
}

export function useSalesByProduct(filters: ReportFilters | null) {
  return useQuery({
    queryKey: ['report', 'sales-by-product', filters],
    queryFn: async () => {
      const result = await ipc.invoke<SalesByProductResult>(IPC.REPORTING_GET_SALES_BY_PRODUCT, filters)
      if (!result.success) throw new Error(result.error)
      return result
    },
    enabled: !!filters,
    staleTime: 60_000
  })
}

export function useInventoryValuation(filters: ReportFilters | null) {
  return useQuery({
    queryKey: ['report', 'inventory-valuation', filters],
    queryFn: async () => {
      const result = await ipc.invoke<InventoryValuationResult>(IPC.REPORTING_GET_INVENTORY_VALUATION, filters)
      if (!result.success) throw new Error(result.error)
      return result
    },
    enabled: !!filters,
    staleTime: 60_000
  })
}

export function useCashDrawerReport(filters: ReportFilters | null) {
  return useQuery({
    queryKey: ['report', 'cash-drawer', filters],
    queryFn: async () => {
      const result = await ipc.invoke<CashDrawerReportResult>(IPC.REPORTING_GET_CASH_DRAWER_REPORT, filters)
      if (!result.success) throw new Error(result.error)
      return result
    },
    enabled: !!filters,
    staleTime: 60_000
  })
}

export function useExportExcel() {
  return useMutation({
    mutationFn: async (payload: { filters: ReportFilters; rows: any[][]; headers: string[]; title: string }) => {
      const result = await ipc.invoke<ExportResult>(IPC.REPORTING_EXPORT_EXCEL, payload)
      if (!result.success) throw new Error(result.error)
      return result
    }
  })
}

export function useExportPdf() {
  return useMutation({
    mutationFn: async (payload: { filters: ReportFilters; rows: any[][]; headers: string[]; title: string }) => {
      const result = await ipc.invoke<ExportResult>(IPC.REPORTING_EXPORT_PDF, payload)
      if (!result.success) throw new Error(result.error)
      return result
    }
  })
}
