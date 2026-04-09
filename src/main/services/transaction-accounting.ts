type PaymentMethod = 'cash' | 'card' | 'gcash' | 'paymaya'
type DiscountType = 'none' | 'percent' | 'fixed'

interface PaymentLike {
  method: PaymentMethod
  amount: number
}

interface TransactionItemLike {
  productId: { toString(): string } | string
  sku: string
  name: string
  quantity: number
  unitPrice: number
  unitCost: number
  totalPrice: number
}

interface RefundedItemLike {
  productId: { toString(): string } | string
  quantity: number
  refundedAt: Date | string
}

export interface TransactionLike {
  items: TransactionItemLike[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  change: number
  payments: PaymentLike[]
  status: 'completed' | 'voided' | 'refunded' | 'partially_refunded'
  createdAt: Date | string
  voidedAt?: Date | string | null
  refundedItems?: RefundedItemLike[]
}

export interface PaymentBreakdown {
  cash: number
  card: number
  mobile: number
  total: number
}

export interface RefundBreakdown {
  units: number
  subtotal: number
  discount: number
  tax: number
  total: number
  cogs: number
}

export interface NetTransactionMetrics {
  transactions: number
  itemsSold: number
  revenue: number
  tax: number
  discount: number
  netRevenue: number
  cogs: number
  payments: PaymentBreakdown
}

export interface ProductNetMetric {
  productId: string
  sku: string
  name: string
  unitsSold: number
  revenue: number
  cogs: number
}

export interface CashMovementDelta {
  totalSales: number
  totalCash: number
  totalCard: number
  totalMobile: number
  totalTransactions: number
}

interface RefundEvent {
  refundedAt: Date
  breakdown: RefundBreakdown
  payments: PaymentBreakdown
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function toProductId(value: { toString(): string } | string): string {
  return typeof value === 'string' ? value : value.toString()
}

function subtractPayments(a: PaymentBreakdown, b: PaymentBreakdown): PaymentBreakdown {
  return finalizePayments({
    cash: a.cash - b.cash,
    card: a.card - b.card,
    mobile: a.mobile - b.mobile
  })
}

function finalizePayments(input: Omit<PaymentBreakdown, 'total'>): PaymentBreakdown {
  const cash = roundMoney(input.cash)
  const card = roundMoney(input.card)
  const mobile = roundMoney(input.mobile)
  return {
    cash,
    card,
    mobile,
    total: roundMoney(cash + card + mobile)
  }
}

function buildRefundQuantityMap(refundedItems: RefundedItemLike[]): Map<string, number> {
  return refundedItems.reduce((map, item) => {
    const productId = toProductId(item.productId)
    map.set(productId, (map.get(productId) ?? 0) + item.quantity)
    return map
  }, new Map<string, number>())
}

function getGrossDiscount(txn: TransactionLike): number {
  const itemDiscount = txn.items.reduce((sum, item) => {
    const gross = item.unitPrice * item.quantity
    return sum + Math.max(0, gross - item.totalPrice)
  }, 0)

  return roundMoney(itemDiscount + (txn.discountAmount ?? 0))
}

export function getRetainedPaymentBreakdown(txn: TransactionLike): PaymentBreakdown {
  const cashTendered = txn.payments
    .filter((payment) => payment.method === 'cash')
    .reduce((sum, payment) => sum + payment.amount, 0)
  const card = txn.payments
    .filter((payment) => payment.method === 'card')
    .reduce((sum, payment) => sum + payment.amount, 0)
  const mobile = txn.payments
    .filter((payment) => payment.method === 'gcash' || payment.method === 'paymaya')
    .reduce((sum, payment) => sum + payment.amount, 0)

  return finalizePayments({
    cash: Math.max(0, cashTendered - (txn.change ?? 0)),
    card,
    mobile
  })
}

export function computeRefundBreakdown(
  txn: TransactionLike,
  refundedItems: RefundedItemLike[] = txn.refundedItems ?? []
): RefundBreakdown {
  if (!refundedItems.length) {
    return { units: 0, subtotal: 0, discount: 0, tax: 0, total: 0, cogs: 0 }
  }

  const refundedQtyByProduct = buildRefundQuantityMap(refundedItems)
  let refundedUnits = 0
  let refundedSubtotal = 0
  let refundedItemDiscount = 0
  let refundedCogs = 0

  for (const item of txn.items) {
    const productId = toProductId(item.productId)
    const refundedQty = Math.max(
      0,
      Math.min(item.quantity, refundedQtyByProduct.get(productId) ?? 0)
    )
    if (refundedQty <= 0) continue

    const refundedRatio = item.quantity > 0 ? refundedQty / item.quantity : 0
    const refundedGross = item.unitPrice * refundedQty
    const refundedNetBeforeOrder = item.totalPrice * refundedRatio

    refundedUnits += refundedQty
    refundedSubtotal += refundedNetBeforeOrder
    refundedItemDiscount += Math.max(0, refundedGross - refundedNetBeforeOrder)
    refundedCogs += item.unitCost * refundedQty
  }

  const orderDiscountShare =
    txn.subtotal > 0 ? (txn.discountAmount * refundedSubtotal) / txn.subtotal : 0
  const afterOrderSubtotal = Math.max(0, txn.totalAmount - txn.taxAmount)
  const taxableRefundSubtotal = Math.max(0, refundedSubtotal - orderDiscountShare)
  const taxShare =
    afterOrderSubtotal > 0 ? (txn.taxAmount * taxableRefundSubtotal) / afterOrderSubtotal : 0
  const total = taxableRefundSubtotal + taxShare

  return {
    units: refundedUnits,
    subtotal: roundMoney(refundedSubtotal),
    discount: roundMoney(refundedItemDiscount + orderDiscountShare),
    tax: roundMoney(taxShare),
    total: roundMoney(total),
    cogs: roundMoney(refundedCogs)
  }
}

export function distributeRefundAcrossPayments(
  refundTotal: number,
  originalPayments: PaymentBreakdown
): PaymentBreakdown {
  if (refundTotal <= 0) {
    return { cash: 0, card: 0, mobile: 0, total: 0 }
  }

  if (originalPayments.total <= 0) {
    return finalizePayments({ cash: refundTotal, card: 0, mobile: 0 })
  }

  const exact = {
    cash: (refundTotal * originalPayments.cash) / originalPayments.total,
    card: (refundTotal * originalPayments.card) / originalPayments.total,
    mobile: (refundTotal * originalPayments.mobile) / originalPayments.total
  }

  let distributed = finalizePayments(exact)
  const diff = roundMoney(refundTotal - distributed.total)
  if (diff !== 0) {
    const keys: Array<keyof Omit<PaymentBreakdown, 'total'>> = ['cash', 'card', 'mobile']
    const targetKey = keys.reduce((best, key) =>
      originalPayments[key] > originalPayments[best] ? key : best
    )
    distributed = finalizePayments({
      cash: distributed.cash + (targetKey === 'cash' ? diff : 0),
      card: distributed.card + (targetKey === 'card' ? diff : 0),
      mobile: distributed.mobile + (targetKey === 'mobile' ? diff : 0)
    })
  }

  return distributed
}

export function getNetTransactionMetrics(txn: TransactionLike): NetTransactionMetrics {
  if (txn.status === 'voided') {
    return {
      transactions: 0,
      itemsSold: 0,
      revenue: 0,
      tax: 0,
      discount: 0,
      netRevenue: 0,
      cogs: 0,
      payments: { cash: 0, card: 0, mobile: 0, total: 0 }
    }
  }

  const soldUnits = txn.items.reduce((sum, item) => sum + item.quantity, 0)
  const grossCogs = txn.items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0)
  const grossDiscount = getGrossDiscount(txn)
  const refund = computeRefundBreakdown(txn)
  const payments = subtractPayments(
    getRetainedPaymentBreakdown(txn),
    distributeRefundAcrossPayments(refund.total, getRetainedPaymentBreakdown(txn))
  )

  const revenue = Math.max(0, roundMoney(txn.totalAmount - refund.total))
  const tax = Math.max(0, roundMoney(txn.taxAmount - refund.tax))
  const discount = Math.max(0, roundMoney(grossDiscount - refund.discount))
  const itemsSold = Math.max(0, soldUnits - refund.units)
  const cogs = Math.max(0, roundMoney(grossCogs - refund.cogs))

  return {
    transactions: revenue > 0 || itemsSold > 0 ? 1 : 0,
    itemsSold,
    revenue,
    tax,
    discount,
    netRevenue: Math.max(0, roundMoney(revenue - tax)),
    cogs,
    payments
  }
}

export function getNetProductMetrics(txn: TransactionLike): ProductNetMetric[] {
  if (txn.status === 'voided') return []

  const refundedQtyByProduct = buildRefundQuantityMap(txn.refundedItems ?? [])
  return txn.items.reduce<ProductNetMetric[]>((rows, item) => {
    const productId = toProductId(item.productId)
    const refundedQty = Math.max(
      0,
      Math.min(item.quantity, refundedQtyByProduct.get(productId) ?? 0)
    )
    const refundedRatio = item.quantity > 0 ? refundedQty / item.quantity : 0
    const orderDiscountShare =
      txn.subtotal > 0 ? (txn.discountAmount * item.totalPrice) / txn.subtotal : 0
    const netRevenueBeforeTax = Math.max(0, item.totalPrice - orderDiscountShare)
    const refundedRevenueBeforeTax = netRevenueBeforeTax * refundedRatio
    const unitsSold = Math.max(0, item.quantity - refundedQty)

    rows.push({
      productId,
      sku: item.sku,
      name: item.name,
      unitsSold,
      revenue: roundMoney(Math.max(0, netRevenueBeforeTax - refundedRevenueBeforeTax)),
      cogs: roundMoney(Math.max(0, item.unitCost * unitsSold))
    })

    return rows
  }, [])
}

function getRefundEvents(txn: TransactionLike): RefundEvent[] {
  if (!txn.refundedItems?.length || txn.status === 'voided') return []

  const groups = txn.refundedItems.reduce((map, item) => {
    const refundedAt = toDate(item.refundedAt)
    if (!refundedAt) return map
    const key = refundedAt.toISOString()
    const existing = map.get(key) ?? []
    existing.push(item)
    map.set(key, existing)
    return map
  }, new Map<string, RefundedItemLike[]>())

  const originalPayments = getRetainedPaymentBreakdown(txn)

  return Array.from(groups.entries())
    .map(([key, items]) => {
      const breakdown = computeRefundBreakdown(txn, items)
      return {
        refundedAt: new Date(key),
        breakdown,
        payments: distributeRefundAcrossPayments(breakdown.total, originalPayments)
      }
    })
    .sort((a, b) => a.refundedAt.getTime() - b.refundedAt.getTime())
}

function isWithinWindow(value: Date | null, start: Date, end: Date): boolean {
  return value != null && value >= start && value <= end
}

export function getCashDrawerDelta(
  txn: TransactionLike,
  windowStart: Date,
  windowEnd: Date
): CashMovementDelta {
  const salePayments = getRetainedPaymentBreakdown(txn)
  const saleCreatedAt = toDate(txn.createdAt)
  const voidedAt = toDate(txn.voidedAt ?? null)
  let delta: CashMovementDelta = {
    totalSales: 0,
    totalCash: 0,
    totalCard: 0,
    totalMobile: 0,
    totalTransactions: 0
  }

  if (isWithinWindow(saleCreatedAt, windowStart, windowEnd)) {
    delta = {
      totalSales: roundMoney(delta.totalSales + txn.totalAmount),
      totalCash: roundMoney(delta.totalCash + salePayments.cash),
      totalCard: roundMoney(delta.totalCard + salePayments.card),
      totalMobile: roundMoney(delta.totalMobile + salePayments.mobile),
      totalTransactions: delta.totalTransactions + 1
    }
  }

  if (txn.status === 'voided' && isWithinWindow(voidedAt, windowStart, windowEnd)) {
    delta = {
      totalSales: roundMoney(delta.totalSales - txn.totalAmount),
      totalCash: roundMoney(delta.totalCash - salePayments.cash),
      totalCard: roundMoney(delta.totalCard - salePayments.card),
      totalMobile: roundMoney(delta.totalMobile - salePayments.mobile),
      totalTransactions: delta.totalTransactions
    }
  }

  for (const refundEvent of getRefundEvents(txn)) {
    if (!isWithinWindow(refundEvent.refundedAt, windowStart, windowEnd)) continue
    delta = {
      totalSales: roundMoney(delta.totalSales - refundEvent.breakdown.total),
      totalCash: roundMoney(delta.totalCash - refundEvent.payments.cash),
      totalCard: roundMoney(delta.totalCard - refundEvent.payments.card),
      totalMobile: roundMoney(delta.totalMobile - refundEvent.payments.mobile),
      totalTransactions: delta.totalTransactions
    }
  }

  return delta
}
