# Refined Enterprise UI Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Raft POS from a flat light-theme UI to a polished Refined Enterprise design — stronger typographic hierarchy, layered shadow system, upgraded component library, improved sidebar, and deep per-page redesigns across all 15 screens.

**Architecture:** Phase 1 upgrades the CSS token/component foundation in `index.css` so all pages inherit improvements automatically. Phases 2–6 then do targeted TSX edits per file — sidebar, dashboard, POS panels, table pages, and modals — following the spec's visual patterns. No new npm dependencies, no routing changes, no API changes.

**Tech Stack:** React 18, TypeScript, Tailwind v4, Electron, React Router v6, Lucide React icons, custom SVG charts (no charting library).

**Spec:** `docs/superpowers/specs/2026-03-23-refined-enterprise-ui-overhaul-design.md`

---

## File Map

| File | Phase | Change type |
|------|-------|-------------|
| `src/renderer/src/assets/index.css` | 1 | Full token + component class upgrade |
| `src/renderer/src/components/layout/Sidebar.tsx` | 2 | Rebuild brand area + nav item styles + user footer |
| `src/renderer/src/components/layout/SidebarItem.tsx` | 2 | Add `border-left` transparent baseline |
| `src/renderer/src/pages/dashboard/DashboardPage.tsx` | 3 | Period toggle, KPI cards, chart, best sellers, stock alerts |
| `src/renderer/src/pages/pos/ProductSearchPanel.tsx` | 4 | Product card redesign, search bar, category pills |
| `src/renderer/src/pages/pos/CartPanel.tsx` | 4 | Cart item cards, qty stepper, totals, Pay button |
| `src/renderer/src/pages/products/ProductsPage.tsx` | 5 | Page header icon, filter row, table upgrade, row action opacity |
| `src/renderer/src/pages/inventory/InventoryPage.tsx` | 5 | Same universal table pattern |
| `src/renderer/src/pages/transactions/TransactionsPage.tsx` | 5 | Same universal table pattern |
| `src/renderer/src/pages/users/UsersPage.tsx` | 5 | Same universal table pattern |
| `src/renderer/src/pages/suppliers/SuppliersPage.tsx` | 5 | Same universal table pattern |
| `src/renderer/src/pages/roles/RolesPage.tsx` | 5 | Same universal table pattern |
| `src/renderer/src/pages/categories/CategoriesPage.tsx` | 5 | Page header + card pattern |
| `src/renderer/src/pages/purchase-orders/PurchaseOrdersPage.tsx` | 5 | Status tabs + table pattern |
| `src/renderer/src/pages/cash-drawer/CashDrawerPage.tsx` | 5 | Page header + card pattern (no table) |
| `src/renderer/src/pages/reporting/ReportingPage.tsx` | 5 | Report-type tabs + table pattern |
| `src/renderer/src/pages/pos/PaymentModal.tsx` | 6 | Modal pattern + payment tabs |
| `src/renderer/src/pages/pos/SupervisorPinModal.tsx` | 6 | Modal pattern |
| `src/renderer/src/pages/pos/ReceiptModal.tsx` | 6 | Modal pattern |
| `src/renderer/src/pages/pos/DrawerPrompt.tsx` | 6 | Modal pattern |
| `src/renderer/src/pages/products/ProductFormModal.tsx` | 6 | Modal pattern + form labels |
| `src/renderer/src/pages/products/BarcodeModal.tsx` | 6 | Modal pattern |
| `src/renderer/src/pages/inventory/AdjustmentModal.tsx` | 6 | Modal pattern |
| `src/renderer/src/pages/purchase-orders/ReceivePOModal.tsx` | 6 | Modal pattern |
| `src/renderer/src/pages/transactions/VoidModal.tsx` | 6 | Modal pattern |
| `src/renderer/src/pages/transactions/RefundModal.tsx` | 6 | Modal pattern |
| `src/renderer/src/pages/transactions/TransactionDetailModal.tsx` | 6 | Modal pattern |
| `src/renderer/src/pages/users/UserFormModal.tsx` | 6 | Modal pattern + form labels |
| `src/renderer/src/pages/users/UserActivityModal.tsx` | 6 | Modal pattern |
| `src/renderer/src/pages/suppliers/SupplierFormModal.tsx` | 6 | Modal pattern + form labels |
| `src/renderer/src/pages/roles/RoleFormModal.tsx` | 6 | Modal pattern + permissions grid |

---

## Verification Command

After every task run:
```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && npm run typecheck
```
Expected: `ok (no errors)`

---

## Phase 1 — CSS Foundation

### Task 1: Upgrade CSS design tokens and all component classes

**Files:**
- Modify: `src/renderer/src/assets/index.css` (full file replacement)

**Context:** The current `index.css` has a `:root` block with basic tokens and component classes. We are replacing the entire `:root` block to add shadow tokens, semantic bg tokens (`--bg-subtle`, `--bg-hover`), semantic border tokens (`--color-*-border`, `--color-danger-hover`), badge tokens, and rank tokens. We are also upgrading every component class in-place — no class renames, just style improvements.

- [ ] **Step 1: Replace the entire `index.css` content** with the following:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
@import "tailwindcss";

/* ─── Design Tokens ───────────────────────────────────────── */
:root {
  /* Backgrounds */
  --bg-base:     #f4f5f7;
  --bg-surface:  #ffffff;
  --bg-card:     #ffffff;
  --bg-elevated: #ffffff;
  --bg-subtle:   #f9fafb;
  --bg-hover:    #f3f4f6;

  /* Text */
  --text-primary:   #111827;
  --text-secondary: rgba(17,24,39,0.58);
  --text-muted:     rgba(17,24,39,0.38);
  --text-disabled:  rgba(17,24,39,0.24);

  /* Accent — Indigo */
  --accent:        #4F46E5;
  --accent-hover:  #4338CA;
  --accent-light:  #EEF2FF;
  --accent-muted:  rgba(79,70,229,0.08);

  /* Semantic */
  --color-success:        #16a34a;
  --color-success-bg:     #f0fdf4;
  --color-success-border: rgba(22,163,74,0.20);
  --color-warning:        #d97706;
  --color-warning-bg:     #fffbeb;
  --color-warning-border: rgba(217,119,6,0.20);
  --color-danger:         #dc2626;
  --color-danger-hover:   #b91c1c;
  --color-danger-bg:      #fef2f2;
  --color-danger-border:  rgba(220,38,38,0.20);

  /* Badge tokens */
  --badge-blue-bg:     #eff6ff;
  --badge-blue-text:   #1d4ed8;
  --badge-gray-bg:     #f3f4f6;
  --badge-gray-text:   #4b5563;
  --badge-purple-bg:   #f5f3ff;
  --badge-purple-text: #7c3aed;
  --badge-orange-bg:   #fff7ed;
  --badge-orange-text: #c2410c;

  /* Rank badges (Best Sellers dashboard) */
  --rank-gold:       #b45309;
  --rank-gold-bg:    #fef3c7;
  --rank-silver:     #4b5563;
  --rank-silver-bg:  #f3f4f6;
  --rank-bronze:     #92400e;
  --rank-bronze-bg:  #fef3c7;

  /* Borders */
  --border-subtle:  rgba(17,24,39,0.06);
  --border-default: rgba(17,24,39,0.10);
  --border-strong:  rgba(17,24,39,0.18);

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(17,24,39,0.05);
  --shadow-sm: 0 1px 3px rgba(17,24,39,0.08), 0 1px 2px rgba(17,24,39,0.04);
  --shadow-md: 0 4px 6px rgba(17,24,39,0.07), 0 2px 4px rgba(17,24,39,0.04);
  --shadow-lg: 0 10px 15px rgba(17,24,39,0.08), 0 4px 6px rgba(17,24,39,0.04);

  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-base: 200ms ease-out;
}

html, body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg-base);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ─── Sidebar nav items ────────────────────────────────────── */
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  height: 36px;
  padding: 0 0.625rem;
  padding-left: 0.625rem;
  border-radius: 0.5rem;
  margin: 1px 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  cursor: pointer;
  text-decoration: none;
  border-left: 3px solid transparent;
}
.nav-item:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
  border-left: 3px solid transparent;
}
.nav-item.active {
  color: var(--accent);
  background: var(--accent-light);
  font-weight: 600;
  border-left: 3px solid var(--accent);
  padding-left: 7px; /* 10px - 3px border = 7px to maintain visual alignment */
}
.nav-item:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ─── Dark cards ──────────────────────────────────────────── */
.dark-card {
  background: var(--bg-card);
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
}
.dark-card-sm {
  background: var(--bg-surface);
  border-radius: 0.75rem;
  border: 1px solid var(--border-subtle);
}

/* ─── Content cards ───────────────────────────────────────── */
.content-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

/* ─── Stat cards (dashboard KPIs) ────────────────────────── */
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-base), transform var(--transition-base);
  cursor: default;
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* ─── Modal panel ─────────────────────────────────────────── */
.modal-panel {
  background: var(--bg-elevated);
  border-radius: 1rem;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-lg);
}

/* ─── Modal overlay ───────────────────────────────────────── */
.modal-overlay {
  background: rgba(17,24,39,0.45);
  backdrop-filter: blur(2px);
}

/* ─── Inputs ──────────────────────────────────────────────── */
.dark-input {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 0.5rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  font-family: inherit;
  padding: 0 0.75rem;
  height: 36px;
  width: 100%;
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  resize: none;
}
.dark-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
}
.dark-input::placeholder {
  color: var(--text-muted);
}
textarea.dark-input {
  height: auto;
  padding: 0.5rem 0.75rem;
  resize: none;
}

/* ─── Select ──────────────────────────────────────────────── */
.dark-select {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 0.5rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  font-family: inherit;
  padding: 0 0.75rem;
  height: 36px;
  width: 100%;
  outline: none;
  cursor: pointer;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.dark-select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
}
.dark-select option { background: #ffffff; color: var(--text-primary); }

/* ─── Buttons ─────────────────────────────────────────────── */
.btn-primary {
  background: var(--accent);
  color: #ffffff;
  border-radius: 0.5rem;
  padding: 0 0.875rem;
  height: 36px;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  font-family: inherit;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  box-shadow: var(--shadow-xs);
  transition: background var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
}
.btn-primary:hover {
  background: var(--accent-hover);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}
.btn-primary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: var(--bg-surface);
  color: var(--text-primary);
  border-radius: 0.5rem;
  padding: 0 0.875rem;
  height: 36px;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid var(--border-default);
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}
.btn-secondary:hover {
  background: var(--bg-hover);
  border-color: var(--border-strong);
}
.btn-secondary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  background: var(--color-danger);
  color: #ffffff;
  border-radius: 0.5rem;
  padding: 0 0.875rem;
  height: 36px;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  font-family: inherit;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  box-shadow: var(--shadow-xs);
  transition: background var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
}
.btn-danger:hover {
  background: var(--color-danger-hover);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}
.btn-danger:focus-visible {
  outline: 2px solid var(--color-danger);
  outline-offset: 2px;
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* ─── Status badges ───────────────────────────────────────── */
.badge-green  { display:inline-flex;align-items:center;white-space:nowrap;background:var(--color-success-bg);color:var(--color-success);border-radius:9999px;padding:0.125rem 0.5rem;font-size:0.6875rem;font-weight:500; }
.badge-red    { display:inline-flex;align-items:center;white-space:nowrap;background:var(--color-danger-bg);color:var(--color-danger);border-radius:9999px;padding:0.125rem 0.5rem;font-size:0.6875rem;font-weight:500; }
.badge-yellow { display:inline-flex;align-items:center;white-space:nowrap;background:var(--color-warning-bg);color:var(--color-warning);border-radius:9999px;padding:0.125rem 0.5rem;font-size:0.6875rem;font-weight:500; }
.badge-gray   { display:inline-flex;align-items:center;white-space:nowrap;background:var(--badge-gray-bg);color:var(--badge-gray-text);border-radius:9999px;padding:0.125rem 0.5rem;font-size:0.6875rem;font-weight:500; }
.badge-blue   { display:inline-flex;align-items:center;white-space:nowrap;background:var(--badge-blue-bg);color:var(--badge-blue-text);border-radius:9999px;padding:0.125rem 0.5rem;font-size:0.6875rem;font-weight:500; }
.badge-purple { display:inline-flex;align-items:center;white-space:nowrap;background:var(--badge-purple-bg);color:var(--badge-purple-text);border-radius:9999px;padding:0.125rem 0.5rem;font-size:0.6875rem;font-weight:500; }
.badge-orange { display:inline-flex;align-items:center;white-space:nowrap;background:var(--badge-orange-bg);color:var(--badge-orange-text);border-radius:9999px;padding:0.125rem 0.5rem;font-size:0.6875rem;font-weight:500; }

/* ─── Page header ─────────────────────────────────────────── */
.page-header {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  box-shadow: var(--shadow-xs);
}

/* ─── Table styles ────────────────────────────────────────── */
.dark-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}
.dark-table thead th {
  text-align: left;
  padding: 0.625rem 1rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--bg-subtle);
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}
.dark-table tbody td {
  padding: 0.875rem 1rem;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
  transition: background var(--transition-fast);
}
.dark-table tbody td:first-child {
  font-weight: 500;
  color: var(--text-primary);
}
.dark-table tbody tr:hover td {
  background: var(--bg-subtle);
}
.dark-table tbody tr:last-child td {
  border-bottom: none;
}
/* Row action buttons hidden until row hover */
.dark-table tbody td.row-actions {
  opacity: 0;
  transition: opacity var(--transition-fast);
}
.dark-table tbody tr:hover td.row-actions {
  opacity: 1;
}

/* ─── Skeleton / shimmer loading ─────────────────────────── */
@keyframes shimmer {
  0%   { background-position: -800px 0; }
  100% { background-position: 800px 0; }
}
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-subtle) 25%,
    rgba(17,24,39,0.04) 50%,
    var(--bg-subtle) 75%
  );
  background-size: 800px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  border-radius: 0.375rem;
}

/* ─── POS category card pastels ───────────────────────────── */
.cat-pink    { background: #fce7ef; }
.cat-mint    { background: #d1fae5; }
.cat-lavender{ background: #ede9fe; }
.cat-sky     { background: #dbeafe; }
.cat-peach   { background: #fef3c7; }
.cat-lemon   { background: #fefce8; }
.cat-rose    { background: #ffe4e6; }
.cat-teal    { background: #ccfbf1; }

/* ─── Reduced motion ──────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}

@media print {
  html, body { background: white !important; animation: none !important; }
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && npm run typecheck
```
Expected: `ok (no errors)`

- [ ] **Step 3: Commit**

```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && git add src/renderer/src/assets/index.css && git commit -m "style: upgrade design token system and all component CSS classes"
```

---

## Phase 2 — Sidebar

### Task 2: Rebuild Sidebar brand area, nav items, and user footer

**Files:**
- Modify: `src/renderer/src/components/layout/Sidebar.tsx`
- Modify: `src/renderer/src/components/layout/SidebarItem.tsx`

**Context:** `SidebarItem.tsx` uses `NavLink` with `nav-item` + `active` classes — CSS handles active state. The `.nav-item` class was upgraded in Task 1 to include `border-left: 3px solid transparent` on inactive/hover and `border-left: 3px solid var(--accent)` on active, preventing layout shift. `Sidebar.tsx` needs its brand area, section labels, and user footer rebuilt.

- [ ] **Step 1: Replace `SidebarItem.tsx`** with:

```tsx
// src/renderer/src/components/layout/SidebarItem.tsx
import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface SidebarItemProps {
  to: string
  icon: LucideIcon
  label: string
}

export function SidebarItem({ to, icon: Icon, label }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      aria-current={undefined}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  )
}
```

- [ ] **Step 2: Replace `Sidebar.tsx`** with:

```tsx
// src/renderer/src/components/layout/Sidebar.tsx
import {
  LayoutDashboard, ShoppingCart, Package, FolderOpen,
  Warehouse, ClipboardList, Truck, ArrowLeftRight,
  BarChart3, Users, Shield, Settings, CreditCard, LogOut,
  ShoppingBag
} from 'lucide-react'
import { SidebarItem } from './SidebarItem'
import { useAuth } from '../../hooks/useAuth'
import { ipc } from '../../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import { PERMISSIONS } from '@shared/types/permissions'

const AVATAR_COLORS = [
  { bg: 'rgba(79,70,229,0.12)',  color: '#4338CA' },
  { bg: 'rgba(22,163,74,0.12)',  color: '#15803d' },
  { bg: 'rgba(217,119,6,0.12)',  color: '#b45309' },
  { bg: 'rgba(220,38,38,0.12)',  color: '#dc2626' },
  { bg: 'rgba(29,78,216,0.12)',  color: '#1d4ed8' },
  { bg: 'rgba(124,58,237,0.12)', color: '#7c3aed' },
  { bg: 'rgba(13,148,136,0.12)', color: '#0d9488' },
  { bg: 'rgba(194,65,12,0.12)',  color: '#c2410c' },
]

function getAvatarColor(name: string) {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

function NavSection({ label }: { label: string }) {
  return (
    <p
      aria-label={`${label} section`}
      style={{
        fontSize: '0.625rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        padding: '16px 20px 4px',
      }}
    >
      {label}
    </p>
  )
}

export function Sidebar() {
  const { user, role, clearAuth, hasPermission } = useAuth()

  async function handleLogout() {
    try { await ipc.invoke(IPC.AUTH_LOGOUT) } finally { clearAuth() }
  }

  const avatarColor = user?.name ? getAvatarColor(user.name) : AVATAR_COLORS[0]
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <div
      className="flex flex-col h-screen w-48 shrink-0"
      style={{ background: '#ffffff', borderRight: '1px solid var(--border-subtle)' }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-2.5 px-4"
        style={{ minHeight: '64px', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: '32px', height: '32px',
            borderRadius: '8px',
            background: 'var(--accent-light)',
          }}
        >
          <ShoppingBag className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            Raft POS
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.2 }}>
            Point of Sale
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 pt-2 pb-4 overflow-y-auto">
        <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        {hasPermission(PERMISSIONS.CAN_MAKE_SALE) && (
          <SidebarItem to="/orders" icon={ShoppingCart} label="Orders" />
        )}

        <NavSection label="Inventory" />
        {hasPermission(PERMISSIONS.CAN_MANAGE_PRODUCTS) && (
          <SidebarItem to="/products" icon={Package} label="Products" />
        )}
        {hasPermission(PERMISSIONS.CAN_MANAGE_CATEGORIES) && (
          <SidebarItem to="/categories" icon={FolderOpen} label="Categories" />
        )}
        {hasPermission(PERMISSIONS.CAN_MANAGE_INVENTORY) && (
          <SidebarItem to="/inventory" icon={Warehouse} label="Inventory" />
        )}
        {hasPermission(PERMISSIONS.CAN_MANAGE_PURCHASE_ORDERS) && (
          <SidebarItem to="/purchase-orders" icon={ClipboardList} label="Purchase Orders" />
        )}
        {hasPermission(PERMISSIONS.CAN_MANAGE_SUPPLIERS) && (
          <SidebarItem to="/suppliers" icon={Truck} label="Suppliers" />
        )}

        <NavSection label="Finance" />
        {hasPermission(PERMISSIONS.CAN_VIEW_REPORTS) && (
          <SidebarItem to="/reporting" icon={BarChart3} label="Reports" />
        )}
        {hasPermission(PERMISSIONS.CAN_OPEN_CLOSE_DRAWER) && (
          <SidebarItem to="/cash-drawer" icon={CreditCard} label="Cash Drawer" />
        )}
        {(hasPermission(PERMISSIONS.CAN_VOID_TRANSACTION) || hasPermission(PERMISSIONS.CAN_REFUND_TRANSACTION) || hasPermission(PERMISSIONS.CAN_REPRINT_RECEIPT)) && (
          <SidebarItem to="/transactions" icon={ArrowLeftRight} label="Transactions" />
        )}

        <NavSection label="Admin" />
        {hasPermission(PERMISSIONS.CAN_MANAGE_USERS) && (
          <SidebarItem to="/users" icon={Users} label="Users" />
        )}
        {hasPermission(PERMISSIONS.CAN_MANAGE_ROLES) && (
          <SidebarItem to="/roles" icon={Shield} label="Roles" />
        )}
        {hasPermission(PERMISSIONS.CAN_MANAGE_SETTINGS) && (
          <SidebarItem to="/settings" icon={Settings} label="Settings" />
        )}
      </nav>

      {/* User footer */}
      <div
        className="px-3 py-3 flex items-center gap-2.5"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
          style={{ background: avatarColor.bg, color: avatarColor.color }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {user?.name}
          </p>
          <p className="truncate" style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
            {role?.name ?? 'Staff'}
          </p>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          className="shrink-0 p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-danger)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run typecheck**

```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && npm run typecheck
```
Expected: `ok (no errors)`

- [ ] **Step 4: Commit**

```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && git add src/renderer/src/components/layout/Sidebar.tsx src/renderer/src/components/layout/SidebarItem.tsx && git commit -m "style: rebuild sidebar brand area, nav items, and user footer"
```

---

## Phase 3 — Dashboard

### Task 3: Upgrade Dashboard — period toggle, KPI cards, chart, best sellers, stock alerts

**Files:**
- Modify: `src/renderer/src/pages/dashboard/DashboardPage.tsx`

**Context:** The dashboard already has KPICard, RevenueTrendPanel, BestSellersPanel, and StockAlertsPanel sub-components defined in the same file. The upgrades are:
1. Add period toggle state (Today/7D/30D) — purely visual, client-side only, same data shown regardless. Add `// TODO: wire to comparison API` comment.
2. KPICard: bigger number (text-3xl → 36px, 800 weight), icon circle upgrade (slightly larger, 40px).
3. RevenueTrendPanel: smoother bezier curve path instead of straight `L` segments, larger chart area (height 140), gradient opacity upgrade.
4. BestSellersPanel: rank badges using `--rank-*` tokens, horizontal revenue progress bars.
5. StockAlertsPanel: two-column layout (critical left, low stock right), left border per item, footer counts.
6. Layout grid: switch main grid from 2-col equal to `lg:grid-cols-5` (3+2 split).

- [ ] **Step 1: Read the full current `DashboardPage.tsx`**

Read: `src/renderer/src/pages/dashboard/DashboardPage.tsx`

- [ ] **Step 2: Rewrite `DashboardPage.tsx`** — apply all upgrades described above. Key patterns:

**Period toggle** (add above KPI grid, right-aligned in header):
```tsx
const [period, setPeriod] = useState<'today' | '7d' | '30d'>('today')
// TODO: wire to comparison API — currently shows same data for all periods

// Period toggle JSX:
<div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
  {(['today', '7d', '30d'] as const).map((p) => (
    <button
      key={p}
      onClick={() => setPeriod(p)}
      className="px-3 py-1 rounded-md text-xs font-medium transition-all"
      style={period === p
        ? { background: 'var(--accent)', color: '#ffffff', boxShadow: 'var(--shadow-xs)' }
        : { color: 'var(--text-muted)' }
      }
    >
      {p === 'today' ? 'Today' : p === '7d' ? '7 Days' : '30 Days'}
    </button>
  ))}
</div>
```

**KPICard number size** — change from `text-3xl font-bold` to `style={{ fontSize: '2rem', fontWeight: 800 }}`

**KPI icon circle** — change from `w-9 h-9` to `w-10 h-10`

**RevenueTrendPanel bezier path** — replace straight `L` path with smooth bezier:
```tsx
// Replace linePath construction:
function catmullRom(points: [number, number][]): string {
  if (points.length < 2) return ''
  let d = `M${points[0][0]},${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`
  }
  return d
}
const pts: [number, number][] = xs.map((x, i) => [x, ys[i]])
const linePath = catmullRom(pts)
const areaPath = linePath
  + ` L${xs[xs.length - 1]},${H - pad.b} L${xs[0]},${H - pad.b} Z`
```

**Chart gradient** — upgrade opacity:
```tsx
<stop offset="0%" stopColor="#4F46E5" stopOpacity="0.15" />
<stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
```

**BestSellersPanel rank badges** — replace numbered span with:
```tsx
const rankStyle = (rank: number) => {
  if (rank === 1) return { bg: 'var(--rank-gold-bg)', color: 'var(--rank-gold)' }
  if (rank === 2) return { bg: 'var(--rank-silver-bg)', color: 'var(--rank-silver)' }
  if (rank === 3) return { bg: 'var(--rank-bronze-bg)', color: 'var(--rank-bronze)' }
  return { bg: 'var(--badge-gray-bg)', color: 'var(--badge-gray-text)' }
}
// Usage:
<span
  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
  style={{ background: rankStyle(i+1).bg, color: rankStyle(i+1).color }}
>
  {i + 1}
</span>
```

**BestSellersPanel revenue bar** — add below each product name:
```tsx
{/* Revenue progress bar */}
<div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
  <div
    className="h-full rounded-full"
    style={{
      width: `${maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0}%`,
      background: 'var(--accent)',
      opacity: 0.6
    }}
  />
</div>
```
(Compute `maxRevenue = Math.max(...sellers.map(s => s.revenue), 1)` before the map)

**StockAlertsPanel two-column layout** — split `critical` (stock <= 0 or below critical threshold) and `low` (above critical but below reorder) items into two arrays, render in `grid-cols-2`. Each item row gets `border-left: 3px solid` (red for critical, amber for low).

**Dashboard page header** — add subtitle with user greeting:
```tsx
const firstName = user?.name?.split(' ')[0] ?? 'there'
// In header left:
<div>
  <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Dashboard</h1>
  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>
    Good morning, {firstName}
  </p>
</div>
```

**Main grid** — change from `grid-cols-1 lg:grid-cols-2` to `grid-cols-1 lg:grid-cols-5` with `lg:col-span-3` on trend panel and `lg:col-span-2` on best sellers.

- [ ] **Step 3: Run typecheck**

```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && npm run typecheck
```
Expected: `ok (no errors)`

- [ ] **Step 4: Commit**

```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && git add src/renderer/src/pages/dashboard/DashboardPage.tsx && git commit -m "style: upgrade dashboard — period toggle, KPI cards, chart bezier, best sellers, stock alerts"
```

---

## Phase 4 — POS Screen

### Task 4a: Upgrade ProductSearchPanel

**Files:**
- Modify: `src/renderer/src/pages/pos/ProductSearchPanel.tsx`

**Context:** Current file has product grid `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`, basic product cards, category pills, search bar. Upgrades: taller search (40px), price in indigo at 18px, product card hover with indigo border, `active:scale-[0.97]` press, skeleton loading state.

- [ ] **Step 1: Read current `ProductSearchPanel.tsx`** to see exact structure before editing.

- [ ] **Step 2: Apply these targeted edits to `ProductSearchPanel.tsx`:**

**Search input height** — change input `className="dark-input w-full pl-9"` to add `style={{ height: '40px', borderRadius: '10px', boxShadow: 'var(--shadow-xs)' }}`

**Category pills** — replace existing pill buttons with:
```tsx
<button
  onClick={() => setActiveCategoryId(null)}
  className="transition-all"
  style={{
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 500,
    height: '28px',
    padding: '0 12px',
    ...(activeCategoryId === null
      ? { background: 'var(--accent)', color: '#ffffff' }
      : { background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }
    )
  }}
>
  All
</button>
```
(Same pattern for each category button)

**Product card** — replace the `<button>` style block with:
```tsx
<button
  key={product._id}
  onClick={() => !outOfStock && handleAddProduct(product)}
  disabled={outOfStock}
  className={`text-left transition-all rounded-xl p-3.5 ${outOfStock ? 'opacity-45 cursor-not-allowed' : 'active:scale-[0.97] cursor-pointer'}`}
  style={{
    background: '#ffffff',
    border: '1px solid var(--border-subtle)',
    outline: 'none',
    boxShadow: 'var(--shadow-xs)'
  }}
  onMouseEnter={(e) => {
    if (!outOfStock) {
      const el = e.currentTarget as HTMLButtonElement
      el.style.borderColor = 'rgba(79,70,229,0.3)'
      el.style.boxShadow = 'var(--shadow-sm)'
      el.style.background = '#f8f9ff'
    }
  }}
  onMouseLeave={(e) => {
    if (!outOfStock) {
      const el = e.currentTarget as HTMLButtonElement
      el.style.borderColor = 'var(--border-subtle)'
      el.style.boxShadow = 'var(--shadow-xs)'
      el.style.background = '#ffffff'
    }
  }}
>
  {/* SKU + stock dot */}
  <div className="flex items-center justify-between mb-1.5">
    <p className="text-xs font-mono truncate" style={{ color: 'var(--text-muted)' }}>{product.sku}</p>
    <span
      className="w-2 h-2 rounded-full shrink-0 ml-2"
      style={{
        background: outOfStock ? 'var(--color-danger)' : 'var(--color-success)',
        boxShadow: outOfStock ? '0 0 5px rgba(220,38,38,0.35)' : '0 0 5px rgba(22,163,74,0.35)'
      }}
    />
  </div>
  <p className="text-sm font-semibold mt-0.5 line-clamp-2 leading-snug" style={{ color: 'var(--text-primary)' }}>
    {product.name}
  </p>
  <p className="font-bold mt-2" style={{ fontSize: '18px', color: 'var(--accent)' }}>
    &#8369;{product.sellingPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
  </p>
  <p className="text-xs mt-1.5" style={{ color: outOfStock ? 'var(--color-danger)' : 'var(--text-muted)' }}>
    {outOfStock ? 'Out of stock' : `${stock} ${product.unit} in stock`}
  </p>
</button>
```

**Loading state** — replace loading spinner with skeleton grid:
```tsx
{productsQuery.isLoading ? (
  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="skeleton rounded-xl" style={{ height: '120px' }} />
    ))}
  </div>
) : ...
```

- [ ] **Step 3: Run typecheck**

```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && npm run typecheck
```
Expected: `ok (no errors)`

- [ ] **Step 4: Commit**

```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && git add src/renderer/src/pages/pos/ProductSearchPanel.tsx && git commit -m "style: upgrade POS product search panel — card design, price in accent, skeleton loading"
```

---

### Task 4b: Upgrade CartPanel

**Files:**
- Modify: `src/renderer/src/pages/pos/CartPanel.tsx`

**Context:** CartPanel has cart items list, totals section, and Pay button. Upgrades: cart item as card (white, border, border-radius), pill-style quantity stepper, larger Pay button (56px), totals upgrade.

- [ ] **Step 1: Read current `CartPanel.tsx`** to see exact structure.

- [ ] **Step 2: Apply these targeted edits:**

**Cart header** — add item count badge next to "Cart" title:
```tsx
<div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
  <div className="flex items-center gap-2">
    <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Cart</h2>
    {items.length > 0 && (
      <span className="badge-blue">{items.length}</span>
    )}
  </div>
  {items.length > 0 && (
    <button
      onClick={clearCart}
      className="p-1.5 rounded-lg transition-colors"
      style={{ color: 'var(--text-muted)' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-danger)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
      title="Clear cart"
      aria-label="Clear cart"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )}
</div>
```

**Each cart item** — wrap in a card:
```tsx
<div
  className="rounded-xl p-3 mb-2"
  style={{ background: '#ffffff', border: '1px solid var(--border-subtle)' }}
>
  {/* Top row: name + remove button */}
  <div className="flex items-start justify-between gap-2 mb-1">
    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }} className="line-clamp-2 flex-1">
      {item.name}
    </p>
    <button onClick={() => removeItem(item.productId)} className="shrink-0 p-0.5 rounded"
      style={{ color: 'var(--text-muted)' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-danger)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
      <X className="w-3.5 h-3.5" />
    </button>
  </div>
  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>₱{item.unitPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })} / {item.unit}</p>

  {/* Qty stepper + line total */}
  <div className="flex items-center justify-between mt-2">
    {/* Pill qty stepper */}
    <div className="flex items-center" style={{ border: '1px solid var(--border-default)', borderRadius: '999px', height: '28px', overflow: 'hidden' }}>
      <button
        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
        className="flex items-center justify-center transition-colors"
        style={{ width: '28px', height: '28px', color: 'var(--text-secondary)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <Minus className="w-3 h-3" />
      </button>
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', minWidth: '24px', textAlign: 'center' }}>
        {item.quantity}
      </span>
      <button
        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
        className="flex items-center justify-center transition-colors"
        style={{ width: '28px', height: '28px', color: 'var(--text-secondary)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
      ₱{(item.unitPrice * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
    </p>
  </div>

  {/* Stock warning */}
  {item.quantity > item.availableStock && (
    <p className="text-xs mt-1" style={{ color: 'var(--color-warning)' }}>
      Warning: only {item.availableStock} in stock
    </p>
  )}
</div>
```

**Pay button** — replace existing Pay button with:
```tsx
<button
  onClick={handlePay}
  disabled={items.length === 0 || isPaying}
  className="w-full flex items-center justify-center gap-2 font-semibold transition-all"
  style={{
    height: '56px',
    borderRadius: '10px',
    background: 'var(--accent)',
    color: '#ffffff',
    fontSize: '16px',
    letterSpacing: '-0.01em',
    border: 'none',
    cursor: items.length === 0 ? 'not-allowed' : 'pointer',
    opacity: items.length === 0 ? 0.5 : 1,
    boxShadow: items.length > 0 ? 'var(--shadow-sm)' : 'none',
  }}
  onMouseEnter={e => { if (items.length > 0) { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}}
  onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = items.length > 0 ? 'var(--shadow-sm)' : 'none' }}
>
  {isPaying ? (
    <span className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#ffffff' }} />
  ) : (
    <>
      Pay ₱{totals.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
      <ArrowRight className="w-4 h-4" />
    </>
  )}
</button>
```

**Total row** — upgrade font sizes:
```tsx
<div className="flex justify-between font-bold pt-2" style={{ color: 'var(--text-primary)', borderTop: '2px solid var(--border-default)', marginTop: '8px' }}>
  <span style={{ fontSize: '16px', fontWeight: 600 }}>Total</span>
  <span style={{ fontSize: '24px', fontWeight: 800 }}>₱{totals.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
</div>
```

Add `Trash2`, `Minus`, `Plus`, `ArrowRight` to the lucide-react imports at top of file.

- [ ] **Step 3: Run typecheck**

```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && npm run typecheck
```
Expected: `ok (no errors)`

- [ ] **Step 4: Commit**

```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && git add src/renderer/src/pages/pos/CartPanel.tsx && git commit -m "style: upgrade POS cart panel — item cards, pill qty stepper, 56px Pay button"
```

---

## Phase 5 — Table Pages (Universal Pattern)

For each table page, apply the same universal pattern. The pattern is described once here; apply it to each file in order.

**Universal table page upgrade pattern:**

1. **Page header left side** — wrap title + subtitle in a div alongside a 36px icon circle:
```tsx
<div className="flex items-center gap-3">
  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
    style={{ background: 'rgba(79,70,229,0.10)' }}>
    <PageIcon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
  </div>
  <div>
    <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Page Title</h1>
    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>X records</p>
  </div>
</div>
```

2. **Action buttons in table rows** — add `className="row-actions"` to the `<td>` containing action buttons. The CSS will handle opacity-0 → opacity-1 on row hover automatically.

3. **Table skeleton loading** — replace text "Loading..." with:
```tsx
<div className="content-card overflow-hidden">
  <table className="dark-table">
    <tbody>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {/* one td per column */}
          <td><div className="skeleton h-4 w-3/4" /></td>
          <td><div className="skeleton h-4 w-1/2" /></td>
          <td><div className="skeleton h-4 w-1/3" /></td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

4. **Empty state** — replace plain text with:
```tsx
<div className="flex flex-col items-center justify-center py-16 gap-3">
  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
    style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
    <PageIcon className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
  </div>
  <div className="text-center">
    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>No records found</p>
    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Try adjusting your search or filters.</p>
  </div>
</div>
```

### Task 5a: ProductsPage

**Files:** `src/renderer/src/pages/products/ProductsPage.tsx`

- [ ] Apply universal pattern: page header icon circle, `row-actions` class on action td, skeleton loading, empty state upgrade
- [ ] Run typecheck → `ok (no errors)`
- [ ] Commit: `git commit -m "style: upgrade Products page — header icon, row actions, skeleton, empty state"`

### Task 5b: InventoryPage

**Files:** `src/renderer/src/pages/inventory/InventoryPage.tsx`

- [ ] **Step 1:** Read `src/renderer/src/pages/inventory/InventoryPage.tsx` to identify action column td and column count
- [ ] **Step 2:** Apply universal pattern (header icon circle, `row-actions` on action td, skeleton rows matching actual column count, empty state)
- [ ] **Step 3:** Run typecheck
```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && npm run typecheck
```
Expected: `ok (no errors)`
- [ ] **Step 4:** Commit
```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && git add src/renderer/src/pages/inventory/InventoryPage.tsx && git commit -m "style: upgrade Inventory page"
```

### Task 5c: TransactionsPage

**Files:** `src/renderer/src/pages/transactions/TransactionsPage.tsx`

- [ ] **Step 1:** Read `src/renderer/src/pages/transactions/TransactionsPage.tsx` to identify action column td and column count
- [ ] **Step 2:** Apply universal pattern
- [ ] **Step 3:** Run typecheck
```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && npm run typecheck
```
Expected: `ok (no errors)`
- [ ] **Step 4:** Commit
```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && git add src/renderer/src/pages/transactions/TransactionsPage.tsx && git commit -m "style: upgrade Transactions page"
```

### Task 5d: UsersPage

**Files:** `src/renderer/src/pages/users/UsersPage.tsx`

- [ ] **Step 1:** Read `src/renderer/src/pages/users/UsersPage.tsx` to identify action column td and column count
- [ ] **Step 2:** Apply universal pattern
- [ ] **Step 3:** Run typecheck
```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && npm run typecheck
```
Expected: `ok (no errors)`
- [ ] **Step 4:** Commit
```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && git add src/renderer/src/pages/users/UsersPage.tsx && git commit -m "style: upgrade Users page"
```

### Task 5e: SuppliersPage

**Files:** `src/renderer/src/pages/suppliers/SuppliersPage.tsx`

- [ ] **Step 1:** Read `src/renderer/src/pages/suppliers/SuppliersPage.tsx` to identify action column td and column count
- [ ] **Step 2:** Apply universal pattern
- [ ] **Step 3:** Run typecheck
```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && npm run typecheck
```
Expected: `ok (no errors)`
- [ ] **Step 4:** Commit
```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && git add src/renderer/src/pages/suppliers/SuppliersPage.tsx && git commit -m "style: upgrade Suppliers page"
```

### Task 5f: RolesPage

**Files:** `src/renderer/src/pages/roles/RolesPage.tsx`

- [ ] **Step 1:** Read `src/renderer/src/pages/roles/RolesPage.tsx` to identify action column td and column count
- [ ] **Step 2:** Apply universal pattern
- [ ] **Step 3:** Run typecheck
```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && npm run typecheck
```
Expected: `ok (no errors)`
- [ ] **Step 4:** Commit
```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && git add src/renderer/src/pages/roles/RolesPage.tsx && git commit -m "style: upgrade Roles page"
```

### Task 5g: CategoriesPage

**Files:** `src/renderer/src/pages/categories/CategoriesPage.tsx`

- [ ] **Step 1:** Read `src/renderer/src/pages/categories/CategoriesPage.tsx` to understand current tree/card structure
- [ ] **Step 2:** Apply page-header icon pattern; use `content-card` wrappers for category tree items (no standard table)
- [ ] **Step 3:** Run typecheck
```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && npm run typecheck
```
Expected: `ok (no errors)`
- [ ] **Step 4:** Commit
```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && git add src/renderer/src/pages/categories/CategoriesPage.tsx && git commit -m "style: upgrade Categories page"
```

### Task 5h: PurchaseOrdersPage

**Files:** `src/renderer/src/pages/purchase-orders/PurchaseOrdersPage.tsx`

- [ ] **Step 1:** Read `src/renderer/src/pages/purchase-orders/PurchaseOrdersPage.tsx` to identify action column td, column count, and status tab structure
- [ ] **Step 2:** Apply universal pattern; status filter tabs use pill toggle pattern (active = `background: var(--accent), color: #ffffff`; inactive = white + border)
- [ ] **Step 3:** Run typecheck
```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && npm run typecheck
```
Expected: `ok (no errors)`
- [ ] **Step 4:** Commit
```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && git add src/renderer/src/pages/purchase-orders/PurchaseOrdersPage.tsx && git commit -m "style: upgrade Purchase Orders page"
```

### Task 5i: CashDrawerPage

**Files:** `src/renderer/src/pages/cash-drawer/CashDrawerPage.tsx`

- [ ] **Step 1:** Read `src/renderer/src/pages/cash-drawer/CashDrawerPage.tsx` to understand current layout (no standard table)
- [ ] **Step 2:** Apply page-header icon pattern; wrap drawer status cards in `content-card`
- [ ] **Step 3:** Run typecheck
```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && npm run typecheck
```
Expected: `ok (no errors)`
- [ ] **Step 4:** Commit
```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && git add src/renderer/src/pages/cash-drawer/CashDrawerPage.tsx && git commit -m "style: upgrade Cash Drawer page"
```

### Task 5j: ReportingPage

**Files:** `src/renderer/src/pages/reporting/ReportingPage.tsx`

- [ ] **Step 1:** Read `src/renderer/src/pages/reporting/ReportingPage.tsx` to understand report-type tab structure and results table
- [ ] **Step 2:** Apply page-header icon pattern; report-type tabs use pill toggle pattern; results section uses `content-card` + `dark-table`
- [ ] **Step 3:** Run typecheck
```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && npm run typecheck
```
Expected: `ok (no errors)`
- [ ] **Step 4:** Commit
```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && git add src/renderer/src/pages/reporting/ReportingPage.tsx && git commit -m "style: upgrade Reporting page"
```

---

## Phase 6 — Modals & Forms

For each modal, apply the universal modal upgrade pattern. The pattern is described once; apply to all 15 files.

**Universal modal upgrade pattern:**

1. **Overlay** — ensure outer div uses `className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"`

2. **Panel** — ensure inner div uses `className="modal-panel w-full max-w-[Xpx] overflow-hidden"` (keep existing max-width)

3. **Header** — restructure to:
```tsx
<div className="flex items-center justify-between px-6 py-5"
  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: 'rgba(79,70,229,0.10)' }}>
      <ModalIcon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
    </div>
    <div>
      <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Modal Title</h2>
      {subtitle && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>{subtitle}</p>}
    </div>
  </div>
  <button onClick={onClose} style={{ color: 'var(--text-muted)' }}
    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
    <X className="w-5 h-5" />
  </button>
</div>
```

4. **Form labels** — change all labels from `style={{ color: 'rgba(15,17,23,0.55)' }}` (or similar) to:
```tsx
<label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
```

5. **Error banner** — ensure it uses:
```tsx
<div className="mb-4 px-4 py-3 rounded-lg text-sm"
  style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)' }}>
  {error}
</div>
```

6. **Footer** — ensure `justify-end gap-2`:
```tsx
<div className="flex justify-end gap-2 px-6 py-4"
  style={{ borderTop: '1px solid var(--border-subtle)' }}>
  <button type="button" onClick={onClose} className="btn-secondary px-5 py-2">Cancel</button>
  <button type="submit" disabled={saving} className="btn-primary px-5 py-2 disabled:opacity-50">
    {saving ? 'Saving...' : 'Primary Action'}
  </button>
</div>
```

### Task 6a–6o: Apply to all 15 modals

Apply the universal modal pattern to each file. For each modal:

- [ ] Read the file first to understand current structure
- [ ] Apply overlay, panel, header (with appropriate icon), labels, error banner, footer
- [ ] Run typecheck → `ok (no errors)` after every modal
- [ ] Commit after each modal: `git commit -m "style: upgrade [ModalName] — modal pattern"`

**Modal list with appropriate header icons:**
- `PaymentModal.tsx` — icon: `CreditCard` — **ADDITIONAL BODY SPECIFICS (beyond universal pattern):**
  - Payment method tabs (Cash / Card / GCash): render as pill tabs row below header, active = `background: var(--accent), color: #ffffff`, inactive = white + border
  - Cash tab body: Amount tendered input with `height: 48px, fontSize: 20px, textAlign: 'right'`, ₱ prefix label left of input; Change due row below: "Change" label + amount `fontSize: 20px, fontWeight: 700` in `var(--color-success)` if positive, `var(--color-danger)` if negative
  - Card/GCash tab body: Reference field standard input with `autocomplete="off"`, label "Reference / Approval Code"
  - Confirm button disabled until: for Cash — tendered ≥ total; for Card/GCash — always enabled
- `SupervisorPinModal.tsx` — icon: `Shield`
- `ReceiptModal.tsx` — icon: `Receipt` (or `FileText`)
- `DrawerPrompt.tsx` — icon: `Inbox`
- `ProductFormModal.tsx` — icon: `Package`
- `BarcodeModal.tsx` — icon: `Scan`
- `AdjustmentModal.tsx` — icon: `ArrowUpDown`
- `ReceivePOModal.tsx` — icon: `PackageCheck`
- `VoidModal.tsx` — icon: `Ban`
- `RefundModal.tsx` — icon: `Undo2`
- `TransactionDetailModal.tsx` — icon: `Receipt`
- `UserFormModal.tsx` — icon: `UserPlus` (create) / `UserCog` (edit)
- `UserActivityModal.tsx` — icon: `Activity`
- `SupplierFormModal.tsx` — icon: `Truck`
- `RoleFormModal.tsx` — icon: `Shield`

---

## Final Verification

After all phases complete:

- [ ] **Full typecheck**

```bash
cd "/Users/kkwenuja/Desktop/Raft 2.0/raft-pos" && npm run typecheck
```
Expected: `ok (no errors)`

- [ ] **Visual checklist**
  - [ ] Sidebar: brand area 64px, active nav item has left indigo border, no layout shift between active/inactive
  - [ ] Dashboard: KPI numbers 32px+ bold, period toggle visible, smooth bezier chart curve, two-column stock alerts
  - [ ] POS: product price in indigo at 18px, Pay button 56px full-width, pill qty stepper
  - [ ] All tables: uppercase 11px headers with `var(--bg-subtle)` background, row actions hidden by default
  - [ ] All modals: blurred backdrop, header with icon circle, uppercase labels, right-aligned footer
  - [ ] No `#111315`, `#2d2d2d`, or `rgba(255,255,255,x)` outside of intentional btn spinner whites
