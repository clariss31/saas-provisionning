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
- Generous border-radius everywhere (8–16px standard, 20px for hero cards).
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

### Accent (primary)

| Token | Hex |
|---|---|
| `accent` | `#6C63F0` |
| `accent-light` | `#EDE9FE` |

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
overridden in [`globals.css`](app/globals.css) — components stay the
same, only token values change. Key shifts: page bg → `#28283f`, accent
→ `#818CF8`.

---

## 🔤 Typography

| Font | Use |
|---|---|
| **Poppins** (400/500/600/700) | Primary — body, UI |
| **Roboto** (400/500/700) | Secondary — compact UI (tooltips, dense tables) |

| Role | Size | Weight |
|---|---|---|
| Page title | 20px | 700 |
| Section title | 11px uppercase, letter-spacing 0.6px | 700 / muted |
| Card title | 14–15px | 600 |
| Body | 13–13.5px | 400 |
| Label | 12.5px | 500 |
| Caption | 11–12px | 400 / muted |

---

## 📐 Spacing, radius, shadow

**Radius scale:** 6 / 8 (default) / 12 (inputs) / 14 / 16 (cards) /
20 (hero cards) / 999 (pills).

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
│      │               │  │ rounded-16, scrollable)      │   │
│ icons│  nav grouped  │  │                              │   │
│ 48px │  sections     │  ╰──────────────────────────────╯   │
└──────┴───────────────┴─────────────────────────────────────┘
```

### Icon rail (col 1)

- 80px wide, background `content` (`#f8f4fb`).
- Hamburger top (80px), modules in the middle, theme-toggle + avatar
  bottom.
- Icon buttons: 48×48, `rounded-xl` (12px), inactive `icon-color`
  (`#b0a8d4`).
  - Hover: bg `rgba(108,99,240,.1)` + color `accent`.
  - Active: bg `accent` solid + white icon.

### Side menu (col 2)

- 260px wide, white.
- Top: 80px brand row — 36×36 `accent` square with italic bold white
  letter (the logo mark) + bold text.
- Nav body: scrollable, grouped sections.
  - Section title: 11px uppercase, tracking-wide, `muted`.
  - Nav item: 13px, dark grey, 7px padding, with a 5px coloured `::before`
    dot prefix.
  - Active: bg `accent-light` (`#EDE9FE`), weight 600, **3px solid
    `accent` right border**.
  - Optional right-aligned pill counter (`muted-light` bg).

### Topbar (col 3, top)

- 80px tall, white.
- Search trigger pill (left): 38px tall, bg `content` (`#f8f4fb`),
  `rounded-lg` (10px), search icon, "Search or jump to..." placeholder,
  ⌘K kbd badge on the right.
- Right side: language flag dropdown, bell with `accent` notification
  dot, avatar — each as 38×38 transparent icon-button (hover →
  `accent-light` bg).

### Content panel (col 3, body)

- Inside a `rounded-2xl` (16px) panel, bg `content` (`#f8f4fb`).
- Padding: 28px top/bottom, 64px left/right.
- This is the only scroll container.

---

## 🧩 Component patterns

### Buttons (3 styles)

- **Solid** — filled accent/semantic bg, white text. Hover = subtle dark
  overlay (no scale, no shadow growth).
- **Soft** (preferred for secondary actions) — pastel-light bg + bold
  coloured text. Hover lifts 1px + stronger shadow + inverts to solid.
- **Outline** — 1.5px border, transparent bg. Hover fills with the light
  pastel.

Default: height 38px, padding 8/14, font 13/500, gap 6 (icon ↔ label),
icons 14×14.

### Inputs

- **Default**: height 44px, 1.5px border `border`, `rounded-lg` (12px),
  white bg, 16px horizontal padding. Focus → `accent` border.
- **Modern** (forms hero): height 56px, with a floating purple
  uppercase mini-label inside (11px / 600 / `accent`). Focus → `accent`
  border + 3px `accent-light` glow ring.

### Cards

- White bg, `rounded-2xl` (16px) or `rounded-3xl` (20px) for hero cards.
- 1px `border-light` border, `shadow-card`.
- Hover (when interactive): `shadow-lift`.

### Tables

- White bg, `border-collapse: separate`, `rounded-md` wrapper.
- Header: bg `#faf8fc`, 13px/600 `text`, 1px `border` bottom.
- Rows: 1px `border` divider, hover bg `#fdf9ff` (very light purple tint).
- Active sort: `accent` icon.

### Badges & pills

- Full-rounded (`rounded-pill`).
- 10–11px, bold, uppercase.
- Soft pastel bg + matching coloured text (e.g. success badge = bg
  `success-light` + text `success`).

### Alerts

- `rounded-xl` (12px), 14–18px padding.
- Pastel bg + matching border + matching text colour + leading icon.

### Toasts

- Top-right, white, `rounded-xl` (14px), `shadow-lift`.
- Slide in from the right.
- Coloured icon-square (semantic light bg) on the left.

### Dropdowns

- White, `rounded-xl` (14px), `shadow-dropdown`.
- 6px inner padding, items `rounded-md` with `accent-light` hover.

---

## 📱 Key screens (specs)

### 1. Login

Split layout. Left = lavender gradient illustration / brand showcase.
Right = centered white card: logo, "Welcome back", modern inputs
(email + password), "Remember me" checkbox, full-width solid `accent`
CTA, "Forgot password?" muted link, OAuth soft-outline buttons.

### 2. Dashboard

Full app shell. Inside content panel:

1. Centered AI search bar (white pill, max-w 760px, `rounded-xl`) with a
   38×38 **gradient send button** (`linear-gradient(135deg, #6366f1 0%,
   #a855f7 100%)`).
2. 4-column KPI grid — each card has a soft pastel icon-square top-left,
   uppercase 11px muted label, 22px bold number, trend chevron in
   success/danger.
3. 2-column grid mixing chart card, activity feed, todo list, sales
   pipeline (horizontal stepper with coloured progress dots).

### 3. Provisioning list

Full-width table in a white `rounded-2xl` wrapper. Bulk-action checkbox
column, filter row under the header (inline inputs with the `accent`
focus ring), rows with avatar+name, soft pastel status badge, soft "view"
icon-button, pagination footer.

### 4. Provisioning detail (fiche)

2-column grid: 360px sticky sidebar + flex main.
- Sidebar: avatar card (52px circle, `accent-light` bg, `accent` initials),
  name + role, vertical pipeline-stepper with connecting lines, contact
  list.
- Main: header card (white, `rounded-3xl`, `shadow-card`), tabs, stacked
  white cards for sections (timeline, documents, notes).

### 5. Create / edit form

Single column inside content panel. Grouped sections each as a white
rounded card with uppercase section title + 2-column grid of modern
inputs (floating purple labels). Sticky footer bar at the bottom:
"Cancel" (soft-ghost) + "Save" (solid `accent`) aligned right.

---

## 🔗 Origin

Tokens and component language ported from
`c:\Users\clari\Downloads\kaleido\dolibarr\htdocs\custom\kaleido\assets\css\modules\` —
in particular `vars.css`, `layout.css`, `components.css`, `forms.css`,
`tables.css`. Refer there when extending the system with a component
not yet covered here.
