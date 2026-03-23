# Refined Enterprise UI Overhaul — Raft POS

**Date:** 2026-03-23
**Approach:** Option 1 (Design System Foundation) + Option 2 (Page-by-Page Deep Redesign)
**Style Direction:** Refined Enterprise — clean white surfaces, strong typographic hierarchy, subtle layered depth, indigo accent
**References:** Linear, Vercel dashboard, Notion, Stripe admin

---

## 1. Design System Foundation

### 1.1 Typography

Font family: Inter (already imported). Strict weight + size hierarchy:

| Use | Size | Weight |
|-----|------|--------|
| Badge / meta text | 11px | 500 |
| Table headers, captions | 12px | 600 |
| Table body | 13px | 400 |
| Form hints, secondary text | 13px | 400 |
| Body text, inputs | 14px | 400 |
| Labels, nav items, buttons | 14px | 500 |
| Modal titles, section heads | 16px | 600 |
| Page titles | 20px | 700 |
| KPI values | 32px | 800 |

Line height: 1.4 for dense data tables, 1.6 for body/form text.
Letter spacing: `-0.01em` on headings/buttons, `0.05em` on uppercase table headers, `0.04em` on uppercase form labels.

---

### 1.2 CSS Design Tokens (full replacement of `:root` block in `index.css`)

```css
:root {
  /* Backgrounds */
  --bg-base:      #f4f5f7;
  --bg-surface:   #ffffff;
  --bg-card:      #ffffff;
  --bg-elevated:  #ffffff;
  --bg-subtle:    #f9fafb;   /* table headers, hover rows, secondary inputs */
  --bg-hover:     #f3f4f6;   /* nav item hover, btn-secondary hover */

  /* Text */
  --text-primary:   #111827;
  --text-secondary: rgba(17,24,39,0.58);
  --text-muted:     rgba(17,24,39,0.38);
  --text-disabled:  rgba(17,24,39,0.24);

  /* Accent — Indigo */
  --accent:         #4F46E5;
  --accent-hover:   #4338CA;
  --accent-light:   #EEF2FF;
  --accent-muted:   rgba(79,70,229,0.08);

  /* Semantic colours */
  --color-success:       #16a34a;
  --color-success-bg:    #f0fdf4;
  --color-success-border: rgba(22,163,74,0.20);
  --color-warning:       #d97706;
  --color-warning-bg:    #fffbeb;
  --color-warning-border: rgba(217,119,6,0.20);
  --color-danger:        #dc2626;
  --color-danger-hover:  #b91c1c;
  --color-danger-bg:     #fef2f2;
  --color-danger-border: rgba(220,38,38,0.20);

  /* Badge specific (non-tokenizable brand colours) */
  --badge-blue-bg:    #eff6ff;
  --badge-blue-text:  #1d4ed8;
  --badge-gray-bg:    #f3f4f6;
  --badge-gray-text:  #4b5563;
  --badge-purple-bg:  #f5f3ff;
  --badge-purple-text:#7c3aed;
  --badge-orange-bg:  #fff7ed;
  --badge-orange-text:#c2410c;

  /* Rank badge colours (Best Sellers) */
  --rank-gold:   #b45309;
  --rank-gold-bg: #fef3c7;
  --rank-silver: #4b5563;
  --rank-silver-bg: #f3f4f6;
  --rank-bronze: #92400e;
  --rank-bronze-bg: #fef3c7;

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
```

---

### 1.3 Component Specifications

#### Buttons

All buttons share base properties:
- `height: 36px`, `padding: 0 14px`, `border-radius: 8px`
- `font-size: 14px`, `font-weight: 500`, `letter-spacing: -0.01em`
- `transition: all var(--transition-fast)`
- `cursor: pointer`
- `display: inline-flex`, `align-items: center`, `gap: 6px`

Focus ring (all buttons): `outline: 2px solid var(--accent); outline-offset: 2px`

```css
.btn-primary {
  background: var(--accent);
  color: #ffffff;
  border: none;
  box-shadow: var(--shadow-xs);
}
.btn-primary:hover {
  background: var(--accent-hover);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--bg-surface);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}
.btn-secondary:hover {
  background: var(--bg-hover);
  border-color: var(--border-strong);
}

.btn-danger {
  background: var(--color-danger);
  color: #ffffff;
  border: none;
  box-shadow: var(--shadow-xs);
}
.btn-danger:hover {
  background: var(--color-danger-hover);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

/* Disabled state for all buttons */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

#### Inputs & Selects

`dark-input` and `dark-select` are **in-place style upgrades** to existing class names — no rename. The "dark-" prefix is legacy naming kept for backward compatibility.

```css
.dark-input, .dark-select {
  height: 36px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary);
  padding: 0 12px;
  width: 100%;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.dark-input::placeholder {
  color: var(--text-muted);
}
.dark-input:focus, .dark-select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
  outline: none;
}
```

#### Skeleton / Shimmer

```css
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
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
  border-radius: 6px;
}
```

#### Cards

```css
.content-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-base), transform var(--transition-base);
  cursor: default;
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
```

#### Tables

```css
.dark-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.dark-table thead th {
  background: var(--bg-subtle);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}
.dark-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  vertical-align: middle;
}
.dark-table tbody tr:hover td {
  background: var(--bg-subtle);
}
.dark-table tbody tr:last-child td {
  border-bottom: none;
}
/* First data column always bold primary */
.dark-table tbody td:first-child {
  font-weight: 500;
  color: var(--text-primary);
}
/* Row action buttons: hidden until row hovered */
.dark-table tbody td.row-actions {
  opacity: 0;
  transition: opacity var(--transition-fast);
}
.dark-table tbody tr:hover td.row-actions {
  opacity: 1;
}
```

#### Badges

All badges share base: `border-radius: 999px; font-size: 11px; font-weight: 500; padding: 2px 8px; display: inline-flex; align-items: center; white-space: nowrap;`

```css
.badge-green  { background: var(--color-success-bg);  color: var(--color-success); }
.badge-red    { background: var(--color-danger-bg);   color: var(--color-danger); }
.badge-yellow { background: var(--color-warning-bg);  color: var(--color-warning); }
.badge-blue   { background: var(--badge-blue-bg);     color: var(--badge-blue-text); }
.badge-gray   { background: var(--badge-gray-bg);     color: var(--badge-gray-text); }
.badge-purple { background: var(--badge-purple-bg);   color: var(--badge-purple-text); }
.badge-orange { background: var(--badge-orange-bg);   color: var(--badge-orange-text); }
```

#### Modals

```css
.modal-overlay {
  background: rgba(17,24,39,0.45);
  backdrop-filter: blur(2px);
}

.modal-panel {
  background: var(--bg-elevated);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-subtle);
}
```

Modal structure (applied in TSX, not CSS):
- **Header**: `padding: 20px 24px`, `border-bottom: 1px solid var(--border-subtle)`
  - Left: 36px colored icon circle + title (16px, 600) + optional subtitle (12px, muted)
  - Right: × close button (muted color, hover primary)
- **Body**: `padding: 24px`, form fields with `gap: 16px`
- **Footer**: `padding: 16px 24px`, `border-top: 1px solid var(--border-subtle)`, `justify-content: flex-end`, `gap: 8px`
  - Order: `[Cancel btn-secondary]` `[Primary Action btn-primary]`

Form labels inside modals:
```css
/* Applied as inline style or utility class */
font-size: 12px;
font-weight: 500;
text-transform: uppercase;
letter-spacing: 0.04em;
color: var(--text-muted);
margin-bottom: 6px;
```

Error banner (top of modal body):
```css
background: var(--color-danger-bg);
border: 1px solid var(--color-danger-border);
border-radius: 8px;
padding: 10px 14px;
font-size: 13px;
color: var(--color-danger);
margin-bottom: 16px;
```

---

### 1.4 Sidebar Redesign

White background, stronger structural hierarchy. Class names and TSX structure in `Sidebar.tsx`.

```
Brand area (min-height: 64px, border-bottom: 1px solid var(--border-subtle)):
  - Left: 32px icon square (border-radius: 8px, bg: var(--accent-light), icon color: var(--accent))
  - Text block: "Raft POS" (font-size: 15px, font-weight: 700, color: var(--text-primary))
              + "Point of Sale" (font-size: 11px, color: var(--text-muted))
  - Padding: 16px 16px

Section label:
  font-size: 10px
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase
  color: var(--text-muted)
  padding: 16px 20px 4px

Nav item (inactive):
  height: 36px
  border-radius: 8px
  margin: 1px 8px
  padding: 0 10px
  border-left: 3px solid transparent   ← REQUIRED to prevent layout shift on active
  display: flex
  align-items: center
  gap: 10px
  font-size: 13px
  font-weight: 500
  color: var(--text-secondary)
  transition: all var(--transition-fast)
  cursor: pointer

Nav item (hover):
  background: var(--bg-hover)
  color: var(--text-primary)
  border-left: 3px solid transparent   ← unchanged, no shift

Nav item (active):
  background: var(--accent-light)
  color: var(--accent)
  font-weight: 600
  border-left: 3px solid var(--accent)
  padding-left: 7px  (10px - 3px border = 7px to maintain visual alignment)

Nav item icon: 16px, color: inherit

User footer (border-top: 1px solid var(--border-subtle), padding: 12px 16px):
  - Avatar: 32px circle, initials, background per AVATAR_COLORS (unchanged from current)
  - Name: font-size 13px, font-weight 600, color: var(--text-primary)
  - Role: font-size 11px, color: var(--text-muted)
  - Logout icon button: right-aligned, hover color: var(--color-danger)
```

---

### 1.5 Page Header (`page-header` class)

```css
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-xs);
}
```

Left side of page header:
- 36px icon circle (colored per page: indigo for POS/Products, green for Inventory, etc.) + page title (20px, 700) + subtitle/record count (13px, muted)

---

## 2. Page Designs

### 2.1 Dashboard

**Period toggle — visual only (client-side filter of existing data):**
The toggle (Today / 7 Days / 30 Days) filters the already-fetched data client-side. No new API calls. If today's data only is returned by the existing hooks, the 7D/30D states will show the same data — this is acceptable for Phase 3 and is noted as a future backend enhancement. The toggle renders as a pill-group button (active = indigo fill, inactive = white+border, `border-radius: 8px`, `font-size: 13px`).

**KPI delta pills — visual placeholder:**
Delta pills (`↑ 12%` / `↓ 3%`) are static placeholder values in Phase 3. Backend comparison endpoints are a future feature. Mark with a `// TODO: wire to comparison API` comment.

**Page header:**
- Left: "Dashboard" (20px, 700) + "Good morning, [firstName]" (14px, muted)
- Right: period toggle pill group

**KPI row** (`grid-cols-2 lg:grid-cols-4`, gap 16px):

Each stat-card:
- Icon in 40px soft-bg circle (indigo/green/purple/orange per card)
- Large KPI number: 32px, 800 weight, `var(--text-primary)`
- Label: 13px, muted, below number
- Delta pill: positioned bottom-right of card, static placeholder
- Hover: `stat-card` class handles lift

**Main content grid** (`grid-cols-1 lg:grid-cols-5`, gap 16px):

Left (3 cols — Revenue Trend card):
- Title "Revenue" + period label
- Custom SVG area chart (existing component, visual upgrade only):
  - Indigo stroke `2px`, gradient fill `var(--accent)` opacity 0.12→0
  - Smooth bezier curve (existing SVG path, no library change)
  - X-axis labels: `font-size: 11px`, muted
- 3 summary stats below chart (Transactions | Avg Order | Revenue/Txn), each `font-size: 13px`

Right (2 cols — Best Sellers card):
- Title "Best Sellers" + subtitle muted
- Ranked list items:
  - Rank badge: 1 = `var(--rank-gold-bg)` / `var(--rank-gold)`, 2 = `var(--rank-silver-bg)` / `var(--rank-silver)`, 3 = `var(--rank-bronze-bg)` / `var(--rank-bronze)`, 4+ = `.badge-gray`
  - Product name: 13px, 600 weight
  - SKU: 11px, muted, below name
  - Units badge: `.badge-gray`, right-aligned
  - Revenue bar: thin (4px height) indigo progress bar, relative to max seller
- Empty state: centered shopping bag icon (32px, muted) + "No sales this period" (13px, muted)

**Full-width below: Stock Alerts** (`content-card`):
- Two-column internal grid
- Left column header: "Critical" red badge
- Right column header: "Low Stock" amber badge
- Each item row: product name (500 weight) + "X units" colored + reorder text (muted) + thin 4px progress bar
- Left border on each item: `3px solid var(--color-danger)` (critical) or `3px solid var(--color-warning)` (low)
- If healthy: single centered row, green checkmark (16px) + "All stock levels are healthy" (13px, muted)
- Footer: summary counts + "View Inventory →" link (accent color)

---

### 2.2 POS Screen

#### Left panel (product search + grid)

**Sticky header:**
- Title "Point of Sale" (16px, 600) + products count (13px, muted)
- Search: full-width, `height: 40px`, `border-radius: 10px`, `box-shadow: var(--shadow-xs)`, magnifier icon left, Scan badge right

**Category pills** (horizontal scroll, `gap: 8px`, `padding: 0 0 12px`):
- `border-radius: 999px`, `font-size: 12px`, `font-weight: 500`, `height: 28px`, `padding: 0 12px`
- Active: `background: var(--accent)`, `color: #ffffff`
- Inactive: `background: var(--bg-surface)`, `border: 1px solid var(--border-default)`, `color: var(--text-secondary)`

**Product grid** (`grid-cols-2 xl:grid-cols-3`, `gap: 12px`):

Each product card:
- `background: var(--bg-surface)`, `border: 1px solid var(--border-subtle)`, `border-radius: 12px`, `padding: 14px`, `box-shadow: var(--shadow-xs)`
- Hover (in-stock): `border-color: rgba(79,70,229,0.3)`, `box-shadow: var(--shadow-sm)`, `background: #f8f9ff`
- Press (in-stock): `transform: scale(0.97)`, `transition: transform 100ms`
- Top row: SKU (11px, mono, muted left) + stock dot (8px circle, right: green=in stock / red=out)
- Product name: 14px, 600 weight, 2-line clamp, `margin-top: 6px`
- Price: 18px, 700 weight, `color: var(--accent)`, `margin-top: 8px`
- Stock text: 12px, muted bottom — "X units in stock" or red "Out of stock"
- Out of stock: `opacity: 0.45`, `cursor: not-allowed`, no hover effect

**Loading state:** `grid-cols-2 xl:grid-cols-3` skeleton cards, each 120px height, `.skeleton` class
**Empty state:** centered ShoppingBag icon (40px, muted) + "No products found" (14px, 500, muted) + "Try a different search or category." (12px, muted)

#### Right panel (cart)

**Cart header** (`padding: 16px`, `border-bottom: 1px solid var(--border-subtle)`):
- "Cart" (16px, 600, primary) + item count badge (indigo pill, `badge-blue` style)
- Clear cart icon (Trash2, 16px) button right-aligned: hover `color: var(--color-danger)`

**Empty cart state:**
- Centered: ShoppingBag icon (48px, muted) + "Cart is empty" (14px, 500, muted) + "Add products from the left" (12px, muted)

**Cart item** (each item, `background: var(--bg-surface)`, `border: 1px solid var(--border-subtle)`, `border-radius: 10px`, `padding: 12px`, `margin-bottom: 8px`):
- Top row: product name (13px, 600) + remove × button (top-right, hover red)
- Unit price: 12px, muted, below name
- Bottom row: quantity stepper (left) + line total (right, 14px, 600)
- Quantity stepper: `−` `[n]` `+` as pill group — `border: 1px solid var(--border-default)`, `border-radius: 999px`, `height: 28px`; `−`/`+` buttons `width: 28px`, hover `background: var(--bg-hover)`; number centered, `font-size: 13px, font-weight: 600`
- Stock warning (if qty > stock): 12px, `color: var(--color-warning)`, inline below name

**Totals section** (`padding: 12px 16px`, `border-top: 1px solid var(--border-subtle)`):
- Subtotal: `font-size: 13px`, muted label + value
- Discount (if applied): `font-size: 13px`, `color: var(--color-success)` label + `-₱X.XX`
- Tax: `font-size: 13px`, muted
- Thick divider: `2px solid var(--border-default)`, `margin: 8px 0`
- Total row: "Total" (16px, 600, primary) + amount (24px, 800, primary)

**Pay button:**
- `width: 100%`, `height: 56px`, `border-radius: 10px`
- `background: var(--accent)`, `color: #ffffff`
- `font-size: 16px`, `font-weight: 600`, `letter-spacing: -0.01em`
- Right icon: ArrowRight (16px)
- Hover: `background: var(--accent-hover)`, `transform: translateY(-1px)`, `box-shadow: var(--shadow-md)`
- Disabled: `opacity: 0.5`, `cursor: not-allowed`, no transform

---

### 2.3 Table Pages (Universal Pattern)

Applied to: Products, Inventory, Suppliers, Users, Transactions, Roles, Categories, Purchase Orders, Cash Drawer, Reporting.

**Reporting page note:** Reporting has a special layout (report type tabs + date range + export buttons + results table). It follows this universal table pattern for the results section. The tab/filter header area uses the same `page-header` style but with report-type tabs inline below the header instead of a search bar.

**Page header** (`.page-header`):
- Left: 36px icon circle (indigo-tinted or semantic color per page) + page title (20px, 700) + record count (13px, muted)
- Right: `+ Add X` primary button (if applicable)

**Filter row** (below header, `padding: 16px 24px`, `border-bottom: 1px solid var(--border-subtle)`):
- Search input: `max-w-xs`, with search icon, `dark-input`
- Status/filter controls: inline, right of search
- Results count: `X records` (13px, muted), far right

**Table container:** wrapped in `.content-card` (`border-radius: 12px`, `overflow: hidden`)

**Table body rows:** 52px effective row height (via `padding: 14px 16px` on cells)

**Row action buttons** (in `td.row-actions`):
- `p-1.5 rounded-lg`, icon 16px
- Hidden by default: `opacity: 0` on `td.row-actions`, visible on `tr:hover`
- Each has `title` and `aria-label`
- Edit: hover `color: var(--text-primary)` background `var(--bg-hover)`
- Danger (deactivate/delete): hover `color: var(--color-danger)`

**Loading state:** 5 skeleton rows, each row contains skeleton cells matching column widths

**Empty state:**
- Centered in table area: 48px icon (muted) + heading (14px, 500, muted) + subtext (13px, muted) + optional CTA

---

### 2.4 Payment Modal

The payment modal opens when the Pay button is clicked. It follows the universal modal pattern (Section 1.3) with these specifics:

- Max-width: 480px
- Header icon: indigo circle with CreditCard icon
- Title: "Payment" + subtitle showing total amount (e.g. "₱1,250.00")

Body sections:
1. **Payment method tabs**: Cash | Card | GCash — pill tabs, active = indigo fill
2. **Amount tendered** (Cash only): large input (height: 48px, font-size: 20px, text-right) with ₱ prefix label
3. **Change due** (Cash only): large display row — "Change" label + amount in bold green if positive, red if negative
4. **Reference field** (Card/GCash): standard input, `autocomplete="off"`

Footer: Cancel + "Confirm Payment" (btn-primary, disabled until valid amount entered)

---

### 2.5 Modals & Forms (Universal Pattern)

See Section 1.3 for modal structure. Applied to all modal files:

**Phase 6 modal file list:**
- `pages/pos/PaymentModal.tsx`
- `pages/pos/SupervisorPinModal.tsx`
- `pages/pos/ReceiptModal.tsx`
- `pages/pos/DrawerPrompt.tsx`
- `pages/products/ProductFormModal.tsx`
- `pages/products/BarcodeModal.tsx`
- `pages/inventory/AdjustmentModal.tsx`
- `pages/purchase-orders/ReceivePOModal.tsx`
- `pages/transactions/VoidModal.tsx`
- `pages/transactions/RefundModal.tsx`
- `pages/transactions/TransactionDetailModal.tsx`
- `pages/users/UserFormModal.tsx`
- `pages/users/UserActivityModal.tsx`
- `pages/suppliers/SupplierFormModal.tsx`
- `pages/roles/RoleFormModal.tsx`

Total: 15 modals

---

## 3. Implementation Order

### Phase 1 — CSS Foundation (1 file)
**File:** `src/renderer/src/assets/index.css`

Changes:
- Replace `:root` token block (add `--bg-subtle`, `--bg-hover`, `--shadow-*`, `--color-*-border`, `--color-danger-hover`, `--badge-*`, `--rank-*` tokens)
- Upgrade `.btn-primary`, `.btn-secondary`, `.btn-danger`
- Upgrade `.dark-input`, `.dark-select` (in-place, no rename)
- Upgrade `.content-card`, `.stat-card`
- Upgrade `.dark-table` (thead, tbody, hover, first-column, `td.row-actions` opacity pattern)
- Upgrade all `.badge-*` to use new tokens
- Upgrade `.modal-overlay` (add `backdrop-filter: blur(2px)`)
- Upgrade `.modal-panel` (border-radius 16px, shadow-lg)
- Upgrade `.page-header`
- Add `.skeleton` shimmer keyframe + class
- Add `@media (prefers-reduced-motion: reduce)` suppression

### Phase 2 — Layout Shell (1 file)
**File:** `src/renderer/src/components/layout/Sidebar.tsx`

Changes:
- Rebuild brand area (64px, icon square + text + subtitle)
- Section labels (10px, 700, uppercase, 0.08em spacing)
- Nav items with `border-left: 3px solid transparent` on inactive/hover (prevents layout shift)
- Active state: `border-left: 3px solid var(--accent)`, `padding-left: 7px`
- User footer restructured (avatar + name/role stack + logout button)

### Phase 3 — Dashboard (1 file)
**File:** `src/renderer/src/pages/dashboard/DashboardPage.tsx`

Changes:
- Add period toggle (Today/7D/30D) — client-side only, comment `// TODO: wire to comparison API`
- KPI cards: larger numbers (32px, 800), icon circles, static delta pill placeholders
- Revenue chart: visual upgrade (stroke color, gradient fill using existing SVG)
- Best sellers: rank badges using `--rank-*` tokens, revenue bars
- Stock alerts: two-column layout, left borders, footer summary
- Grid layout updates (5-col responsive)

### Phase 4 — POS Screen (2 files)
**Files:** `src/renderer/src/pages/pos/ProductSearchPanel.tsx`, `src/renderer/src/pages/pos/CartPanel.tsx`

Changes per Section 2.2.

### Phase 5 — All Table Pages (10 files, apply universal pattern)

Priority order (most-used first):
1. `pages/products/ProductsPage.tsx`
2. `pages/inventory/InventoryPage.tsx`
3. `pages/transactions/TransactionsPage.tsx`
4. `pages/users/UsersPage.tsx`
5. `pages/suppliers/SuppliersPage.tsx`
6. `pages/roles/RolesPage.tsx`
7. `pages/categories/CategoriesPage.tsx`
8. `pages/purchase-orders/PurchaseOrdersPage.tsx` *(has status tabs — apply tab styles as per current pattern)*
9. `pages/cash-drawer/CashDrawerPage.tsx` *(unique layout — apply header/card pattern, not full table)*
10. `pages/reporting/ReportingPage.tsx` *(has report-type tabs — see Section 2.3 note)*

For each: apply `page-header` structure, filter row, `content-card` table wrapper, `dark-table` upgrades, row action opacity pattern, skeleton rows, empty state.

### Phase 6 — All Modals & Forms (15 files)

Apply Section 2.5 pattern to all 15 modals listed. Each modal gets:
- `modal-overlay` + `modal-panel` classes correctly applied
- Header with colored icon circle
- Body padding 24px, labels upgraded (12px uppercase)
- Footer right-aligned with correct button order
- Error banner using `var(--color-danger-bg)` + `var(--color-danger-border)`

---

## 4. Constraints & Non-Goals

- **No new features** — purely visual/UX upgrade; period toggle is client-side filter only; delta pills are static placeholders
- **No dark mode** — light theme only
- **No routing changes** — navigation structure stays identical
- **No new npm dependencies** — existing SVG chart pattern preserved, no chart library added
- **No IPC changes** — Electron ipcRenderer calls are untouched; only renderer-side visual changes
- **`npm run typecheck` must pass** after every phase — run before committing each phase
- **AVATAR_COLORS** in `UsersPage.tsx` — already upgraded to dark saturated colors in prior session; preserved as-is
- **Accessibility** — all interactive elements keep focus rings; modals remain closable via Escape key; all icon-only buttons retain `aria-label` and `title`

---

## 5. Success Criteria

1. `npm run typecheck` → zero errors after all phases
2. All 15 pages render without console errors
3. Sidebar nav active state: left `3px indigo border` + `--accent-light` background, no layout shift between states
4. Dashboard KPI numbers render at 32px, 800 weight
5. POS Pay button: 56px height, full-width, indigo, ArrowRight icon
6. All table headers: uppercase 11px, `var(--bg-subtle)` background
7. All modal overlays: `backdrop-filter: blur(2px)` applied
8. No hardcoded dark-mode hex values remain (`#111315`, `#2d2d2d`, `#1c1f21`, `rgba(255,255,255,x)` outside of btn spinner whites)
9. Row action buttons: `opacity: 0` default, `opacity: 1` on `tr:hover`
10. Product cards in POS: price renders in `var(--accent)` at 18px
11. All `.skeleton` loading states use shimmer animation
12. Escape key closes all modals (existing behavior preserved)
13. All icon-only action buttons have `aria-label` and `title`
