---
name: Logistics & Enterprise Inventory Hub
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434655'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#004f35'
  on-tertiary: '#ffffff'
  tertiary-container: '#006a48'
  on-tertiary-container: '#60eeb1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
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

The design system is constructed for mission-critical industrial operations, inventory logistics, and enterprise warehouse management (WMS/ERP). It addresses two key user profiles: operations staff working fast in high-density scanning/receiving environments, and logistics directors reviewing high-level inventory distribution, turnover metrics, and asset health.

The aesthetic blends **Modern Corporate** with **Precision Data-Density**:
- High legibility, rigorous visual hierarchy, and instant scannability under warehouse floor and office lighting conditions.
- Functional refinement: soft, modern corner radials (`rounded-xl` to `rounded-2xl`) counterbalance the strict tabular layouts, preventing fatigue in data-dense daily workflows.
- Purpose-driven status signaling: every color token corresponds to a physical inventory state (stock inflow, threshold warning, critical maintenance, asset tracking).

## Colors

The palette enforces clear structural separation between navigation, data surfaces, textual records, and operational statuses:

- **Primary (`#1D4ED8`)**: Used for authoritative actions, selected navigation items, primary CTA buttons, active tab indicators, and row selection rings.
- **Secondary / Structure (`#0F172A`)**: The core anchor for structural sidebars, high-contrast typography, primary headers, and high-priority metrics.
- **Neutral Background Canvas (`#F8FAFC`)**: Soft cool-slate base for application backdrops, minimizing glare during long-shift operational use.
- **Borders & Dividers (`#E2E8F0`)**: Low-friction hairline dividers and perimeter container borders to define distinct modules without visual clutter.
- **Surface Elevation (`#FFFFFF`)**: Pure white base for data cards, modal sheets, tables, and popovers.

### Operational Semantic Acounts
- **Operational Green / Inflow (`#10B981`)**: Positive stock delta, inbound receipts, available consumable levels, and healthy asset states. Background tint: `#ECFDF5`.
- **Warning Amber / Low Stock (`#F59E0B`)**: Reorder point alerts, upcoming maintenance dates, and loans nearing return expiration. Background tint: `#FFFBEB`.
- **Critical Red / Deficit (`#EF4444`)**: Stockout emergencies, broken chain of custody, overdue equipment loans, and urgent maintenance halts. Background tint: `#FEF2F2`.
- **Informational Indigo (`#6366F1`)**: Internal transfers, lot reservations, and pending inspections. Background tint: `#EEF2FF`.

## Typography

Typography prioritizes fast numerical parsing and clean typographic hierarchy.

- **Primary UI & Headings (`Hanken Grotesk`)**: Delivers geometric clarity and structural authority across all major titles, cards, and input values.
- **Data & Micro-Interface (`Geist`)**: Applied to all SKU codes, serial numbers, lot tracking codes, inventory counters, table columns, and status badges. The tabular numerals and crisp letterforms eliminate ambiguity between characters (such as `0` and `O`, or `1` and `l`) in warehouse stock identification.
- Headings scale proportionately on compact scanning devices via responsive tokens, retaining full utility without line breaks overflowing table cells.

## Layout & Spacing

The layout is built upon an 8pt architectural rhythm, optimized for complex data presentations, analytics grids, and continuous scanning workflows.

- **Shell Architecture**: Fluid main dashboard canvas coupled with an icon-collapsible left rail sidebar (`260px` expanded, `72px` collapsed).
- **Grid Layout**: 12-column adaptive system with `1.25rem` (`20px`) gutters on desktop, collapsing to 6 columns on tablet and a single-column stacked view on mobile scanning screens.
- **Data Density Rules**:
  - Tables utilize a compact vertical rhythm (`0.5rem` to `0.75rem` padding per row) to maximize row visibility above the fold.
  - KPI summary bars sit anchored atop lists using `space-md` gaps.
  - Detail panels and drawer overlays preserve `margin` padding to distinguish structural overlays from underlying records.

## Elevation & Depth

This design system avoids heavy shadows, instead using crisp outlines combined with subtle ambient diffusion to maintain visual order across high-density enterprise interfaces:

- **Level 0 (Base Canvas)**: `#F8FAFC`. Zero elevation, sits at the bottom layer.
- **Level 1 (Cards, Tables & Sections)**: Background `#FFFFFF`, bordered with `1px solid #E2E8F0`, ambient shadow `0 1px 3px 0 rgba(15, 23, 42, 0.04)`.
- **Level 2 (Hover States & Dropdown Menus)**: Background `#FFFFFF`, `1px solid #CBD5E1`, shadow `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Modals, Barcode Quick-Scanners & Slide-over Drawers)**: Background `#FFFFFF`, borderless with dark translucent backdrop (`rgba(15, 23, 42, 0.45)`), floating shadow `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.08)`.

## Shapes

The geometric form language adopts a modern, accessible curve profile that softens rigorous enterprise software:

- **Containers & Big Cards**: Styled with `rounded-2xl` (`1.5rem`) for macro-level structural panels, KPI modules, and modal containers.
- **Form Controls & Micro-Containers**: Styled with `rounded-xl` (`1rem`) to `rounded-lg` (`0.75rem`) for text inputs, select dropdowns, search bars, and action buttons.
- **Status Badges & Category Tags**: Styled as semi-pills (`rounded-full`) or standardized `rounded-md` (`0.375rem`) labels depending on context (pills for lifecycle states, tags for stock taxonomy).

## Components

### Buttons
- **Primary**: Solid `#1D4ED8` background, `#FFFFFF` text, `rounded-xl` radius, subtle transition. Hover: `#1E40AF`. Active: scale `0.98`.
- **Secondary**: `#FFFFFF` background, `1px solid #CBD5E1`, text `#0F172A`. Hover: `#F1F5F9`.
- **Destructive**: `#FEF2F2` background, `#EF4444` border/text for secondary style, or solid `#EF4444` with `#FFFFFF` text for permanent write-offs and scrap declarations.

### Status Badges & Asset Category Chips
- **Consumable (Consumible)**: `#EEF2FF` background, `#4338CA` text, dot indicator `#6366F1`.
- **Returnable (Retornable)**: `#ECFDF5` background, `#065F46` text, dot indicator `#10B981`.
- **Capital Asset (Activo Patrimonial)**: `#F8FAFC` background, `1px solid #CBD5E1`, text `#0F172A`, icon prefix.
- **Stock Alert States**:
  - *Optimal*: Text `#047857`, Background `#D1FAE5`.
  - *Low Stock / Pending Return*: Text `#B45309`, Background `#FEF3C7`.
  - *Critical / Expired Maintenance*: Text `#B91C1C`, Background `#FEE2E2`.

### Tables (Data Grid)
- **Header**: `#F1F5F9` background, `1px solid #E2E8F0` bottom boundary. Label: `label-sm` uppercase, font Geist, color `#64748B`.
- **Row**: Alternating white with clean hover highlight `#F8FAFC`. Selected row uses subtle `#EFF6FF` tint with a `2px solid #1D4ED8` left indicator.
- **Numerical Alignment**: Right-aligned, formatted with Geist `data-tabular` for instant column comparisons.

### Form Inputs & Search Filters
- **Standard Field**: White surface, `1px solid #CBD5E1`, `rounded-xl`, height `42px`, placeholder `#94A3B8`. Focus: border `#1D4ED8` with a 3px outer ring of `#DBEAFE`.
- **Barcode / SKU Quick-Scan Input**: Integrated leading barcode glyph, trailing shortcut hint badge (`Shift + S`), mono-aligned entry text.

### KPI Summary Cards
- White surface, `1px solid #E2E8F0`, `rounded-2xl`, internal padding `space-lg`.
- Top row: Metric title (`label-md` `#64748B`) + context icon.
- Middle row: Primary counter (`headline-lg`, tabular numbers).
- Bottom row: Inline delta comparison pill showing historical turnover or threshold discrepancy.