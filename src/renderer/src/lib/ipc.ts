export const ipc = {
  invoke: <T = unknown>(channel: string, ...args: unknown[]): Promise<T> =>
    window.ipcBridge.invoke(channel, ...args) as Promise<T>,

  on: (channel: string, callback: (...args: unknown[]) => void): (() => void) =>
    window.ipcBridge.on(channel, callback),

  once: (channel: string, callback: (...args: unknown[]) => void): void =>
    window.ipcBridge.once(channel, callback)
}
