// src/main/handlers/registry.ts
import { registerPingHandlers } from './ping.handlers'
import { registerAuthHandlers } from './auth.handlers'
import { registerCategoryHandlers } from './category.handlers'
import { registerProductHandlers } from './product.handlers'
import { registerInventoryHandlers } from './inventory.handlers'
import { registerPosHandlers } from './pos.handlers'
import { registerSupervisorHandlers } from './supervisor.handlers'
import { registerSupplierHandlers } from './supplier.handlers'
import { registerPurchaseOrderHandlers } from './purchase-order.handlers'
import { registerCashDrawerHandlers } from './cash-drawer.handlers'
import { registerDashboardHandlers } from './dashboard.handlers'
import { registerUserHandlers } from './user.handlers'
import { registerRoleHandlers } from './role.handlers'
import { registerSettingsHandlers } from './settings.handlers'
import { registerReportingHandlers } from './reporting.handlers'

export function registerAllHandlers(): void {
  registerPingHandlers()
  registerAuthHandlers()
  registerCategoryHandlers()
  registerProductHandlers()
  registerInventoryHandlers()
  registerPosHandlers()
  registerSupervisorHandlers()
  registerSupplierHandlers()
  registerPurchaseOrderHandlers()
  registerCashDrawerHandlers()
  registerDashboardHandlers()
  registerUserHandlers()
  registerRoleHandlers()
  registerSettingsHandlers()
  registerReportingHandlers()
}
