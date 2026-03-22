import { useConnectivityStore } from '../stores/connectivity.store'
import { WifiOff } from 'lucide-react'

export function ConnectivityOverlay() {
  const status = useConnectivityStore((s) => s.status)

  if (status === 'online') return null

  return (
    <div className="fixed inset-0 z-9999 bg-black/70 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-4 max-w-sm w-full mx-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">No Internet Connection</h2>
        <p className="text-gray-500 text-center text-sm">
          Raft POS requires an active internet connection. Please check your network and try again.
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          Waiting for connection...
        </div>
      </div>
    </div>
  )
}
