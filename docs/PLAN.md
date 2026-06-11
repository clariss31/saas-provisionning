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
- ⬜ **Serveur de déploiement** : transformer le **VPS OVH** (IP `217.182.252.69`) en serveur SYS — install
  **root** : Apache/MySQL/agent SYS/jails/Postfix/certbot wildcard/AppArmor + montage NFS depuis le Master.
  ⚠️ Le Master étant sur mutualisé (pas d'export NFS possible), il faudra sans doute **mettre le Master AUSSI
  sur le VPS** (SYS autorise Master+Déploiement sur un même serveur en petite infra).
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

## Runbook SYS — créer un package métier (réalisé pour **Fleuriste**, le 11/06/2026)

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
