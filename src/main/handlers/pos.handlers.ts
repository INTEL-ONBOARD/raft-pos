// src/main/handlers/pos.handlers.ts
import { ipcMain } from 'electron'
import { IPC } from '@shared/types/ipc.types'
import { requireAuth } from '../services/auth.service'
import store from '../store/electron-store'
import {
  completeSale,
  voidTransaction,
  refundTransaction,
  getTransaction,
  getTransactions
} from '../services/transaction.service'
import type { CompleteSaleInput, VoidInput, RefundInput } from '@shared/types/transaction.types'

export function registerPosHandlers(): void {

  // ── POS_COMPLETE_SALE ──────────────────────────────────────────────────────
  ipcMain.handle(IPC.POS_COMPLETE_SALE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_make_sale')) {
        return { success: false, error: 'Permission denied' }
      }

      const r = req as CompleteSaleInput
      if (!r?.items?.length) return { success: false, error: 'Cart is empty' }
      if (!r?.payments?.length) return { success: false, error: 'No payment provided' }

      // Check discount permissions if any discounts are applied
      const hasItemDiscount = r.items?.some((it: any) => it.discountAmount > 0)
      const hasOrderDiscount = r.discountAmount > 0

      if (hasItemDiscount && !auth.role.permissions.includes('can_apply_discount')) {
        return { success: false, error: 'Permission denied: cannot apply item discounts' }
      }
      if (hasOrderDiscount && !auth.role.permissions.includes('can_apply_order_discount')) {
        return { success: false, error: 'Permission denied: cannot apply order discounts' }
      }

      const input = r
      const terminalId = store.get('terminalId') ?? 'unknown'
      const data = await completeSale(
        input,
        auth.user._id,
        auth.user.branchId,
        terminalId
      )
      return { success: true, data }
    } catch (err: any) {
      console.error('[IPC] POS_COMPLETE_SALE:', err)
      return { success: false, error: err.message ?? 'Failed to complete sale' }
    }
  })

  // ── POS_VOID_TRANSACTION ───────────────────────────────────────────────────
  ipcMain.handle(IPC.POS_VOID_TRANSACTION, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_void_transaction')) {
        return { success: false, error: 'Permission denied' }
      }

      const r = req as VoidInput
      if (!r?.transactionId) return { success: false, error: 'transactionId is required' }
      if (!r?.reason?.trim()) return { success: false, error: 'Void reason is required' }

      const terminalId = store.get('terminalId') ?? 'unknown'
      const data = await voidTransaction(r, auth.user._id, auth.user.branchId, terminalId)
      return { success: true, data }
    } catch (err: any) {
      console.error('[IPC] POS_VOID_TRANSACTION:', err)
      return { success: false, error: err.message ?? 'Failed to void transaction' }
    }
  })

  // ── POS_REFUND_TRANSACTION ─────────────────────────────────────────────────
  ipcMain.handle(IPC.POS_REFUND_TRANSACTION, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_refund_transaction')) {
        return { success: false, error: 'Permission denied' }
      }

      const r = req as RefundInput
      if (!r?.transactionId) return { success: false, error: 'transactionId is required' }
      if (!r?.reason?.trim()) return { success: false, error: 'Refund reason is required' }
      if (!r?.refundedItems?.length) return { success: false, error: 'Select at least one item to refund' }

      const terminalId = store.get('terminalId') ?? 'unknown'
      const data = await refundTransaction(r, auth.user._id, auth.user.branchId, terminalId)
      return { success: true, data }
    } catch (err: any) {
      console.error('[IPC] POS_REFUND_TRANSACTION:', err)
      return { success: false, error: err.message ?? 'Failed to refund transaction' }
    }
  })

  // ── POS_GET_TRANSACTION ────────────────────────────────────────────────────
  ipcMain.handle(IPC.POS_GET_TRANSACTION, async (_e, req: unknown) => {
    try {
      await requireAuth(store.get('jwt') ?? null)
      const r = req as { id: string }
      if (!r?.id) return { success: false, error: 'id is required' }
      const data = await getTransaction(r.id)
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to fetch transaction' }
    }
  })

  // ── POS_GET_TRANSACTIONS ───────────────────────────────────────────────────
  ipcMain.handle(IPC.POS_GET_TRANSACTIONS, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      const r = (req ?? {}) as {
        status?: string; from?: string; to?: string; page?: number; limit?: number
      }
      const { data, total } = await getTransactions(auth.user.branchId, r)
      return { success: true, data, total }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to fetch transactions' }
    }
  })

  // ── POS_REPRINT_RECEIPT ────────────────────────────────────────────────────
  // Phase 4: returns the transaction for the renderer to display in receipt modal.
  // ESC/POS printing deferred to Phase 6.
  ipcMain.handle(IPC.POS_REPRINT_RECEIPT, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_reprint_receipt')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as { transactionId: string }
      if (!r?.transactionId) return { success: false, error: 'transactionId is required' }
      const data = await getTransaction(r.transactionId)
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to reprint receipt' }
    }
  })
}
