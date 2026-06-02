---
name: Kaleïdo
colors:
  surface: '#fcf8ff'
  surface-dim: '#dcd8e4'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f2fe'
  surface-container: '#f0ecf8'
  surface-container-high: '#eae6f3'
  surface-container-highest: '#e4e1ed'
  on-surface: '#1b1b23'
  on-surface-variant: '#474554'
  inverse-surface: '#302f38'
  inverse-on-surface: '#f3effb'
  outline: '#777586'
  outline-variant: '#c8c4d7'
  surface-tint: '#5348d6'
  primary: '#5348d5'
  on-primary: '#ffffff'
  primary-container: '#6c63f0'
  on-primary-container: '#030026'
  inverse-primary: '#c4c0ff'
  secondary: '#5e5c6e'
  on-secondary: '#ffffff'
  secondary-container: '#e4e0f5'
  on-secondary-container: '#646274'
  tertiary: '#5d5b61'
  on-tertiary: '#ffffff'
  tertiary-container: '#76737a'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3dfff'
  primary-fixed-dim: '#c4c0ff'
  on-primary-fixed: '#120068'
  on-primary-fixed-variant: '#3a2abd'
  secondary-fixed: '#e4e0f5'
  secondary-fixed-dim: '#c7c4d8'
  on-secondary-fixed: '#1b1a29'
  on-secondary-fixed-variant: '#464555'
  tertiary-fixed: '#e5e1e9'
  tertiary-fixed-dim: '#c9c5cd'
  on-tertiary-fixed: '#1c1b20'
  on-tertiary-fixed-variant: '#48464c'
  background: '#fcf8ff'
  on-background: '#1b1b23'
  surface-variant: '#e4e1ed'
typography:
  page-title:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  section-title:
    fontFamily: Be Vietnam Pro
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.6px
  card-title:
    fontFamily: Be Vietnam Pro
    fontSize: 14.5px
    fontWeight: '600'
    lineHeight: 20px
  body:
    fontFamily: Be Vietnam Pro
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label:
    fontFamily: Be Vietnam Pro
    fontSize: 12.5px
    fontWeight: '500'
    lineHeight: 18px
  caption:
    fontFamily: Be Vietnam Pro
    fontSize: 11.5px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  rail-width: 80px
  sidebar-width: 260px
  topbar-height: 80px
  content-gap: 16px
  content-px: 64px
  content-py: 28px
---

# Design system — Kaleïdo

Visual identity for **saas-provisionning**, ported from the in-house
"Kaleïdo" design system (originally a custom Dolibarr module).

Tokens live in [`app/globals.css`](app/globals.css) and are exposed as
Tailwind v4 utilities (`bg-accent`, `text-muted`, `rounded-2xl`,
`shadow-card`, ...). Read that file before adding new tokens.

---

## 🎨 Vibe

Airy, spacious, slightly playful. Reference: **Linear / Notion / Vercel
dashboard** — **not** corporate enterprise.

- Soft lavender as the dominant neutral (never cold greys).
- Generous border-radius everywhere (8–16px standard, 24px for hero cards).
- Subtle purple-tinted shadows.
- Pastel semantic colours used sparingly for personality (a pink dot, a
  teal badge).
- Never harsh black, never pure-neutral-grey backgrounds.

---

## 🎨 Colors

### Surfaces & text

| Token | Hex | Usage |
|---|---|---|
| `page` / `surface` | `#ffffff` | Page bg, card bg |
| `content` | `#f8f4fb` | Content panel bg (lavender tint) |
| `text` | `#1F1F2E` | Primary text |
| `soft` | `#6B7280` | Secondary text |
| `muted` | `#9CA3AF` | Tertiary, placeholders |
| `border` | `#ede8f5` | Default 1px borders |
| `border-light` | `#f5f2f9` | Subtle dividers |

### Accent & Tertiary

| Token | Hex | Role |
|---|---|---|
| `accent` | `#6C63F0` | Primary action color |
| `accent-light` | `#EDE9FE` | Primary soft background |
| `tertiary` | `#F7F2FA` | Pale lilac accent for subtle categorization |

### Semantic palette

Each colour has a `-light` pastel variant (used for soft backgrounds /
badges / soft buttons).

| Token | Solid | Light |
|---|---|---|
| `success` | `#1d9e75` | `#e6f7f2` |
| `warning` | `#eb7413` | `#fdf2e9` |
| `info` | `#378add` | `#e8f2fd` |
| `danger` | `#dc2626` | `#fff1f2` |
| `pink` | `#ec4899` | `#fdf2f7` |
| `yellow` | `#ef9f27` | `#fef9ec` |
| `purple` | `#8b5cf6` | `#f5f3ff` |
| `teal` | `#14b8a6` | `#f0fdfa` |
| `dark` | `#3e3d54` | `#f4f4f7` |

### Dark mode

Triggered via `.dark` class on `<html>`. All semantic tokens are
overridden in [`globals.css`](app/globals.css). Key shifts: page bg → `#28283f`, accent
→ `#818CF8`.

---

## 🔤 Typography

All levels utilize **Be Vietnam Pro**.

| Role | Size | Weight |
|---|---|---|
| Page title | 20px | 700 |
| Section title | 11px uppercase, letter-spacing 0.6px | 700 / muted |
| Card title | 14.5px | 600 |
| Body | 13px | 400 |
| Label | 12.5px | 500 |
| Caption | 11.5px | 400 / muted |

---

## 📐 Spacing, radius, shadow

**Radius scale:** 4 (sm) / 8 (default) / 12 (md) / 16 (lg) / 24 (xl) / 999 (pills).

**Shadows** (lavender-tinted, never harsh):

```
shadow-sm:       0 1px 3px rgba(0,0,0,.05)
shadow-card:     0 2px 4px -1px rgba(130, 120, 180, 0.18)
shadow-lift:     0 10px 25px -5px rgba(0,0,0,0.1)        /* hover */
shadow-dropdown: 0 8px 32px rgba(0,0,0,.10)
```

**Layout tokens:** icon rail 80px, side menu 260px, topbar 80px, content
gap 16px.

---

## 🏗️ App shell

Three columns, full height, no body scroll:

```
┌──────┬───────────────┬─────────────────────────────────────┐
│      │               │  topbar (80h, white)                │
│ rail │  side menu    ├─────────────────────────────────────┤
│ 80px │  260px        │  ╭──────────────────────────────╮   │
│ lav. │  white        │  │ content panel (lavender,     │   │
│      │               │  │ rounded-24, scrollable)      │   │
│ icons│  nav grouped  │  │                              │   │
│ 48px │  sections     │  ╰──────────────────────────────╯   │
└──────┴───────────────┴─────────────────────────────────────┘
```

### Icon rail (col 1)

- 80px wide, background `content` (`#f8f4fb`).
- Icon buttons: 48×48, `rounded-xl` (24px), inactive `icon-color` (`#b0a8d4`).
  - Hover: bg `rgba(108,99,240,.1)` + color `accent`.
  - Active: bg `accent` solid + white icon.

### Side menu (col 2)

- 260px wide, white.
- Nav item: 13px, dark grey, 7px padding.
  - Active: bg `accent-light` (`#EDE9FE`), weight 600, **3px solid `accent` right border**.

### Topbar (col 3, top)

- 80px tall, white.
- Search trigger pill (left): 38px tall, bg `content` (`#f8f4fb`), `rounded-lg` (16px).

### Content panel (col 3, body)

- Inside a `rounded-xl` (24px) panel, bg `content` (`#f8f4fb`).
- Padding: 28px top/bottom, 64px left/right.

---

## 🧩 Component patterns

### Buttons

- **Solid** — filled accent/tertiary bg, white text.
- **Soft** — pastel-light bg + bold coloured text.
- **Outline** — 1.5px border, transparent bg.

### Inputs

- **Default**: height 44px, 1.5px border `border`, `rounded-lg` (16px), white bg. Focus → `accent` border.

### Cards

- White bg, `rounded-lg` (16px) or `rounded-xl` (24px) for hero cards.
- 1px `border-light` border, `shadow-card`.

### Tables

- White bg, `border-collapse: separate`.
- Header: bg `#faf8fc`, 13px/600 `text`, 1px `border` bottom.

### Badges & pills

- Full-rounded (`rounded-pill`).
- Soft pastel bg + matching coloured text.