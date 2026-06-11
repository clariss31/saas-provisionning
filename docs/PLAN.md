# Plan d'action — Provisionner une vraie instance Dolibarr en fin de tunnel (OODA)

## Observe — où on en est

Le **parcours complet est déjà livré en mode simulé** (`DOLIBARR_MODE=mock`) :
choix d'offre → tunnel `/inscription` → `POST /api/inscription` → `createInstance`
→ redirection `/provisioning/[ref]` → polling → e-mail de bienvenue. Tout le front,
la sécurité d'entrée et la couche d'isolation Dolibarr sont en place.

**Déjà fait (ne plus y revenir) :**
- Config & isolation : [.env.example](../.env.example), [lib/dolibarr/client.ts](../lib/dolibarr/client.ts)
  (bascule `mock`/`live`, en-tête `DOLAPIKEY`, `DolibarrError`),
  [lib/dolibarr/instances.ts](../lib/dolibarr/instances.ts) (API métier unique).
- MailJet : [lib/email/mailjet.ts](../lib/email/mailjet.ts), [lib/contact/email.ts](../lib/contact/email.ts),
  [lib/instances/ready-email.ts](../lib/instances/ready-email.ts) (fallback log sans clés).
- Sous-domaine (US 5.2) : [lib/instances/subdomain.ts](../lib/instances/subdomain.ts) + test,
  [app/api/subdomain/check/route.ts](../app/api/subdomain/check/route.ts), champ live côté tunnel.
- Tunnel d'inscription : [app/(public)/inscription/page.tsx](<../app/(public)/inscription/page.tsx>)
  + `components/inscription/*` (mot de passe haché côté client, [lib/instances/password.ts](../lib/instances/password.ts) + test).
- Soumission : [app/api/inscription/route.ts](../app/api/inscription/route.ts) (validation serveur → `createInstance`).
- Tableau de bord : [app/(public)/provisioning/[ref]/page.tsx](<../app/(public)/provisioning/[ref]/page.tsx>),
  [app/api/provisioning/[ref]/route.ts](<../app/api/provisioning/[ref]/route.ts>) (polling, 4 étapes),
  [app/api/provisioning/notify/route.ts](../app/api/provisioning/notify/route.ts) (e-mail final idempotent).

**Ce qui manque (le sujet de ce plan) :**
- Le mode **`live`** ne provisionne **rien** : `liveCreateInstance` / `liveGetInstanceStatus`
  / `liveIsSubdomainAvailable` / `liveClaimReadyNotification` sont des ébauches marquées
  `TODO(Lot 7)` dans [lib/dolibarr/instances.ts](../lib/dolibarr/instances.ts).
- Le **mécanisme de clonage** du Maître (Sell Your SaaS) n'est pas encore câblé — on ne
  connaît pas le schéma exact qui déclenche un déploiement.
- L'**infra** (gabarit + Kaleido, serveur de déploiement VM 7724, cron, DNS wildcard) n'est pas montée.

---

## Orient — objectif et inconnue bloquante

**Objectif :** qu'à la fin du questionnaire, l'app crée une **vraie instance Dolibarr**
accessible sur `https://<sous-domaine>.pichinov.fr`. Concrètement : faire passer
[lib/dolibarr/instances.ts](../lib/dolibarr/instances.ts) de `mock` à `live` fonctionnel,
sans rien changer au front (l'isolation est déjà là).

**Inconnue bloquante :** on ne connaît pas encore l'objet/les champs qui déclenchent un
clone côté Maître. L'accès Maître + API est **obtenu** ; la reconnaissance se fait via
l'explorateur d'API. Tant que ce schéma n'est pas confirmé, on **garde `mock`**. → Lot 7
est donc une étape de **recon**, et tout le reste en découle mécaniquement.

**Décisions déjà validées (rappel) :** provisioning piloté par contrat via Sell Your SaaS ;
de bout en bout automatisé ; sans paiement (MVP) ; **instance identique pour tous** (métier
ignoré pour l'instant) ; un skill Claude dédié à l'exploitation.

---

## Decide / Act — lots restants

### Lot 7 — Recon du mécanisme de provisioning du Maître ⟵ **priorité, gating**
But : produire une **note de schéma** (endpoints + payloads réels) qui rend le code `live` trivial.
- Confirmer que **Sell Your SaaS est installé et exposé en REST** sur le Maître
  (module actif, objets visibles via `/api/index.php/explorer`).
- Identifier l'**objet déclencheur réel** du clone : contrat + extrafields ? objet SYS dédié
  (package / instance / deployment) ? Lister ses **champs obligatoires** (nom d'instance =
  sous-domaine, login admin, e-mail, mot de passe admin, identifiants DB).
- Comprendre le **cycle de statut** (`DEPLOY_IN_PROGRESS` → `DEPLOYED` → …) et où il se lit en REST.
- Vérifier la **portée du DOLAPIKEY** (droits Tiers + Contrats + objets SYS).
- Trancher la **source de vérité d'unicité** du sous-domaine (registre SYS vs `code_client` du tiers).
- Outils : explorateur d'API Dolibarr et/ou MCP `Dolibarr_RF_Dev` pour inspecter les objets.

### Lot 8 — Implémenter le mode `live` ([lib/dolibarr/instances.ts](../lib/dolibarr/instances.ts))
Une fois le schéma du Lot 7 connu, remplacer les 4 stubs `TODO(Lot 7)` :
- `liveCreateInstance` : créer le(s) objet(s) avec les champs confirmés → déclenche le clone.
  **Transmet le mot de passe choisi** (Option B) au Maître pour créer l'admin de l'instance ;
  `CreateInstanceInput.password` porte désormais le **clair** (jamais journalisé/persisté).
- `liveGetInstanceStatus` : mapper le statut SYS réel sur `state` / `step` (4 sous-étapes UI).
- `liveIsSubdomainAvailable` : interroger la vraie source d'unicité.
- `liveClaimReadyNotification` : idempotent via un extrafield « notifié ».
- **Appliquer l'Option B côté front** (indépendant de la recon, faisable tôt) : remplacer l'envoi
  du `passwordHash` par le mot de passe en clair (sur TLS) dans `components/inscription/*`,
  remplacer la validation `^[a-f0-9]{64}$` de
  [app/api/inscription/route.ts](../app/api/inscription/route.ts) par une **politique de mot de
  passe** (longueur/complexité), retirer le hachage SHA-256 de
  [lib/instances/password.ts](../lib/instances/password.ts) (la **jauge de robustesse reste**).
- Basculer `DOLIBARR_MODE=live` dans `.env.local` (URL + clé), **fallback `mock` conservé**.
- Tests : mocker `dolibarrFetch` pour couvrir création + lecture de statut sans réseau ;
  adapter les tests du tunnel à la nouvelle validation du mot de passe.

### Lot 9 — Gabarit + Kaleido + infra de déploiement (côté agence)
**Injection Kaleido — Option recommandée retenue ✅ : « baker » Kaleido dans la base modèle.**
- Préparer l'**instance gabarit** Dolibarr avec module **Kaleido** installé/activé ; son dump DB
  + ses fichiers `htdocs/custom/kaleido/` constituent le **package SYS**, donc chaque clone hérite
  de Kaleido **sans étape post-déploiement**. *(Alternative — script post-déploiement qui copie
  et active le module — écartée car plus fragile ; à réserver aux correctifs.)*
- Configurer le **serveur de déploiement** sur la VM 7724, le **cron SYS**, le **DNS wildcard**
  `*.pichinov.fr`, et le **DOLAPIKEY** de service.

### Lot 10 — Skill `kaleido-provisioning`
- `.claude/skills/kaleido-provisioning/SKILL.md` : appels API Maître, **schéma SYS confirmé au Lot 7**,
  règles slug/unicité, procédure d'injection Kaleido dans le gabarit, déclenchement + suivi du clone.

---

## Décision prise — mot de passe admin : Option B ✅ (l'utilisateur choisit son mot de passe)

Le tunnel envoyait le mot de passe **haché SHA-256 côté navigateur**
([route inscription](../app/api/inscription/route.ts) attend `^[a-f0-9]{64}$`), donc le serveur
ne voyait jamais le clair — or Dolibarr ne peut pas créer un compte admin d'instance à partir de
ce hash (il applique son propre hachage, le SHA-256 n'est pas réversible).

**Choix retenu (Option B) :** le client **choisit son mot de passe** dans le tunnel, et ce mot de
passe sert réellement à créer l'admin de l'instance. Conséquence : on **abandonne le hachage
SHA-256 côté navigateur** pour ce champ. Le mot de passe transite **en clair sur TLS** jusqu'à
notre serveur puis est **relayé au Maître** (HTTPS) pour créer le compte admin — exactement
comme toute inscription classique. Règles strictes : **jamais journalisé, jamais persisté**
au-delà de la requête, jamais renvoyé au client. La **jauge de robustesse reste** côté front, et
la validation passe d'un hash à une **politique de mot de passe** (longueur/complexité minimales).
Détaillé dans le Lot 8. *(Option A — SYS génère le mot de passe — écartée : le client veut le choisir.)*

---

## Fichiers critiques (restants)

| Action | Fichier |
|---|---|
| Implémenter le `live` (4 fonctions) | [lib/dolibarr/instances.ts](../lib/dolibarr/instances.ts) |
| Ajuster appels REST si besoin | [lib/dolibarr/client.ts](../lib/dolibarr/client.ts) |
| Mot de passe en clair sur TLS → Maître (Option B) | [app/api/inscription/route.ts](../app/api/inscription/route.ts), `components/inscription/*`, [lib/instances/password.ts](../lib/instances/password.ts) |
| Skill (nouveau) | `.claude/skills/kaleido-provisioning/SKILL.md` |
| Infra (hors repo) | gabarit Dolibarr + Kaleido, serveur de déploiement VM 7724, cron, DNS |

---

## Vérification — bout en bout réel

1. `DOLIBARR_MODE=live` + URL/clé renseignées.
2. Compléter `/inscription` → un objet (tiers + contrat/instance SYS) **apparaît dans le Maître**.
3. Le cron SYS clone → `/provisioning/[ref]` progresse jusqu'à `DEPLOYED`.
4. Le bouton final pointe vers `https://<sous-domaine>.pichinov.fr` **réellement accessible** (Kaleido présent).
5. E-mail de bienvenue reçu (une seule fois).
6. `npm run test` reste vert (toggle Tarifs US 4.2, sous-domaine US 5.2) ; WAVE 0 erreur ; Lighthouse ≥ 90.

---

## Hypothèses & points à confirmer

- **SYS réellement installé/exposé** sur le Maître ? Si non, faire le Lot 9 d'abord, ou prévoir une
  alternative (endpoint/webhook custom sur le Maître déclenchant le script de clone).
- Tant que l'infra n'est pas prête, `lib/dolibarr/instances.ts` reste en `mock` (le front est complet).
- La grille tarifaire exacte et l'étape fiscalité seront réintégrées quand on quittera le modèle
  « instance unique pour tous ».
