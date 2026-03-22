export const PERMISSIONS = {
  CAN_MAKE_SALE: 'can_make_sale',
  CAN_APPLY_DISCOUNT: 'can_apply_discount',
  CAN_APPLY_ORDER_DISCOUNT: 'can_apply_order_discount',
  CAN_VOID_TRANSACTION: 'can_void_transaction',
  CAN_REFUND_TRANSACTION: 'can_refund_transaction',
  CAN_REPRINT_RECEIPT: 'can_reprint_receipt',
  CAN_MANAGE_PRODUCTS: 'can_manage_products',
  CAN_MANAGE_CATEGORIES: 'can_manage_categories',
  CAN_MANAGE_INVENTORY: 'can_manage_inventory',
  CAN_MANAGE_SUPPLIERS: 'can_manage_suppliers',
  CAN_MANAGE_PURCHASE_ORDERS: 'can_manage_purchase_orders',
  CAN_VIEW_REPORTS: 'can_view_reports',
  CAN_EXPORT_REPORTS: 'can_export_reports',
  CAN_MANAGE_USERS: 'can_manage_users',
  CAN_MANAGE_ROLES: 'can_manage_roles',
  CAN_MANAGE_BRANCHES: 'can_manage_branches',
  CAN_MANAGE_SETTINGS: 'can_manage_settings',
  CAN_OPEN_CLOSE_DRAWER: 'can_open_close_drawer',
  CAN_VIEW_ALL_BRANCHES: 'can_view_all_branches',
  CAN_APPROVE_STOCK_TRANSFER: 'can_approve_stock_transfer',
  CAN_RECEIVE_STOCK_TRANSFER: 'can_receive_stock_transfer',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]
export const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[]
