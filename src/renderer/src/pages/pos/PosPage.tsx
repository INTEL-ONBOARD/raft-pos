// src/renderer/src/pages/pos/PosPage.tsx
import { useState, useCallback } from 'react'
import { ProductSearchPanel } from './ProductSearchPanel'
import { CartPanel } from './CartPanel'
import { ReceiptModal } from './ReceiptModal'
import { DrawerPrompt } from './DrawerPrompt'
import { useCashDrawer } from '../../hooks/useCashDrawer'
import { usePOSKeyboard } from '../../hooks/usePOSKeyboard'
import type { ITransaction } from '@shared/types/transaction.types'

export default function PosPage() {
  const [completedTxn, setCompletedTxn] = useState<ITransaction | null>(null)
  const { openDrawerQuery } = useCashDrawer()

  const handleFocusSearch = useCallback(() => {
    const searchInput = document.getElementById('pos-search') as HTMLInputElement | null
    searchInput?.focus()
    searchInput?.select()
  }, [])

  const handleEscape = useCallback(() => {
    if (completedTxn) setCompletedTxn(null)
  }, [completedTxn])

  usePOSKeyboard({
    onFocusSearch: handleFocusSearch,
    onEscape: handleEscape,
  })

  // While loading, show a spinner so we don't flash the DrawerPrompt
  if (openDrawerQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: 'var(--border-subtle)', borderTopColor: '#4F46E5' }} />
      </div>
    )
  }

  // Show drawer prompt until a drawer is open
  if (!openDrawerQuery.data) {
    return <DrawerPrompt />
  }

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Left panel: product search + grid */}
      <div className="w-2/3 overflow-y-auto flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>
        <ProductSearchPanel />
      </div>

      {/* Right panel: cart */}
      <div className="w-1/3 flex flex-col" style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)' }}>
        <CartPanel onSaleComplete={(txn) => setCompletedTxn(txn)} />
      </div>

      {/* Receipt modal after sale */}
      {completedTxn && (
        <ReceiptModal
          transaction={completedTxn}
          onClose={() => setCompletedTxn(null)}
        />
      )}
    </div>
  )
}
