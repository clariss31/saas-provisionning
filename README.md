# saas-provisionning

Plateforme web permettant à des professionnels indépendants et TPE
(freelances, fleuristes, garagistes, artisans) de souscrire de manière
totalement autonome à une instance **Dolibarr** clé en main, épurée et
pré-configurée pour leur secteur d'activité.

L'application orchestre le catalogue d'offres, le tunnel d'inscription, le
provisioning automatisé via le module *Sell Your SaaS* et la facturation
mensuelle. UI inspirée du module Kaleido (Pichinov × Progi16).

> **Contexte :** mission en entreprise — Agence Pichinov.

---

## Stack

- **Next.js 16** (App Router, Server Components)
- **React 19**
- **Tailwind CSS v4** (tokens design via `@theme inline`)
- **TypeScript**
- **Polices :** Poppins + Roboto via `next/font/google` (self-hosted)
- **Tests :** Jest + React Testing Library *(à ajouter)*
- **API backend :** Dolibarr Maître (REST) + module Sell Your SaaS

---

## Quick start

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

Autres scripts :

```bash
npm run build   # build de production
npm run start   # serveur de production
npm run lint    # ESLint
```

---

## Structure du projet

```
saas-provisionning/
├── app/               # routes App Router (Next.js 16)
│   ├── globals.css    # tokens Tailwind v4 + variables Kaleido
│   ├── layout.tsx     # root layout (polices via next/font)
│   └── page.tsx
├── public/            # assets statiques (images via <Image/>)
├── docs/              # spécifications & user stories
│   ├── SPEC.md
│   └── USER_STORIES.md
├── DESIGN.md          # design system Kaleido
├── AGENTS.md          # règles pour les assistants IA
└── CLAUDE.md          # ré-exporte AGENTS.md pour Claude Code
```

---

## Documentation

| Document | Contenu |
|---|---|
| [docs/SPEC.md](docs/SPEC.md) | Spécifications fonctionnelles : périmètre, 4 templates métiers, grille tarifaire, 7 pages, spécifications techniques. |
| [docs/USER_STORIES.md](docs/USER_STORIES.md) | 7 épiques, user stories avec critères d'acceptation et exigences transverses. |
| [docs/USE_CASES.md](docs/USE_CASES.md) | Diagrammes de cas d'usage (Mermaid) : 4 acteurs, 7 pages, 18 cas d'usage.
| [DESIGN.md](DESIGN.md) | Design system Kaleido : palette, typo, app shell, patterns de composants, specs des écrans clés. |
| [AGENTS.md](AGENTS.md) | Règles à respecter par les assistants IA (Next.js 16, design, specs). |

**Avant toute évolution :** lire `docs/SPEC.md` et `docs/USER_STORIES.md`
pour valider que la fonctionnalité s'inscrit dans le périmètre, puis
`DESIGN.md` pour respecter la charte.

---

## Déploiement

L'application Next.js compilée est destinée à être hébergée directement sur
le serveur Dolibarr de l'agence Pichinov, via le module natif **"Site Web"**
de l'infrastructure.
