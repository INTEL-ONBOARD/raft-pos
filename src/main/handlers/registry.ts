import { registerPingHandlers } from './ping.handlers'

export function registerAllHandlers(): void {
  registerPingHandlers()
  // Future handlers registered here as phases progress
}
