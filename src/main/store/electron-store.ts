import Store from 'electron-store'

export interface StoreSchema {
  terminalId: string | null
  branchId: string | null
  jwt: string | null
  resumeTokens: Record<string, unknown> // collectionName → resume token object
}

const store = new Store<StoreSchema>({
  name: 'raft-pos-config',
  encryptionKey: 'raft-pos-machine-key', // TODO: derive from machine UUID in production
  defaults: {
    terminalId: 'T01',
    branchId: null,
    jwt: null,
    resumeTokens: {}
  }
})

export default store
