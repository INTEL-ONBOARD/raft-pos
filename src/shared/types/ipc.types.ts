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
  SCANNER_BARCODE_SCANNED: 'scanner:barcode-scanned',

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

  // POS / Transactions   — ADD ALL BELOW
  POS_COMPLETE_SALE: 'pos:completeSale',
  POS_VOID_TRANSACTION: 'pos:voidTransaction',
  POS_REFUND_TRANSACTION: 'pos:refundTransaction',
  POS_VALIDATE_SUPERVISOR_PIN: 'pos:validateSupervisorPin',
  POS_GET_TRANSACTION: 'pos:getTransaction',
  POS_GET_TRANSACTIONS: 'pos:getTransactions',
  POS_REPRINT_RECEIPT: 'pos:reprintReceipt',

  // Suppliers
  SUPPLIERS_GET_ALL: 'suppliers:getAll',
  SUPPLIERS_GET_BY_ID: 'suppliers:getById',
  SUPPLIERS_CREATE: 'suppliers:create',
  SUPPLIERS_UPDATE: 'suppliers:update',
  SUPPLIERS_DEACTIVATE: 'suppliers:deactivate',

  // Purchase Orders
  PO_GET_ALL: 'po:getAll',
  PO_GET_BY_ID: 'po:getById',
  PO_CREATE: 'po:create',
  PO_UPDATE: 'po:update',
  PO_SEND: 'po:send',
  PO_RECEIVE: 'po:receive',
  PO_CANCEL: 'po:cancel',

  // Cash Drawer
  DRAWER_OPEN: 'drawer:open',
  DRAWER_CLOSE: 'drawer:close',
  DRAWER_GET_OPEN: 'drawer:getOpen',
  DRAWER_GET_ALL: 'drawer:getAll',
  DRAWER_PRINT_Z_REPORT: 'drawer:printZReport',   // reserved for Phase 7 ESC/POS thermal print; Phase 6 uses window.print() in renderer

  // Dashboard
  DASHBOARD_GET_STATS: 'dashboard:getStats',
} as const

export type IpcChannel = typeof IPC[keyof typeof IPC]
