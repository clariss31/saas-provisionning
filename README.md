# Provi

**La puissance d'un ERP open-source, en toute simplicité.**

Provi permet à des indépendants et TPE (freelances, fleuristes, garagistes, artisans)
de souscrire **en autonomie** à une instance **Dolibarr** clé en main — hébergée en
France et **pré-configurée pour leur métier**. À la fin d'un court questionnaire, une
vraie instance ERP est provisionnée automatiquement et accessible en quelques minutes.

🔗 **En ligne : [provi.pichinov.fr](https://provi.pichinov.fr)**

> Mission en entreprise — Agence Pichinov. UI inspirée du design system **Kaleïdo**.

---

## ✨ Fonctionnalités

- **Vitrine** (accueil, fonctionnalités, métiers) en rendu serveur, optimisée Lighthouse.
- **Tarifs** avec bascule mensuel / annuel (remise) sans rechargement.
- **Tunnel d'inscription** en 3 étapes, avec **vérification de disponibilité du
  sous-domaine** en temps réel.
- **Provisioning automatisé** : à la soumission, une instance Dolibarr est créée et
  déployée via le module *Sell Your SaaS*, avec un **tableau de bord de suivi** en direct.
- **E-mail transactionnel** « Votre ERP est prêt » (lien d'accès + identifiant `admin`).
- **Formulaire de contact** avec envoi e-mail.

---

## 🛠️ Stack technique

| | |
|---|---|
| Framework | **Next.js 16** (App Router, Server Components, SSR) |
| UI | **React 19** · **Tailwind CSS v4** (tokens Kaleïdo via `@theme inline`) · Poppins + Roboto (`next/font`) |
| Langage | **TypeScript** |
| Tests | **Jest** + React Testing Library |
| Backend | API REST du **Dolibarr Maître** + module **Sell Your SaaS** |
| E-mails | **MailJet** |

L'app **ne stocke aucune donnée** : le Dolibarr Maître est la source de vérité. Toute
interaction passe par la couche isolée [lib/dolibarr/](lib/dolibarr/) (`client.ts` +
`instances.ts`), avec une bascule **`mock`** (simulation locale) / **`live`** (API réelle).

---

## 🚀 Démarrage local

**Pré-requis :** Node.js **20.9+**.

```bash
npm install
npm run dev          # → http://localhost:3000 (rechargement à chaud)
```

Par défaut, tout tourne en **mode simulé** (`DOLIBARR_MODE=mock`) : aucune dépendance
réseau, aucune instance réelle créée, les e-mails sont journalisés en console. Idéal
pour développer et tester l'UI sans toucher à la production.

Autres scripts :

```bash
npm run lint         # ESLint
npm test             # tests unitaires (Jest + RTL)
npm run build        # build de production
npm run start        # serveur de production local
```

### Configuration

Copier [.env.example](.env.example) vers `.env.local` (ignoré par git) et renseigner
les valeurs. **Aucune n'est requise en mode `mock`.**

| Variable | Rôle | Requise quand |
|---|---|---|
| `DOLIBARR_MODE` | `mock` (défaut) ou `live` | — |
| `DOLIBARR_API_URL` / `DOLIBARR_API_KEY` | API REST du Maître + jeton `DOLAPIKEY` | mode `live` |
| `SELLYOURSAAS_REGISTER_URL` / `SELLYOURSAAS_ACCOUNT_URL` | Portail de provisioning | mode `live` |
| `INSTANCE_DOMAIN` | Domaine racine des instances | mode `live` |
| `MJ_APIKEY_PUBLIC` / `MJ_APIKEY_PRIVATE` / `MAIL_FROM` | Envoi MailJet | e-mails réels |

> 🔒 **Aucun secret dans git.** Les clés vivent uniquement dans `.env.local` ; seul
> `.env.example` (sans valeur) est versionné.

---

## 📦 Déploiement (CI/CD)

L'application est **déployée en continu** : chaque `push` sur **`main`** déclenche
[GitHub Actions](.github/workflows/deploy.yml) →

1. **Validation** : `lint` + tests + `build` sur un runner Ubuntu.
2. **Déploiement** : si la validation passe, mise à jour en SSH du serveur, puis
   rechargement sans coupure.

En production, le serveur Next.js (`next start`) est géré par **PM2** derrière un
**reverse proxy** (HTTPS Let's Encrypt) et appelle le Dolibarr Maître en interne.
La procédure d'installation serveur détaillée est maintenue **en interne**.

```
push main ─► Actions: lint + tests + build ─► déploiement ─► https://provi.pichinov.fr
            (si ❌ : rien n'est déployé, la prod reste intacte)
```

---

## 🗂️ Structure du projet

```
saas-provisionning/
├── app/
│   ├── (public)/        # pages vitrine + tunnel (accueil, métiers, tarifs, inscription, contact, provisioning)
│   ├── api/             # route handlers serveur (inscription, subdomain/check, provisioning)
│   ├── globals.css      # design tokens Tailwind v4 (Kaleïdo)
│   └── layout.tsx
├── components/          # UI (home, inscription, provisioning, pricing, layout, ui…)
├── lib/
│   ├── dolibarr/        # accès au Maître (client.ts, instances.ts) — bascule mock/live
│   ├── instances/       # sous-domaine, mot de passe, e-mail « prêt »
│   └── email/           # transport MailJet
├── public/              # assets statiques (next/image)
├── deploy/              # CI/CD : config PM2, script de déploiement, vhost, runbook
└── .github/workflows/   # GitHub Actions (validation + déploiement)
```

---

## ✅ Qualité & conventions

- **Accessibilité WCAG 2 AA**, **Lighthouse ≥ 90** (performance + accessibilité au vert).
- **SSR/SSG** pour les pages vitrines ; `"use client"` réservé aux composants réellement interactifs.
- Code et commentaires **en français**, fonctions documentées (JSDoc).
- Charte graphique : voir [DESIGN.md](DESIGN.md). Règles projet : [AGENTS.md](AGENTS.md).

> Les spécifications fonctionnelles détaillées (SPEC, user stories, cas d'usage) sont
> maintenues **en interne** et ne sont pas publiées dans ce dépôt.
