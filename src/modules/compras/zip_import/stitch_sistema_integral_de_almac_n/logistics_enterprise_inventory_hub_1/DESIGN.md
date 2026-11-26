---
name: Logistics & Enterprise Inventory Hub
colors:
  surface: '#111416'
  surface-dim: '#111416'
  surface-bright: '#373a3c'
  surface-container-lowest: '#0c0f10'
  surface-container-low: '#191c1e'
  surface-container: '#1d2022'
  surface-container-high: '#272a2c'
  surface-container-highest: '#323537'
  on-surface: '#e1e2e5'
  on-surface-variant: '#c5c5d8'
  inverse-surface: '#e1e2e5'
  inverse-on-surface: '#2e3133'
  outline: '#8e8fa1'
  outline-variant: '#444655'
  surface-tint: '#bac3ff'
  primary: '#bac3ff'
  on-primary: '#001e91'
  primary-container: '#1d3ed8'
  on-primary-container: '#bcc4ff'
  inverse-primary: '#2e4ce3'
  secondary: '#bec6e0'
  on-secondary: '#283044'
  secondary-container: '#3e465b'
  on-secondary-container: '#adb5ce'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#006041'
  on-tertiary-container: '#50e0a4'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dee0ff'
  primary-fixed-dim: '#bac3ff'
  on-primary-fixed: '#000f5c'
  on-primary-fixed-variant: '#002ecb'
  secondary-fixed: '#dae2fc'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3e465b'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#111416'
  on-background: '#e1e2e5'
  surface-variant: '#323537'
  brand-blue-accent: '#1D3ED8'
  status-inflow: '#10B981'
  status-warning: '#F59E0B'
  status-critical: '#EF4444'
  status-transfer: '#6366F1'
  canvas-dark: '#0B0F19'
  surface-dark: '#111827'
  surface-dark-elevated: '#1F2937'
  border-dark: '#374151'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  data-tabular:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-sm: 0.75rem
  margin: 1.5rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system is constructed for mission-critical industrial operations, inventory logistics, and enterprise warehouse management (WMS/ERP). It caters directly to fast-paced operational warehouse teams executing continuous receiving and scanning, alongside logistics supervisors analyzing turnover metrics, capacity distribution, and asset lifecycles.

The aesthetic fuses **Modern Corporate** with **Precision Data-Density**:
- High legibility, structural clarity, and scan-friendly hierarchy suited for both low-glare office dashboards and floor-mounted scanning terminals.
- Functional balance: calibrated curves counterbalance high-density tabular views, alleviating visual fatigue in prolonged operational workflows.
- Purposeful visual feedback: status indicators, operational tags, and interactive states map directly to real-world asset conditions and stock statuses.

## Colors

The system uses `#1D3ED8` as the defining blue accent across the interface, powering interactive elements, key highlights, active states, and dark theme buttons.

### Color Roles & Modes
- **Primary Accent (`#1D3ED8`)**: Powers actionable affordances, active navigation states, primary buttons in dark mode, focus rings, and selection indicators.
- **Secondary Structure (`#565E74`)**: Manages sub-navigation framing, subdued typography, structural badges, and secondary actions.
- **Tertiary & Semantic Accent (`#10B981`)**: Drives positive inventory metrics, inbound confirmations, and healthy stock levels.
- **Neutral Core (`#191C1E` / `#0B0F19`)**: Grounding baseline for panels, container tiers, and data display canvases.

### Dark Mode & Highlight Application
In dark mode environments:
- Actionable buttons, selected table rows, active tab indicators, and interactive highlights shift to `#1D3ED8`.
- Deep dark surfaces (`#0B0F19` canvas, `#111827` containers, `#1F2937` popovers) pair with high-legibility white text (`#FFFFFF`) and slate borders (`#374151`), giving `#1D3ED8` focused prominence without optical glare.

### Operational Semantic Palette
- **Stock Inflow & Available (`#10B981`)**: Positive throughput, consumable health, inbound lots.
- **Threshold Warning (`#F59E0B`)**: Reorder alert triggers, impending maintenance schedules, approaching return windows.
- **Deficit & Critical Stop (`#EF4444`)**: Immediate stockouts, expired verification holds, broken custody chains.
- **In-Transit & Allocation (`#6366F1`)**: Warehouse bay transfers, internal reservations, quality holds.

## Typography

Typography balances clean structural authority with monospaced data precision:

- **Hanken Grotesk** serves as the primary typeface for interface framing, headings, descriptions, and conversational UI controls. Its modern grotesque proportions provide geometric balance and high scannability across dense panels.
- **Geist** handles numeric grids, SKU identifiers, serial tracking tokens, column headers, and tabular data. With monospace numbers and distinguishable glyphs (avoiding ambiguity between `0`/`O` and `1`/`I`), it ensures rapid operational parsing.
- On smaller viewports and mobile scanner hardware, large titles downscale automatically via mobile tokens (`headline-lg-mobile`) to prevent layout wrapping inside narrow inventory cards.

## Layout & Spacing

The system follows an 8pt structural rhythm engineered for dense information layouts, scanning panels, and wide analytics dashboards:

- **Grid Architecture**: A fluid 12-column desktop grid with `1.25rem` gutters adapts to 6 columns on tablets and a single-column stacked format on mobile and handheld scanner displays.
- **Navigation Shell**: Fixed/collapsible rail navigation (260px expanded, 72px collapsed) anchoring a fluid main canvas with `1.5rem` outer margins.
- **Vertical Density**:
  - Tabular data rows use tight vertical spacing (`0.5rem` to `0.75rem` internal padding) to maximize data lines visible above the fold.
  - KPI panels and asset cards align using `space-md` gaps.
  - Modal sheets and inspection drawers employ `space-lg` padding to separate structural interaction surfaces clearly.

## Elevation & Depth

Visual hierarchy relies on crisp borders and refined surface containment rather than heavy drop shadows:

- **Base Layer (Canvas)**: Neutral foundation (`#0B0F19` dark / `#F8FAFC` light) hosting background layout blocks with zero elevation.
- **Layer 1 (Cards, Tables & Grid Containers)**: Tonal surface fill (`#111827` dark / `#FFFFFF` light) paired with a 1px perimeter border (`#374151` dark / `#E2E8F0` light) and micro ambient shadow (`0 1px 3px rgba(0, 0, 0, 0.25)` in dark mode).
- **Layer 2 (Dropdowns, Hover Panels & Filter Flyouts)**: Elevated surface (`#1F2937` dark / `#FFFFFF` light), 1px border (`#4B5563` dark / `#CBD5E1` light), and subtle drop shadow (`0 4px 12px rgba(0, 0, 0, 0.35)`).
- **Layer 3 (Modals, Overlays & Barcode Scanners)**: High-contrast modal sheet backed by a deep scrim (`rgba(11, 15, 25, 0.7)`), elevated with floating shadow (`0 20px 25px -5px rgba(0, 0, 0, 0.5)`).

## Shapes

The geometric form language softens dense enterprise data while maintaining industrial discipline:

- **Core Containers**: Structural cards, tables, and modal shells utilize `rounded-lg` (`1rem`) to `rounded-xl` (`1.5rem`).
- **Interactive Controls**: Inputs, buttons, and segmented pickers standardize on `rounded-DEFAULT` (`0.5rem`) to `rounded-md` (`0.75rem`) for crisp button delineation.
- **Badges & Taxonomy Tags**: Micro status indicators use `rounded-full` pills for continuous lifecycle states, while category markers use `rounded-sm` (`0.25rem`) for compact tags.

## Components

### Buttons
- **Primary (Dark Theme)**: Solid `#1D3ED8` background, `#FFFFFF` text, `0.5rem` radius, subtle transition. Hover: `#1B36B8`. Active: scale `0.98`. Focus outline: 2px offset with `#1D3ED8`.
- **Secondary**: Elevated surface (`#1F2937` dark / `#FFFFFF` light), 1px border (`#374151` dark / `#CBD5E1` light), text `#F9FAFB` dark / `#0F172A` light.
- **Destructive**: Border/background tinted `#EF4444`, white text on solid fills for scrap and critical decommission actions.

### Status Chips & Tags
- **Consumable**: Indigo-blue surface badge with `#1D3ED8` indicator highlight in dark mode.
- **Returnable & Active**: Green surface badge (`#064E3B` dark / `#ECFDF5` light), `#10B981` text and dot.
- **Warning / Low Stock**: Amber badge (`#78350F` dark / `#FFFBEB` light), `#F59E0B` text.
- **Critical / Deficit**: Crimson badge (`#7F1D1D` dark / `#FEF2F2` light), `#EF4444` text.

### Tables & Inventory Grids
- **Header**: Tabular column labels using Geist `label-sm` uppercase, muted slate color (`#9CA3AF` dark / `#64748B` light), bottom border divider.
- **Rows**: Alternating container tone with hover highlighting. Selected rows feature a 2px left border accent in `#1D3ED8` with an alpha tint background (`rgba(29, 62, 216, 0.12)`).
- **Tabular Data**: Quantities, lot numbers, barcodes, and metrics right-aligned using Geist `data-tabular`.

### Inputs & Search Bars
- **Text & Barcode Inputs**: Surface background, 1px border (`#374151` dark / `#CBD5E1` light), height 40px, text white/slate.
- **Focus State**: Border switches to `#1D3ED8` accompanied by a 3px glow ring in `rgba(29, 62, 216, 0.25)`.
- **Barcode Quick-Scan Field**: Leading icon, monospaced Geist font, trailing keyboard accelerator badge (`Shift + S`).

### Selection Controls
- **Checkboxes & Radios**: Checked state fills with `#1D3ED8` and displays a crisp white checkmark or dot. Unchecked state presents a clean 1.5px border (`#4B5563`).

### Cards & KPI Tiles
- Bounded by 1px borders, featuring Geist tabular metrics (`headline-lg`), muted title labels (`label-md`), and status delta pills at the footer.