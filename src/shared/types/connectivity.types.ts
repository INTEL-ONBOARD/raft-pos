export type ConnectivityStatus = 'online' | 'offline'

export interface ConnectivityEvent {
  status: ConnectivityStatus
}
