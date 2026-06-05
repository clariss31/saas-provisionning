# Plan d'action — Rendre l'application de provisioning fonctionnelle (OODA)

## Context

L'application Next.js 16 (`saas-provisionning`, marque « Provi ») présente déjà les
pages vitrines (Accueil, Fonctionnalités, Catalogue métiers, Tarifs) et un
formulaire de contact validé/sécurisé. Il manque tout le **cœur fonctionnel** :
le tunnel d'inscription (Page 5), le tableau de bord de provisioning (Page 6), la
vérification du sous-domaine (US 5.2) et toute la **communication backend** avec
le Dolibarr Maître qui, via **Sell Your SaaS**, doit
cloner une instance Dolibarr par client sur la VM de l'hébergeur (7724).

Décisions validées avec l'utilisateur :
- **Provisioning via Sell Your SaaS** (contrat dans le Dolibarr Maître → cron SYS clone l'instance).
- **Automatisé de bout en bout** (l'inscription déclenche le clonage sans intervention).
- **Sans paiement** pour ce MVP (essai gratuit, Stripe/SEPA plus tard).
- **Métier ignoré pour l'instant** : une instance identique pour tous.
- **Créer un skill Claude** réutilisable pour les opérations de provisioning.

Résultat visé : un prospect choisit une offre → remplit un tunnel court →
l'application crée le client + le contrat dans le Dolibarr Maître via l'API REST →
SYS clone l'instance (avec le module **Kaleido** déjà présent) → le tableau de bord
suit l'avancement en temps réel → le client reçoit un e-mail (MailJet) et accède à
son instance sur son sous-domaine.

---

## Réponses directes à tes questions (l'« Orient » de l'OODA)

### 1. Comment créer une instance depuis l'app (VM 7724) ?
Tu **ne crées pas** l'instance directement par SSH depuis Next.js. Le chemin
supporté par Sell Your SaaS est **indirect** :
1. Next.js appelle l'**API REST du Dolibarr Maître** (en-tête `DOLAPIKEY`) pour
   créer un **tiers** (le client) puis un **contrat** (l'abonnement). Le contrat
   porte les propriétés de l'instance (nom d'instance/sous-domaine, login admin,
   e-mail, identifiants DB générés côté serveur). À la création il est au statut
   `DEPLOY_IN_PROGRESS`.
2. Le **cron de Sell Your SaaS** (sur le serveur de déploiement = VM 7724) détecte
   le contrat, exécute ses scripts (`scripts/action_*.sh`) qui clonent la base +
   les fichiers vers un nouveau sous-domaine, puis passe le contrat à `DEPLOYED`.
3. Next.js **interroge** (polling) l'état du contrat via l'API REST pour animer le
   tableau de bord.

> Pré-requis infra (hors code Next.js, à valider côté agence) : SYS installé sur
> le Maître + un serveur de déploiement configuré sur la VM 7724, le cron SYS
> actif, et un **DOLAPIKEY** d'un utilisateur Dolibarr habilité.

### 2. Vérifier que le nom d'entreprise est valable + unicité
- **Validité** : normalisation + slugify de la raison sociale (minuscules, sans
  accents, `[a-z0-9-]`, longueur 3–40, pas de tirets en bordure). Règles
  réutilisables côté client ET serveur.
- **Unicité** : un appel API asynchrone (debounce) interroge le Dolibarr Maître
  pour savoir si le sous-domaine dérivé existe déjà (recherche de contrat/instance
  par ce nom). Indicateur visuel vert/rouge, **sans bloquer** la saisie, et un
  sous-domaine indisponible **empêche** la validation de l'étape (US 5.2).

### 3. Questions minimales du formulaire pour créer une instance
Comme le métier est ignoré et l'instance identique pour tous, le **strict
minimum** pour qu'un contrat SYS soit déployable :
1. **Raison sociale** → dérive le **sous-domaine / nom d'instance** (avec check de dispo).
2. **Nom du gérant** (prénom/nom de l'admin de l'instance).
3. **E-mail** (login + contact + destinataire de l'e-mail de bienvenue).
4. **Mot de passe admin** (jauge de robustesse, **haché avant envoi**, jamais en clair).

Tout le reste est généré/défini côté serveur : identifiants DB, pays/langue par
défaut (FR), template d'instance. *(La fiscalité/TVA de l'étape 2 du SPEC et le
choix métier sont reportés tant que l'instance est unique.)*

### 4. Injecter le module Kaleido dans chaque instance
**Recommandé : le « baker » dans la base modèle clonée par SYS.** Tu prépares une
instance Dolibarr *gabarit* avec le module Kaleido installé + activé ; son dump DB
+ ses fichiers `htdocs/custom/kaleido/` constituent le *package* SYS. Chaque clone
hérite donc de Kaleido sans étape supplémentaire. *(Alternative : script
post-déploiement SYS qui copie le module et l'active — plus fragile, à réserver aux
correctifs.)* → C'est une tâche **infra/Dolibarr**, pas du code Next.js ; elle sera
documentée et outillée par le **skill**.

### 5. Brancher le formulaire de contact à MailJet
Le point de câblage existe déjà : [lib/contact/email.ts](lib/contact/email.ts)
envoie soit vers `CONTACT_FORWARD_URL`, soit en log. On ajoute `node-mailjet` et
on remplace l'implémentation de `sendContactEmail` par un envoi MailJet
(`MJ_APIKEY_PUBLIC` / `MJ_APIKEY_PRIVATE`, expéditeur `noreply@votre-domaine.fr`,
`Reply-To` = e-mail du prospect, destinataire `support@pichinov.com`). La Server
Action [actions.ts](<app/(public)/contact/actions.ts>) et la validation restent inchangées.

### 6. Comment l'étape provisioning communique avec la création d'instance
- **Soumission** (fin du tunnel) : `POST /api/inscription` (Route Handler serveur)
  → crée tiers + contrat via l'API Dolibarr → renvoie une **référence d'instance**
  (réf. contrat) → redirige vers `/provisioning/[ref]`.
- **Suivi** : la page de provisioning appelle `GET /api/provisioning/[ref]` en
  **polling** (toutes ~3 s). Ce handler lit le statut du contrat côté Dolibarr et
  renvoie un état d'avancement mappé sur les sous-étapes UI (Création BDD →
  Injection Kaleido → Config modules → Accès actif). Quand `DEPLOYED`, le bouton
  devient « Accéder à mon espace » vers `https://<sous-domaine>.pichinov.fr`.

### 7. Comment utiliser Sell Your SaaS
Tu l'utilises **comme moteur de déploiement piloté par contrat**, pas comme API.
Ton app ne parle qu'à l'**API REST Dolibarr** (tiers/contrats) ; SYS fait le reste
en tâche de fond. Côté agence il faut une fois pour toutes : installer SYS,
déclarer le **package** (gabarit Dolibarr + Kaleido), configurer le serveur de
déploiement sur la VM 7724 et le cron. Le **skill** ci-dessous capitalisera ces
procédures.

### 8. Skill(s) Claude — oui
Créer **un skill `kaleido-provisioning`** qui encapsule : appels API Dolibarr
(créer tiers/contrat, lire statut), règles de slug/unicité du sous-domaine,
procédure d'injection du module Kaleido dans le gabarit, et le déclenchement/suivi
SYS. *(Note : il existe déjà un skill `dolibarr-dev` pour le dev de modules
Dolibarr — le nouveau skill est orienté **exploitation/provisioning**, complémentaire.)*

---

## Plan d'exécution (le « Decide / Act »)

> Ordonné pour livrer de la valeur tôt : on câble d'abord ce qui est testable sans
> dépendre de l'infra SYS (front + MailJet + check sous-domaine mockable), puis on
> branche le vrai Dolibarr derrière une couche isolée.

### Lot 0 — Fondations & config
- Créer `.env.example` (puis `.env.local`) : `DOLIBARR_API_URL`, `DOLIBARR_API_KEY`,
  `INSTANCE_DOMAIN` (ex. `pichinov.fr`), `MJ_APIKEY_PUBLIC`, `MJ_APIKEY_PRIVATE`,
  `MAIL_FROM`. Documenter dans le README.
- Ajouter une couche d'accès Dolibarr isolée : `lib/dolibarr/client.ts` (fetch +
  en-tête `DOLAPIKEY`, gestion erreurs) et `lib/dolibarr/instances.ts`
  (`isSubdomainAvailable`, `createInstance`, `getInstanceStatus`). **Toute**
  dépendance Dolibarr passe par là → mockable en test, swappable si l'infra évolue.

### Lot 1 — MailJet (rapide, indépendant)
- `npm i node-mailjet`. Réécrire `sendContactEmail` dans
  [lib/contact/email.ts](lib/contact/email.ts) pour envoyer via MailJet (garder le
  fallback log si les clés sont absentes, pour le dev). Réutiliser le `buildEmail`
  existant. Aucun changement d'API publique → les tests de validation restent verts.

### Lot 2 — Sous-domaine : slug + unicité (US 5.2, **test obligatoire**)
- `lib/instances/subdomain.ts` : `slugify(raisonSociale)` + règles de validité.
- `app/api/subdomain/check/route.ts` (Route Handler) : valide le slug puis appelle
  `isSubdomainAvailable` (Dolibarr). Réponse `{ available, reason }`.
- Composant `components/inscription/SubdomainField.tsx` (client) : debounce, appel
  fetch, indicateur vert/rouge accessible (ARIA `aria-live`), blocage de l'étape si
  indisponible.
- **Test Jest + RTL** `SubdomainField.test.tsx` : saisie → indicateur dispo/indispo
  (fetch mocké) — couvre l'exigence US 5.2.

### Lot 3 — Tunnel d'inscription (Page 5, `/inscription`)
- `app/(public)/inscription/page.tsx` + composants stepper sous
  `components/inscription/`. Le lien existe déjà :
  [JobCatalog.tsx:108](<components/job/JobCatalog.tsx#L108>) pointe vers
  `/inscription?job=...` (et Tarifs ajoutera `&billing=...`).
- MVP simplifié (métier ignoré) : **Étape 1** raison sociale (+ `SubdomainField`) &
  nom du gérant → **Étape 2** e-mail + mot de passe (RegEx e-mail, jauge de
  robustesse, hachage avant envoi). Lire `?job`/`?billing` pour pré-remplir/contexte.
- Validation serveur réutilisée/inspirée de
  [lib/contact/validation.ts](lib/contact/validation.ts) (même rigueur anti-injection).

### Lot 4 — Soumission → création d'instance
- `app/api/inscription/route.ts` : valide le payload, appelle
  `lib/dolibarr/instances.ts#createInstance` (création tiers + contrat
  `DEPLOY_IN_PROGRESS`), renvoie la **réf** d'instance. Mot de passe traité côté
  serveur, jamais journalisé.
- Envoi de l'e-mail de bienvenue MailJet (réutilise la couche MailJet du Lot 1).

### Lot 5 — Tableau de bord de provisioning (Page 6, `/provisioning/[ref]`)
- `app/(public)/provisioning/[ref]/page.tsx` + `components/provisioning/` : 4
  sous-étapes (Création BDD → Injection Kaleido → Config modules → Accès actif),
  passage « En cours » → « Validé ».
- `app/api/provisioning/[ref]/route.ts` : lit le statut du contrat
  (`getInstanceStatus`) et le mappe sur les sous-étapes. **Polling** client (~3 s),
  arrêt à `DEPLOYED`, bouton « Accéder à mon espace [Métier] » vers
  `https://<sous-domaine>.{INSTANCE_DOMAIN}`.

### Lot 6 (hors code app, à cadrer côté agence)
- Préparer le **gabarit Dolibarr + module Kaleido** et le déclarer comme package SYS.
- Configurer serveur de déploiement + cron SYS + DNS wildcard `*.pichinov.fr`.
- Créer le `DOLAPIKEY` de service. *(Le skill documente ces étapes.)*

---

## Fichiers critiques

| Action | Fichier |
|---|---|
| MailJet (réécriture) | [lib/contact/email.ts](lib/contact/email.ts) |
| Couche Dolibarr (nouveau) | `lib/dolibarr/client.ts`, `lib/dolibarr/instances.ts` |
| Slug/unicité (nouveau) | `lib/instances/subdomain.ts`, `app/api/subdomain/check/route.ts` |
| Tunnel (nouveau) | `app/(public)/inscription/page.tsx`, `components/inscription/*` |
| Soumission (nouveau) | `app/api/inscription/route.ts` |
| Dashboard (nouveau) | `app/(public)/provisioning/[ref]/page.tsx`, `app/api/provisioning/[ref]/route.ts` |
| Skill (nouveau) | `.claude/skills/kaleido-provisioning/SKILL.md` |
| Réutilisé | [lib/contact/validation.ts](lib/contact/validation.ts) (patterns d'assainissement) |

> Rappel projet : lire `node_modules/next/dist/docs/` (Next 16 a des breaking
> changes) avant d'écrire les Route Handlers / `page.tsx`, et respecter
> [DESIGN.md](DESIGN.md) + les utilitaires Tailwind (`bg-accent`, `rounded-2xl`,
> `shadow-card`…) pour toute UI. SSR par défaut, `"use client"` réservé aux champs
> interactifs (SubdomainField, jauge mot de passe, polling).

---

## Vérification (bout en bout)

1. **Tests unitaires** : `npm run test` — la suite reste verte ; nouveau test
   `SubdomainField.test.tsx` (US 5.2) passe ; toggle Tarifs (US 4.2) intact.
2. **MailJet** : sans clés → fallback log ; avec clés de test → e-mail reçu sur
   `support@pichinov.com` depuis le formulaire de contact.
3. **Sous-domaine** : saisir une raison sociale libre → vert ; saisir un nom déjà
   pris (mocké/Dolibarr de test) → rouge + étape bloquée.
4. **Tunnel → provisioning** : compléter `/inscription`, soumettre → redirection
   `/provisioning/[ref]` ; vérifier qu'un tiers + contrat apparaissent dans le
   Dolibarr Maître ; le polling fait progresser les 4 étapes jusqu'à « Accès actif » ;
   le bouton final pointe vers le bon sous-domaine ; e-mail de bienvenue reçu.
5. **Accessibilité/perf** : audit WAVE (0 erreur, contrastes OK) et Lighthouse ≥ 90
   (Perf + Accessibilité au vert) sur `/inscription` et `/provisioning/[ref]`.

---

## Hypothèses & points à confirmer
- L'infra SYS (serveur de déploiement sur 7724, cron, package gabarit, DNS wildcard,
  DOLAPIKEY) est à mettre en place côté agence — le code applicatif est conçu pour
  s'y brancher via `lib/dolibarr/*` sans réécriture.
- Tant que l'infra n'est pas prête, `lib/dolibarr/instances.ts` peut fonctionner en
  **mode simulé** (réponses factices) pour développer/tester tout le front.
- La grille tarifaire exacte (annuel/à vie) et l'étape fiscalité seront réintégrées
  quand on quittera le modèle « instance unique pour tous ».
