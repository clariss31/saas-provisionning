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

# Vérification (typecheck / build / tests)

Ne **pas** lancer `tsc`, `next build` ni la suite de tests en local : la
vérification de types et le build sont exécutés **sur Git (CI / GitHub Actions)**.
Se contenter d'éditer le code proprement ; ne pas proposer de commande de
vérification non sollicitée.

# Qualité, performance et accessibilité

Ces règles s'appliquent à tout code produit dans ce projet.

## Documentation et lisibilité du code

- Documenter les principales fonctions / composants en suivant les guidelines
  **JSDoc** (et/ou **Storybook** pour les composants UI). Les commentaires sont
  rédigés **en français**.
- Le code doit rester **compréhensible** en toute circonstance : nommage
  explicite, fonctions courtes, pas d'abréviations obscures.
- Dès qu'un passage comporte de la **logique complexe**, il est accompagné d'au
  moins un commentaire qui en éclaire le fonctionnement (le « pourquoi », pas
  seulement le « quoi »).

## Performance

- **Optimiser la performance** par défaut (images via `next/image`, peu de
  JavaScript côté client, pas de dépendances superflues).
- L'application obtient **au moins 90** sur Lighthouse, avec les rubriques
  suivantes **au vert** :
  - **Performances**
  - **Accessibilité**
- Utiliser le **rendu côté serveur (SSR/SSG)** pour les pages qui s'y prêtent
  (notamment les pages vitrines) afin de gagner en performance. Réserver
  `"use client"` aux seuls composants réellement interactifs.

## Accessibilité

- L'application **ne présente aucune erreur lors d'un audit WAVE** :
  - aucune erreur dans le résumé (« Errors ») ;
  - aucune erreur de **contraste**.
- L'application est accessible au **minimum WCAG niveau AA** (WCAG 2 AA) :
  structure sémantique et hiérarchie de titres correctes, alternatives
  textuelles, navigation au clavier, focus visible, attributs ARIA pertinents
  (sélecteur de prix, formulaires…), contrastes validés.
