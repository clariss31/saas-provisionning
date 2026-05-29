<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design

Before any UI/UX work, read [DESIGN.md](DESIGN.md) — Kaleïdo design system (colors, typography, app shell, component patterns). Design tokens are wired into Tailwind v4 via [app/globals.css](app/globals.css); use those utilities (`bg-accent`, `text-muted`, `rounded-2xl`, `shadow-card`, ...) rather than redefining values inline.
