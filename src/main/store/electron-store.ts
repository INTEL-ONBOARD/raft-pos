import Store from 'electron-store'

const { machineIdSync } = require('node-machine-id') as {
  machineIdSync: (original?: boolean) => string
}

const StoreClass = (
  typeof Store === 'function'
    ? Store
    : (Store as unknown as { default: typeof Store }).default
)

export interface StoreSchema {
  terminalId: string | null
  branchId: string | null
  jwt: string | null
  resumeTokens: Record<string, unknown> // collectionName → resume token object
}

function getDerivedKey(): string {
  try {
    // Derive a machine-specific key so the store is only readable on this machine
    const machineId = machineIdSync(true)
    return `raft-pos-${machineId}`
  } catch {
    // Fallback if node-machine-id fails (e.g., in CI)
    return 'raft-pos-fallback-key-install-node-machine-id'
  }
}

const store = new StoreClass<StoreSchema>({
  name: 'raft-pos-config',
  encryptionKey: getDerivedKey(),
  defaults: {
    terminalId: null, // null = not yet provisioned; configure in Settings
    branchId: null,
    jwt: null,
    resumeTokens: {}
  }
})

export default store
