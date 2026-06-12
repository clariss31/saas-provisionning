# Plan d'action — Provisionner une vraie instance Dolibarr en fin de tunnel (OODA)

**Où on en est :** la **config back-office SYS est complète** (package Fleuriste + service Application),
mais le **déploiement réel est BLOQUÉ** : il faut un **serveur de déploiement Linux (root)** et le VPS OVH
existant (`vps-256e7885`, IP `217.182.252.69`) est un **VPS Windows** (la réinstall ne propose que Windows)
→ **inexploitable par SYS**. **Action en attente : commander un VPS Linux (Ubuntu 24.04 LTS)** — décision
d'achat côté Pichinov (`jose.martinez@pichinov.com`).

**Architecture validée :** SYS. **Master** = Dolibarr+module SYS sur **hébergement OVH mutualisé Performance**.
Les **instances clientes se déploieront sur un VPS Linux (root)** = serveur de déploiement (le mutualisé ne sert
qu'au back-office). Le skill `sellyoursaas` est installé localement (réf. opérationnelle).

**Accès & emplacements (Master, en SSH) :**
- SSH Master : `ssh ridinteadu-fabrice@ssh02.cluster128.gra.hosting.ovh.net` (offre Performance, SSH activé)
- DATA_ROOT : `/home/ridinteadu/kaleido/dolibarr/documents`
- Image déployable : `…/documents/sellyoursaas/git/dolibarr_24.0` (Dolibarr 24.0-beta + **Kaleido** dans `htdocs/custom/kaleido`)
- Dump Fleuriste : `…/documents/sellyoursaas/packages/Fleuriste/fleuriste.sql` (Kaleido + **Produits/Stocks/TakePOS/Factures** activés, admin `pass='admin'`)
- Install de référence (sert à produire les dumps) : `https://ref.pichinov.fr` → dossier `~/kaleido/reference`,
  base MySQL **`ridinteaduprovi`** / hôte **`ridinteaduprovi.mysql.db`** / admin Dolibarr `admin` / `adminadmin`.

**✅ Fait :** skill `sellyoursaas` · image+Kaleido · **les 4 packages + services** construits —
**Fleuriste · Freelance · Garagiste · ArtisanBTP** (chacun : dump configuré avec ses modules métier + Kaleido,
package, service *Application* relié, 30 j gratuits, prix 0). Procédure dans le **Runbook**, modules par métier
dans le **SPEC §1.3**, et correspondance métier→service dans la **Guideline** (toutes deux plus bas).
**Recon Lot 7 faite** (API du Master analysée via [docs/dolibarr-swagger.json](dolibarr-swagger.json) → cf. Guideline).

**⬜ Dès que le VPS Linux est là :**
1. Nouvelle **IP** → mettre à jour `MAIN_EXTERNAL_SMTP_CLIENT_IP_ADDRESS` du package (remplacer `217.182.252.69`)
   + créer le **DNS wildcard** `*.with1.pichinov.fr → nouvelle IP` (+ reverse DNS/PTR).
2. **Installer le serveur de déploiement SYS** sur le VPS (Phases 1‑3, cf. Lot 9). ⚠️ Mettre **le Master AUSSI
   sur le VPS** (le mutualisé ne peut pas exporter le NFS attendu par SYS → archi mono-serveur).
3. **Câbler le mode `live`** de l'app Next.js (Lot 8).

**🟢 Lot 8 front — FAIT (12/06/2026) :** **Option B** (mot de passe en clair : tunnel + route +
`isPasswordAcceptable`, hash SHA-256 retiré) ; **mapping `job → Service`** (`serviceForJob` dans
[lib/dolibarr/instances.ts](../lib/dolibarr/instances.ts)) ; **`INSTANCE_DOMAIN=with1.pichinov.fr`** ;
`liveCreateInstance` réécrit en **POST `register_instance.php`** (scaffold avec `TODO(live)` : token CSRF +
parsing de la réponse — à valider une fois VPS/portail en place ; nouvelle env `SELLYOURSAAS_REGISTER_URL`).
Mode `mock` reste le défaut. → Reste **bloqué sur le VPS** pour tout déploiement réel.

---

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
- L'**infra SYS** : ✅ image+Kaleido & **package Fleuriste** construits (cf. **Runbook** plus bas) ;
  reste le **Service Application**, le **serveur de déploiement (VPS OVH)** et le **DNS wildcard**.

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

### Lot 9 — Infra Sell Your SaaS (hébergement OVH)
**Architecture validée :** Master SYS sur **hébergement OVH mutualisé (Performance)** (`~/kaleido/dolibarr`) ;
les instances clientes se déploient sur un **VPS OVH (root)** = serveur de déploiement. Le mutualisé ne sert
qu'au **back-office** ; aucune instance n'y tourne. Pas besoin de l'**API OVH** : SYS crée les vhosts/bases/comptes
sur le VPS et **un seul wildcard DNS** `*.with1.pichinov.fr → IP VPS` suffit (pas de DNS par client).

- ✅ **Skill `sellyoursaas`** installé en local (référence opérationnelle).
- ✅ **Package Fleuriste construit** : image `dolibarr_24.0` avec **Kaleido embarqué** + **dump usine**
  (Kaleido activé, admin en état défaut) → procédure complète dans le **Runbook** ci-dessous.
  *(Kaleido baké dans l'image + le dump = option recommandée, pas de script post-déploiement.)*
- ✅ **Service Application Fleuriste** : service Dolibarr (type *Application*) relié au **package Fleuriste**,
  **30 jours d'essai gratuit**, en vente, prix 0 (MVP sans paiement), accès SSH/DB = Non.
- 🔴 **Serveur de déploiement = BLOQUÉ** : il faut un **VPS Linux (root)**. Le VPS OVH existant
  (`vps-256e7885`, IP `217.182.252.69`) est un **VPS Windows** (réinstall ne propose que Windows) →
  inexploitable. **À commander : un VPS Linux Ubuntu 24.04 LTS** (~4‑8 Go RAM suffisent pour démarrer/tester).
  Ensuite, install **root** : Apache/MySQL/agent SYS/jails/Postfix/certbot wildcard/AppArmor + crons SYS.
  ⚠️ Le Master étant sur mutualisé (pas d'export NFS possible), **mettre le Master AUSSI sur le VPS**
  (SYS autorise Master+Déploiement cumulés en petite infra).
  - **Feuille de route install (depuis la doc SYS) :** Phase 1 OS & base (hostname, disque data, comptes/SSH,
    `git clone` Dolibarr+SYS, `/etc/sellyoursaas.conf`) → Phase 2 composants (Apache, MySQL/MariaDB, PHP,
    agent de déploiement, Jailkit, AppArmor, Postfix, certbot+**cert wildcard**, firewall/fail2ban, crons) →
    Phase 3 Dolibarr + plugin SYS + récupération de la config Master.
- ⬜ **DNS wildcard** `*.with1.pichinov.fr → 217.182.252.69` + **reverse DNS (PTR)** sur l'IP du VPS.
- ⬜ **DOLAPIKEY** de service (consommé par le Lot 8).
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
| Infra SYS (hors repo) | image+Kaleido ✅ · package Fleuriste ✅ · **Service Application** + **serveur de déploiement VPS OVH** + **DNS wildcard** à faire |

---

## Vérification — bout en bout réel

1. `DOLIBARR_MODE=live` + URL/clé renseignées.
2. Compléter `/inscription` → un objet (tiers + contrat/instance SYS) **apparaît dans le Maître**.
3. Le cron SYS clone → `/provisioning/[ref]` progresse jusqu'à `DEPLOYED`.
4. Le bouton final pointe vers `https://<sous-domaine>.pichinov.fr` **réellement accessible** (Kaleido présent).
5. E-mail de bienvenue reçu (une seule fois).
6. `npm run test` reste vert (toggle Tarifs US 4.2, sous-domaine US 5.2) ; WAVE 0 erreur ; Lighthouse ≥ 90.

---

## Guideline — brancher le questionnaire au provisioning (recon Lot 7 + câblage Lot 8)

> Recon faite à partir du swagger de l'API du Master : [docs/dolibarr-swagger.json](dolibarr-swagger.json).
> Host API : **`https://kaleido.pichinov.fr/api/index.php`** — auth en-tête **`DOLAPIKEY`**.

### A. Correspondance métier → Service → Package (le « configurer selon la réponse »)
Les 4 packages + services sont construits (cf. Runbook). Le **slug `?job=`** du tunnel sélectionne le **Service** (qui pointe le **Package** = le dump = les modules) :

| Slug front (`?job=`) | Service / Package SYS | Modules du dump |
|---|---|---|
| `fleuriste` | **Fleuriste** | Produits · Stocks · TakePOS · Factures · Kaleido |
| `freelance` | **Freelance** | Tiers · Propositions · Factures · Projets · Kaleido |
| `garagiste` | **Garagiste** | Produits · Propositions · Stocks · Factures · Kaleido |
| `artisan` | **ArtisanBTP** | Produits · Propositions · Interventions (FICHEINTER) · Projets · Factures · Kaleido |

⚠️ Le slug front **`artisan`** correspond au service/package **`ArtisanBTP`** → mapping explicite à coder.

### B. Données du questionnaire → propriétés de l'instance
- `companyName` → slug → **sous-domaine** → URL **`https://<slug>.with1.pichinov.fr`**
- `job` → **Service** (table A) → modules/config de la Dolibarr déployée
- `email` → admin de l'instance ; `password` → mdp admin (⚠️ **Option B : en CLAIR**, retirer le hash SHA-256 actuel)
- `managerName` / `legalStatus` / `vat` → société & mentions (non déterminants pour le déploiement)

### C. Flux de provisioning RÉEL (recon `register.php` → `register_instance.php`, 12/06/2026)
L'**API SYS REST** (`/sellyoursaasapi/*`) ne gère que les **packages** + `setup`/`statistics` — **aucun endpoint « déployer »**.
La vraie logique est dans **`myaccount/register_instance.php`** (le formulaire `register.php` poste dessus) :
1. **Tiers** (Societe) : `fetch` par email, sinon **création** — `name=orgname`, `email`, `phone`, `client=2`, `tva_assuj=1`, `code_client=-1` (auto — **PAS** le sous-domaine).
2. **Contrat** (Contrat) : `ref_customer = <sous-domaine>+<tld>`, `socid`, `date_contrat=now`, `create()`.
3. **Ligne de service** : `contract->addline(..., productidtocreate = <id du Service métier>, ...)`.
4. **Extrafields du contrat** (`array_options['options_*']`) = TOUTES les propriétés d'instance :
   - `options_plan` = ref du Service · `options_deployment_status` = **`'processing'`** (= en cours)
   - `options_deployment_host` = **IP du serveur de déploiement**
   - `options_deployment_init_email` = **e-mail admin** · `options_deployment_init_adminpass` = **mot de passe admin EN CLAIR** ← confirme **Option B**
   - `options_date_endfreeperiod` = fin d'essai
   - OS **générés par SYS** : `options_hostname_os` / `options_username_os` / `options_password_os` / `options_sshaccesstype`
   - DB **générés par SYS** : `options_hostname_db` / `options_database_db` / `options_port_db` / `options_username_db` / `options_password_db`
   - divers : `options_timezone`, `options_deployment_ip`, `options_instance_unique_id`, `options_custom_url`…
5. **Déclenchement déploiement (SYNCHRONE, timeout ~300 s)** :
   `$sellyoursaasutils->sellyoursaasRemoteAction('deployall', $contract, 'admin', $email, $password, ...)`
   → **méthode PHP** (appel HTTP interne vers l'agent du serveur de déploiement), **PAS un endpoint REST**.
6. Fin OK : `options_deployment_status='done'` + `$contract->activateAll(...)`.
- **Lien Service↔Package** : le Service (produit) porte l'extrafield **`options_package`** = ref du Package.

### D. ⚠️ CONSÉQUENCE MAJEURE sur l'intégration (décision d'archi)
**L'API REST seule NE déploie PAS** : `sellyoursaasRemoteAction('deployall')` est un appel PHP interne, sans équivalent REST. En plus, `register_instance.php` **génère lui-même** les identifiants Unix/DB (lourd à répliquer).
→ **Approche recommandée : l'app Next.js POSTe vers `register_instance.php`** (en imitant le formulaire public), au lieu de répliquer via l'API contrat. SYS fait alors **tout** (tiers + contrat + extrafields + creds générés + déploiement). *(Ça révise l'hypothèse « API REST » du SPEC §3.1 — à acter.)*
- **Champs à POSTer** (vus dans `register.php`) : `username` (e-mail), `orgName` (raison sociale), `password` + `password2` (**en clair**), `phone`, `country`, `sldAndSubdomain` (sous-domaine), `tldid`, `service` (id du Service métier), `productref`, `package` (ref du package), `plan`.
- ⚠️ **À valider** : token CSRF / anti-abus de `register_instance.php` (il check VPN-proba, IP, etc.) → l'app devra d'abord **GET `register.php`** pour récupérer le token, puis POSTer. Et gérer la **requête synchrone longue** (~minutes) vs le dashboard en polling (ex. POST en arrière-plan + polling du statut).
- **Alternative REST** (moins sûre) : créer contrat + extrafields via REST puis déclencher le déploiement autrement — possible **uniquement** s'il existe un **cron SYS** qui déploie les contrats `options_deployment_status='processing'` (à confirmer). Sinon, le contrat resterait « processing » sans jamais déployer.
- **Suivi** (`liveGetInstanceStatus`) : `GET /contracts/{id}` → lire `options_deployment_status` (`processing`→`done`) → mapper sur les 4 étapes UI.
- **Unicité sous-domaine** (`liveIsSubdomainAvailable`) : vérifier les contrats existants par `ref_customer` (= sous-domaine+tld).

### E. À FAIRE AVANT que le questionnaire déploie pour de vrai
1. 🔴 **Serveur de déploiement (VPS Linux)** — sans lui, le contrat se crée mais **rien ne déploie**.
2. Côté SYS : régler le **sous-domaine d'instances = `with1.pichinov.fr`** (module + `/etc/sellyoursaas.conf` du serveur de déploiement) + **DNS wildcard** `*.with1.pichinov.fr`.
3. **Accès Master** : URL `register_instance.php` du portail `myaccount` (provisioning **public**, pas de DOLAPIKEY) **+** un **DOLAPIKEY** de service pour les **lectures** (check unicité + suivi statut via `GET /contracts/{id}`). → `.env.local` : `DOLIBARR_API_URL=https://kaleido.pichinov.fr/api/index.php`, l'URL du portail `myaccount`, `DOLIBARR_MODE=live`.
4. Côté app (Lot 8, partiellement faisable sans VPS) :
   - Mapping `job → Service` (table A) ; `domain` du tunnel = `with1.pichinov.fr`.
   - **Option B** : envoyer le mot de passe **en clair** (retirer le hash SHA-256), valider par politique de mdp.
   - `liveCreateInstance` = **POST vers `register_instance.php`** (cf. §C/§D — **pas** l'API contrat REST) ; `liveGetInstanceStatus` = `GET /contracts/{id}` → `options_deployment_status` (`processing`→`done`) ; `liveIsSubdomainAvailable` = check `ref_customer`.

---

## Runbook SYS — créer un package métier

> Procédure **reproductible** pour les autres métiers (garagiste, freelance…). Le Master SYS est sur
> l'**hébergement OVH mutualisé Performance**.
> **SSH** : `ssh ridinteadu-fabrice@ssh02.cluster128.gra.hosting.ovh.net` (SSH s'active dans Manager OVH →
> Hébergement → onglet **FTP-SSH** ; gamme Pro/Performance requise).
> **DATA_ROOT** du Master = `/home/ridinteadu/kaleido/dolibarr/documents` (lu dans `htdocs/conf/conf.php`,
> clé `$dolibarr_main_data_root`).

Un package = **2 moitiés** : **(A)** l'**image** (code Dolibarr + Kaleido que SYS clonera) et **(B)** le **dump**
(base « usine » à charger). Puis **(D)** on remplit le package dans l'UI.

### A. Image de code + Kaleido (en SSH)
```bash
cd ~/kaleido/dolibarr/documents/sellyoursaas/git
# Dolibarr 24 est encore en dev → AUCUNE branche stable "24.0" sur GitHub (git clone --branch 24.0 échoue).
# On copie donc le code EXACT du Master (même 24.0-beta que Kaleido) :
mkdir -p dolibarr_24.0/htdocs
cp -r ~/kaleido/dolibarr/htdocs/.  dolibarr_24.0/htdocs/
cp -r ~/kaleido/dolibarr/scripts   dolibarr_24.0/
rm -f  dolibarr_24.0/htdocs/conf/conf.php          # ne pas embarquer la conf du Master (sécurité)
rm -rf dolibarr_24.0/htdocs/custom/sellyoursaas    # une instance cliente n'est pas un Master
grep DOL_MAJOR_VERSION dolibarr_24.0/htdocs/version.inc.php                 # => 24
ls dolibarr_24.0/htdocs/custom/kaleido/core/modules/modKaleido.class.php    # Kaleido présent
```

### B. Install de référence (pour produire le dump)
1. **Base MySQL** : Manager OVH → Hébergement → *Bases de données* → créer. ⚠️ L'hôte de connexion est
   **`<base>.mysql.db`** (ex. `ridinteaduprovi.mysql.db`), **PAS** le nom de machine `mysqlXXX.euYYY` ni `localhost`.
2. **Copie + sous-domaine** :
   ```bash
   cp -r ~/kaleido/dolibarr/documents/sellyoursaas/git/dolibarr_24.0 ~/kaleido/reference
   mkdir -p ~/kaleido/reference/documents
   ```
   Manager OVH → onglet **Multisite** → ajouter `ref.pichinov.fr` → dossier racine `kaleido/reference/htdocs` (activer SSL).
3. **Installeur** : ouvrir `https://ref.pichinov.fr` (accepter l'alerte SSL le temps que le certif Let's Encrypt se génère).
   - Base : pilote `mysqli`, *Serveur* = `<base>.mysql.db`, port `3306`, *Nom*/*Identifiant* = la base, mdp de la base,
     **DÉCOCHER** « Créer la base » **et** « Créer l'utilisateur » (ils existent déjà côté OVH).
   - Admin : login `admin`, mdp temporaire **≥ 8 car** (`adminadmin`) — Dolibarr 24 refuse `admin` (trop court).
   - Puis verrouiller : `touch ~/kaleido/reference/documents/install.lock`.
4. Se connecter (`admin`/`adminadmin`) → **Configuration → Modules → activer Kaleido**.

### C. Dump « usine » (en SSH)
```bash
# Remettre l'admin dans l'état "défaut" attendu par le package (sinon le reset du mdp par instance NE s'applique pas) :
mysql -h <base>.mysql.db -u <user> -p <base> -e \
  "UPDATE llx_user SET pass='admin', pass_crypted='25edccd81ce2def41eae1317392fd106d8152a5b' WHERE login='admin';"
# Dump (--no-tablespaces évite l'erreur de privilèges PROCESS du mutualisé OVH) :
mysqldump --no-tablespaces --single-transaction -h <base>.mysql.db -u <user> -p <base> > ~/<metier>.sql
grep -c "CREATE TABLE" ~/<metier>.sql    # doit afficher des centaines de tables (Fleuriste : 286)
tail -2 ~/<metier>.sql                   # doit finir par "-- Dump completed" (preuve non tronqué)
# Placer dans le package :
mkdir -p ~/kaleido/dolibarr/documents/sellyoursaas/packages/<Ref>
mv ~/<metier>.sql ~/kaleido/dolibarr/documents/sellyoursaas/packages/<Ref>/
```
Le `.sql` apparaît alors dans l'onglet **Pièces jointes** du package (UI Master).

### D. Remplir le package (UI : SellYourSaas → Packages)
3 *Dir with sources* → l'image ; *Template of config file 1* = bloc `conf.php` complet ; *Dir with dump files* =
`__DOL_DATA_ROOT__/sellyoursaas/packages/__PACKAGEREF__` ; *Template of cron file* (ligne complète) ;
*Shell after deployment* (`touch`/`chown`/`chmod`) ; *Shell after switch to paying mode* =
`rm -f __INSTANCEDIR__/documents/installmodules.lock;` ; *Sql after deployment* (grand bloc, avec l'**IPv4/IPv6 du VPS**
`217.182.252.69, [2001:41d0:305:2100::d5f3]` dans `MAIN_EXTERNAL_SMTP_CLIENT_IP_ADDRESS`) ;
*Sql to reset password* ; **État = Active**.

### Pièges rencontrés (à ne pas refaire)
- **Hôte base OVH** = `<base>.mysql.db` (jamais `localhost` ni `mysqlXXX.euYYY`).
- **Branche GitHub `24.0` inexistante** (Dolibarr 24 en dev) → copier le code depuis le Master.
- **Dolibarr 24 : mdp ≥ 8 car** → installer avec un mdp temporaire, puis SQL pour remettre `pass='admin'` avant le dump.
- **Cert SSL du sous-domaine** pas immédiat → bypasser l'alerte navigateur (« Continuer ») le temps qu'il se génère.
- **SSH OVH mutualisé = restreint** (pas de root) → OK pour image+dump, **insuffisant pour déployer** (→ VPS root).

### Pour un autre métier
Réutiliser l'install de référence `ref.pichinov.fr` : re-configurer (modules/données du métier) → re-dump dans
`…/packages/<NouveauMetier>` → **cloner le package** (seul le dump diffère d'un métier à l'autre).

---

## Hypothèses & points à confirmer

- **SYS réellement installé/exposé** sur le Maître ? Si non, faire le Lot 9 d'abord, ou prévoir une
  alternative (endpoint/webhook custom sur le Maître déclenchant le script de clone).
- Tant que l'infra n'est pas prête, `lib/dolibarr/instances.ts` reste en `mock` (le front est complet).
- La grille tarifaire exacte et l'étape fiscalité seront réintégrées quand on quittera le modèle
  « instance unique pour tous ».
