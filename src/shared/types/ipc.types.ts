// IPC channels — used in both main and renderer
export const IPC = {
  // Connectivity
  APP_CONNECTIVITY: 'app:connectivity',

  // Auth (request-response)
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_VALIDATE_SESSION: 'auth:validate-session',
  AUTH_ME: 'auth:me',

  // Auth (push — main → renderer)
  AUTH_SESSION_REVOKED: 'auth:session-revoked',
  AUTH_SESSION_EXPIRED: 'auth:session-expired',
  SCANNER_UNAVAILABLE: 'scanner:unavailable',

  // Health
  HEALTH_PING: 'health:ping',

  // Change Stream push channels (main → renderer)
  STREAM_TRANSACTIONS: 'stream:transactions',
  STREAM_INVENTORY: 'stream:inventory',
  STREAM_PRODUCTS: 'stream:products',
  STREAM_PURCHASE_ORDERS: 'stream:purchase_orders',
  STREAM_CASH_DRAWERS: 'stream:cash_drawers',
  STREAM_STOCK_TRANSFERS: 'stream:stock_transfers',

  // Categories
  CATEGORIES_GET_ALL: 'categories:getAll',
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_UPDATE: 'categories:update',
  CATEGORIES_DELETE: 'categories:delete',

  // Products
  PRODUCTS_GET_ALL: 'products:getAll',
  PRODUCTS_GET_BY_ID: 'products:getById',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DEACTIVATE: 'products:deactivate',
  PRODUCTS_GET_BY_BARCODE: 'products:getByBarcode',
  PRODUCTS_IMPORT_CSV: 'products:importCsv',

  // Inventory
  INVENTORY_GET_STOCK_LEVELS: 'inventory:getStockLevels',
  INVENTORY_ADJUST: 'inventory:adjust',
  INVENTORY_GET_ADJUSTMENTS: 'inventory:getAdjustments',
} as const

export type IpcChannel = typeof IPC[keyof typeof IPC]
