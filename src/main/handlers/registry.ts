import { registerPingHandlers } from './ping.handlers'
import { registerAuthHandlers } from './auth.handlers'

export function registerAllHandlers(): void {
  registerPingHandlers()
  registerAuthHandlers()
}
