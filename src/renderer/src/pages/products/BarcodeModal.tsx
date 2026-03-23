import { useEffect, useRef } from 'react'
import { X, Printer, Scan } from 'lucide-react'
import JsBarcode from 'jsbarcode'
import type { IProduct } from '@shared/types/product.types'

interface Props {
  product: IProduct
  onClose: () => void
}

export function BarcodeModal({ product, onClose }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    const value = product.barcode || product.sku
    try {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        lineColor: '#000',
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 12,
        margin: 10
      })
    } catch {
      // invalid barcode value — show error gracefully in UI
    }
  }, [product])

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function handlePrint() {
    const svg = svgRef.current
    if (!svg) return
    const printWindow = window.open('', '_blank', 'width=400,height=300')
    if (!printWindow) return
    printWindow.document.write(`
      <html><head><title>Barcode - ${escapeHtml(product.sku)}</title>
      <style>body { display: flex; flex-direction: column; align-items: center; font-family: sans-serif; padding: 20px; }
      p { margin: 4px 0; font-size: 12px; }</style></head>
      <body>
        <p><strong>${escapeHtml(product.name)}</strong></p>
        <p>SKU: ${escapeHtml(product.sku)}</p>
        ${svg.outerHTML}
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body></html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-panel w-full max-w-[384px] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(79,70,229,0.10)' }}>
              <Scan className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Barcode</h2>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 text-center">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{product.name}</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>SKU: {product.sku}</p>
          <div className="flex justify-center rounded-xl p-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <svg ref={svgRef} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button type="button" onClick={onClose} className="btn-secondary px-5 py-2">Close</button>
          <button onClick={handlePrint} className="btn-primary flex items-center gap-2 px-5 py-2">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>

      </div>
    </div>
  )
}
