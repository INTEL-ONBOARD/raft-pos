// src/renderer/src/hooks/usePOS.ts
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ipc } from '../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import { usePosStore } from '../stores/pos.store'
import { useAuthStore } from '../stores/auth.store'
import { useInventory } from './useInventory'
import {
  selectSubtotal,
  selectOrderDiscountAmount,
  selectTaxAmount,
  selectTotalAmount,
  selectTotalPaid
} from '../stores/pos.store'
import type { CompleteSaleInput, SaleResult, TransactionResult, TransactionsResult } from '@shared/types/transaction.types'

// ─── useCartTotals ───────────────────────────────────────────────────────────
// Computes all financial totals from cart state. taxRate comes from a settings
// value (Phase 7 will write it; Phase 4 defaults to 0).

export function useCartTotals(taxRate = 0) {
  const items = usePosStore((s) => s.items)
  const orderDiscount = usePosStore((s) => s.orderDiscount)
  const payments = usePosStore((s) => s.payments)

  const subtotal = selectSubtotal({ items })
  const orderDiscountAmount = selectOrderDiscountAmount(subtotal, orderDiscount)
  const afterDiscount = Math.max(0, subtotal - orderDiscountAmount)
  const taxAmount = selectTaxAmount(afterDiscount, taxRate)
  const totalAmount = selectTotalAmount(subtotal, orderDiscountAmount, taxAmount)
  const totalPaid = selectTotalPaid({ payments })
  const change = Math.max(0, totalPaid - totalAmount)
  const remaining = Math.max(0, totalAmount - totalPaid)

  return {
    subtotal,
    orderDiscountAmount,
    afterDiscount,
    taxAmount,
    totalAmount,
    totalPaid,
    change,
    remaining
  }
}

// ─── usePOS ──────────────────────────────────────────────────────────────────

export function usePOS() {
  const queryClient = useQueryClient()
  const clearCart = usePosStore((s) => s.clearCart)
  const addItem = usePosStore((s) => s.addItem)
  const role = useAuthStore((s) => s.role)
  const { stockQuery } = useInventory()

  // Listen for barcode scan push events from main process
  useEffect(() => {
    const unsub = ipc.on(IPC.SCANNER_BARCODE_SCANNED, async (...args: unknown[]) => {
      const barcode = args[0] as string
      if (!barcode) return
      const result = await ipc.invoke<{ success: boolean; data?: any; error?: string }>(
        IPC.PRODUCTS_GET_BY_BARCODE,
        { barcode }
      )
      if (result.success && result.data) {
        const product = result.data
        // Prefer fresh stock levels from refetched query; fall back to cached data
        const freshStock = await queryClient.fetchQuery({
          queryKey: ['inventory', 'stock-levels'],
          staleTime: 5 * 1000 // use cached if less than 5s old, else refetch
        }).catch(() => stockQuery.data)
        const stockList = freshStock ?? stockQuery.data ?? []
        const stockRow = (stockList as any[]).find((r: any) => r.productId === product._id)
        const availableStock = stockRow?.quantity ?? 0

        addItem({
          productId: product._id,
          sku: product.sku,
          name: product.name,
          unit: product.unit,
          quantity: 1,
          unitPrice: product.sellingPrice,
          unitCost: product.costPrice ?? 0,
          availableStock
        })
      }
    })
    return unsub
  }, [addItem, stockQuery.data, queryClient])

  // Complete sale mutation
  const completeSaleMutation = useMutation({
    mutationFn: async (input: CompleteSaleInput) => {
      const result = await ipc.invoke<SaleResult>(IPC.POS_COMPLETE_SALE, input)
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      clearCart()
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    }
  })

  // Void transaction mutation
  const voidMutation = useMutation({
    mutationFn: async (input: { transactionId: string; reason: string }) => {
      const result = await ipc.invoke<TransactionResult>(IPC.POS_VOID_TRANSACTION, input)
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    }
  })

  // Refund transaction mutation
  const refundMutation = useMutation({
    mutationFn: async (input: { transactionId: string; reason: string; refundedItems: Array<{ productId: string; quantity: number }> }) => {
      const result = await ipc.invoke<TransactionResult>(IPC.POS_REFUND_TRANSACTION, input)
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    }
  })

  // Supervisor PIN validation (not a React Query mutation — returns immediately)
  const validateSupervisorPin = async (supervisorEmail: string, pin: string) => {
    return ipc.invoke<{ valid: boolean; error?: string; supervisorId?: string; supervisorName?: string }>(
      IPC.POS_VALIDATE_SUPERVISOR_PIN,
      { supervisorEmail, pin }
    )
  }

  return {
    completeSaleMutation,
    voidMutation,
    refundMutation,
    validateSupervisorPin,
    maxDiscountPercent: role?.maxDiscountPercent ?? 0,
    requiresSupervisorOverride: role?.requiresSupervisorOverride ?? false
  }
}

// ─── useTransactions ─────────────────────────────────────────────────────────

export function useTransactions(filters?: {
  status?: string; from?: string; to?: string; page?: number; limit?: number
}) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const result = await ipc.invoke<TransactionsResult>(IPC.POS_GET_TRANSACTIONS, filters ?? {})
      if (!result.success) throw new Error(result.error)
      return result
    },
    staleTime: 10 * 1000
  })
}
