import { useEffect } from 'react'
import { ipc } from './lib/ipc'
import { IPC } from '../../shared/types/ipc.types'
import { useConnectivityStore } from './stores/connectivity.store'
import { ConnectivityOverlay } from './components/ConnectivityOverlay'
import type { ConnectivityEvent } from '../../shared/types/connectivity.types'

export default function App() {
  const setStatus = useConnectivityStore((s) => s.setStatus)

  useEffect(() => {
    const unsub = ipc.on(IPC.APP_CONNECTIVITY, (event) => {
      setStatus((event as ConnectivityEvent).status)
    })
    return unsub
  }, [setStatus])

  return (
    <div className="h-screen w-screen bg-gray-50 font-sans">
      <ConnectivityOverlay />
      {/* Router will go here in Phase 2 */}
      <div className="flex items-center justify-center h-full text-gray-500">
        Raft POS — Phase 1 Scaffold ✓
      </div>
    </div>
  )
}
