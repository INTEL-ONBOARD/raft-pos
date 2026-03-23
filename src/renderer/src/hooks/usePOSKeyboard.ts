// src/renderer/src/hooks/usePOSKeyboard.ts
import { useEffect } from 'react'

interface UsePOSKeyboardOptions {
  /** Called when F2 is pressed — should focus the product search input */
  onFocusSearch?: () => void
  /** Called when Escape is pressed — should close any active modal */
  onEscape?: () => void
  /** Called when F8 is pressed — should trigger Pay if cart is ready */
  onPay?: () => void
}

/**
 * Global keyboard shortcuts for the POS screen.
 * F2  → focus product search
 * F8  → trigger Pay (when cart + payments are ready)
 * Esc → close active modal / cancel current action
 */
export function usePOSKeyboard({ onFocusSearch, onEscape, onPay }: UsePOSKeyboardOptions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept when typing in an input/textarea/select
      const tag = (e.target as HTMLElement).tagName
      const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

      switch (e.key) {
        case 'F2':
          e.preventDefault()
          onFocusSearch?.()
          break
        case 'F8':
          e.preventDefault()
          onPay?.()
          break
        case 'Escape':
          // Escape works even inside inputs
          onEscape?.()
          break
        case 'Enter':
          // Enter triggers pay only when not in an editable field
          if (!isEditable) {
            onPay?.()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onFocusSearch, onEscape, onPay])
}
