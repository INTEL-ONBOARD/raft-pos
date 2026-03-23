import { useConnectivityStore } from '../stores/connectivity.store'
import { WifiOff } from 'lucide-react'

export function ConnectivityOverlay() {
  const status = useConnectivityStore((s) => s.status)

  if (status === 'online') return null

  return (
    <div className="modal-overlay fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="modal-panel rounded-2xl p-10 flex flex-col items-center gap-4 max-w-sm w-full mx-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)' }}>
          <WifiOff className="w-8 h-8" style={{ color: '#dc2626' }} />
        </div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>No Internet Connection</h2>
        <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          Raft POS requires an active internet connection. Please check your network and try again.
        </p>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#dc2626' }} />
          Waiting for connection...
        </div>
      </div>
    </div>
  )
}
