<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design

Before any UI/UX work, read [DESIGN.md](DESIGN.md) — Kaleïdo design system (colors, typography, app shell, component patterns). Design tokens are wired into Tailwind v4 via [app/globals.css](app/globals.css); use those utilities (`bg-accent`, `text-muted`, `rounded-2xl`, `shadow-card`, ...) rather than redefining values inline.

# Project context

Before any feature work, read:
- [docs/SPEC.md](docs/SPEC.md) — functional specification (4 business templates, pricing grid, 7 pages, technical constraints).
- [docs/USER_STORIES.md](docs/USER_STORIES.md) — 7 epics, user stories with GIVEN/WHEN/THEN acceptance criteria, non-functional requirements.
- [docs/USE_CASES.md](docs/USE_CASES.md) — diagrams (Mermaid) of the 4 actors and 18 use cases across the 7 pages.

Validate that any new feature fits the documented perimeter. If a request expands or contradicts the spec, flag it before implementing rather than silently extending the scope. When a user story is implemented, the code should satisfy its acceptance criteria — those are the contract.

Mandatory unit tests (Jest + React Testing Library): the Tarifs toggle (US 4.2) and the subdomain availability check (US 5.2).
