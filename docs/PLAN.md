# Plan d'action — Provisionner une instance Dolibarr (SellYourSaas)

## 🎯 Objectif
À la fin du questionnaire (`/inscription`), l'app crée **automatiquement une vraie instance
Dolibarr** pré-configurée pour le métier choisi, accessible sur `https://<client>.with1.pichinov.fr`.

## 🏗️ Architecture (validée)
- **Master** = Dolibarr + module **SellYourSaas (SYS)** sur **hébergement OVH mutualisé Performance**
  (back-office : clients, contrats, packages, services). Le mutualisé **ne déploie pas** d'instances.
- **Serveur de déploiement** = **VPS Linux (root)** où les instances clientes sont réellement déployées
  (comptes Unix, vhosts Apache, bases, jails). **Un seul wildcard DNS** `*.with1.pichinov.fr → IP VPS`.
- **App Next.js** = le tunnel public ; à la soumission, elle déclenche le provisioning côté SYS.
- `withX` = numéro du serveur de déploiement (scaling : `with1`, `with2`…).

## 🔑 Accès & emplacements clés
- **SSH Master** : `ssh ridinteadu-fabrice@ssh02.cluster128.gra.hosting.ovh.net` (SSH activé dans Manager OVH → Hébergement → onglet **FTP-SSH**).
- **DATA_ROOT** Master : `/home/ridinteadu/kaleido/dolibarr/documents` (clé `$dolibarr_main_data_root` de `htdocs/conf/conf.php`).
- **Image déployable** : `…/documents/sellyoursaas/git/dolibarr_24.0` (Dolibarr 24.0-beta + **Kaleido** dans `htdocs/custom/kaleido`).
- **Dumps des packages** : `…/documents/sellyoursaas/packages/<Métier>/<metier>.sql`.
- **Install de référence** (fabrique des dumps) : `https://ref.pichinov.fr` → dossier `~/kaleido/reference`, base MySQL **`ridinteaduprovi`** / hôte **`ridinteaduprovi.mysql.db`**, admin Dolibarr `admin` / `adminadmin`.
- **API REST du Master** : `https://kaleido.pichinov.fr/api/index.php` (auth en-tête **`DOLAPIKEY`**) — utilisée en **lecture** (unicité sous-domaine + suivi statut).
- **Portail provisioning** (à monter) : `https://myaccount.pichinov.fr/register_instance.php`.
- **VPS** : à commander (**VPS-2 Ubuntu 24.04**). *(L'ancien VPS `vps-256e7885` / `217.182.252.69` est un VPS Windows → inexploitable.)*

---

## 📋 Les étapes

### ✅ 0. Front Next.js (déjà livré, mode `mock`)
Tunnel `/inscription` (3 étapes) + check sous-domaine live (US 5.2) + tableau de bord `/provisioning/[ref]`
(polling, 4 sous-étapes) + e-mail MailJet. Couche d'isolation `lib/dolibarr/*` avec bascule `mock`/`live`
(le défaut reste `mock`). Tests Jest verts (toggle Tarifs US 4.2, sous-domaine US 5.2, mapping métier, mdp).

### ✅ 1. Configurer le module SellYourSaas (Master)
Setup : <https://kaleido.pichinov.fr/custom/sellyoursaas/admin/setup.php>
- Comptes `anonymous` + `anonymousbatch` (permissions minimales), tags **« Produits Saas »** / **« Clients SaaS »**.
- Réglages : nom du service (Provi), domaine `pichinov.fr`, e-mails (`support@`/`noreply@pichinov.com`), URL `myaccount.pichinov.fr`.

### ✅ 2. Créer une Dolibarr de référence (OVH)
<https://ref.pichinov.fr/> — sert **uniquement** à produire les dumps « usine ». Base MySQL dédiée +
sous-domaine Multisite → dossier `~/kaleido/reference/htdocs` → installeur (admin `admin`/`adminadmin`).
*(Détails : Annexe A §B.)*

### ✅ 3. Construire l'image + faire les dumps SQL (SSH)
Image `dolibarr_24.0` = code du Master **copié** (la branche GitHub `24.0` n'existe pas encore) + **Kaleido**
embarqué. Puis, pour chaque métier : activer ses modules dans l'install de référence → `mysqldump` →
`…/packages/<Métier>/`. **Procédure complète reproductible : Annexe A (Runbook).**

### ✅ 4. Créer les 4 packages (un par métier)
**Fleuriste · Freelance · Garagiste · ArtisanBTP** — chacun = mêmes champs techniques + son **dump** (= ses
modules métier, cf. SPEC §1.3 et Annexe B §A). Champ IP du VPS dans `MAIN_EXTERNAL_SMTP_CLIENT_IP_ADDRESS`
(à mettre à jour avec la nouvelle IP VPS). État = **Active**.

### ✅ 5. Créer les 4 services *Application*
Un service Dolibarr **type *Application*** par métier, **relié à son package** (champ Package = ce qui rend le
déploiement possible), **30 j d'essai gratuit**, prix 0 (MVP sans paiement), accès SSH/DB = Non.
⚠️ Au clonage d'un service, **revérifier le champ « Package »** (il reste pointé sur l'original).

### ✅ 6. Recon de l'API + câbler l'app au provisioning (Lot 8 front)
- **Recon** : l'API SYS REST ne déploie pas ; la vraie logique est `myaccount/register_instance.php`
  (déclenché par l'appel PHP interne `sellyoursaasRemoteAction('deployall')`). **Détail : Annexe B §C/§D.**
- **Câblage front fait** : **Option B** (mot de passe en clair, `isPasswordAcceptable`, hash SHA-256 retiré) ;
  **mapping `job → Service`** (`serviceForJob` + test) ; `INSTANCE_DOMAIN=with1.pichinov.fr` ;
  `liveCreateInstance` = **POST `register_instance.php`** (scaffold, `TODO(live)` : token CSRF + parsing réponse) ;
  env `SELLYOURSAAS_REGISTER_URL`. Mode `mock` reste le défaut.
- **Test `rest-createonly`** : validé en live → le tunnel **crée bien le tiers** dans le Master (CRUD via API
  OK sur le mutualisé). **Détail + résultat : Annexe B §F.**

### ⬜ 7. Mettre en place le VPS Linux = serveur de déploiement — **EN ATTENTE (commande Pichinov)**
- Commander **VPS-2 (4 vCPU / 8 Go / 75 Go) Ubuntu 24.04 LTS**, accès **root** (clé SSH).
- Install **root** (depuis la doc SYS, 3 phases) : Phase 1 OS & base (hostname, disque data, comptes/SSH,
  `git clone` Dolibarr+SYS, `/etc/sellyoursaas.conf` avec `subdomain=with1.pichinov.fr`) → Phase 2 composants
  (Apache, MySQL/MariaDB, PHP, **agent de déploiement**, **Jailkit**, AppArmor, Postfix, **certbot + cert
  wildcard**, firewall/fail2ban, crons SYS) → Phase 3 Dolibarr + plugin SYS.
- ⚠️ **Mettre le Master AUSSI sur le VPS** (archi mono-serveur) : le mutualisé ne peut pas exporter le **NFS**
  attendu, et l'orchestration SYS a besoin de fonctions système (`exec`/`shell_exec`) **désactivées sur le mutualisé**.
- **DNS wildcard** `*.with1.pichinov.fr → IP du VPS` + **reverse DNS (PTR)**. Mettre à jour l'IP dans le package.

### ⬜ 8. Activer le déploiement réel (live)
- `.env.local` : `DOLIBARR_MODE=live`, `DOLIBARR_API_URL`, `DOLIBARR_API_KEY` (DOLAPIKEY de service),
  `SELLYOURSAAS_REGISTER_URL` (portail myaccount), **retirer** `SELLYOURSAAS_PROVISION_MODE=rest-createonly`.
- Finaliser le `TODO(live)` de `liveCreateInstance` : récupérer le **token anti-abus** (GET `register.php`) avant
  le POST, gérer la **réponse** (réf du contrat) et la **requête longue** (POST async + polling du statut).
- Vérifier bout-en-bout (cf. ci-dessous).

### ⬜ 9. Durcissement avant ouverture publique
- **Rate-limiting** sur `/api/inscription` et `/api/subdomain/check` (elles taperont le Master en live). *(Noté pour plus tard.)*

### ⬜ 10. Vérification
1. Compléter `/inscription` → un **tiers + contrat** apparaissent dans le Master (statut `processing`).
2. SYS déploie sur le VPS → `/provisioning/[ref]` progresse jusqu'à `DEPLOYED`.
3. Le bouton final ouvre `https://<client>.with1.pichinov.fr` **réellement accessible** (Kaleido présent, modules du métier).
4. E-mail de bienvenue reçu (une fois). `npm test` vert ; WAVE 0 erreur ; Lighthouse ≥ 90.

---

## 📎 Annexe A — Runbook : créer un package métier (reproductible)

> Master sur OVH mutualisé Performance. SSH : `ssh ridinteadu-fabrice@ssh02.cluster128.gra.hosting.ovh.net`.
> DATA_ROOT = `/home/ridinteadu/kaleido/dolibarr/documents`. Un package = **(A)** image + **(B)** dump → **(D)** champs UI.

### A. Image de code + Kaleido (en SSH)
```bash
cd ~/kaleido/dolibarr/documents/sellyoursaas/git
# Dolibarr 24 est encore en dev → AUCUNE branche stable "24.0" sur GitHub. On copie le code du Master :
mkdir -p dolibarr_24.0/htdocs
cp -r ~/kaleido/dolibarr/htdocs/.  dolibarr_24.0/htdocs/
cp -r ~/kaleido/dolibarr/scripts   dolibarr_24.0/
rm -f  dolibarr_24.0/htdocs/conf/conf.php          # ne pas embarquer la conf du Master
rm -rf dolibarr_24.0/htdocs/custom/sellyoursaas    # une instance cliente n'est pas un Master
grep DOL_MAJOR_VERSION dolibarr_24.0/htdocs/version.inc.php                 # => 24
ls dolibarr_24.0/htdocs/custom/kaleido/core/modules/modKaleido.class.php    # Kaleido présent
```

### B. Install de référence (pour produire le dump)
1. **Base MySQL** : Manager OVH → Hébergement → *Bases de données*. ⚠️ Hôte de connexion = **`<base>.mysql.db`**
   (ex. `ridinteaduprovi.mysql.db`), **PAS** `mysqlXXX.euYYY` ni `localhost`.
2. **Copie + sous-domaine** :
   ```bash
   cp -r ~/kaleido/dolibarr/documents/sellyoursaas/git/dolibarr_24.0 ~/kaleido/reference
   mkdir -p ~/kaleido/reference/documents
   ```
   Manager OVH → **Multisite** → ajouter `ref.pichinov.fr` → dossier `kaleido/reference/htdocs` (activer SSL).
3. **Installeur** `https://ref.pichinov.fr` (accepter l'alerte SSL le temps que Let's Encrypt se génère) :
   pilote `mysqli`, serveur `<base>.mysql.db`, port `3306`, nom/identifiant = la base, mdp de la base,
   **DÉCOCHER** « Créer la base » **et** « Créer l'utilisateur ». Admin `admin` / `adminadmin` (mdp ≥ 8 car).
   Puis `touch ~/kaleido/reference/documents/install.lock`.
4. Se connecter → **Configuration → Modules** → activer **Kaleido** + les modules du métier (cf. SPEC §1.3).

### C. Dump « usine » (en SSH)
```bash
# Remettre l'admin en état "défaut" attendu par le package (sinon le reset du mdp par instance NE s'applique pas) :
mysql -h <base>.mysql.db -u <user> -p <base> -e \
  "UPDATE llx_user SET pass='admin', pass_crypted='25edccd81ce2def41eae1317392fd106d8152a5b' WHERE login='admin';"
mysqldump --no-tablespaces --single-transaction -h <base>.mysql.db -u <user> -p <base> > ~/<metier>.sql
grep -o "MAIN_MODULE_[A-Z]*" ~/<metier>.sql | sort -u   # vérifier les modules embarqués
mkdir -p ~/kaleido/dolibarr/documents/sellyoursaas/packages/<Ref>
mv ~/<metier>.sql ~/kaleido/dolibarr/documents/sellyoursaas/packages/<Ref>/
```
> ⚠️ Si on se reconnecte à `ref.pichinov.fr` après ce SQL, le login est cassé (pass_crypted = marker). Le restaurer :
> `php -r "echo password_hash('adminadmin', PASSWORD_DEFAULT);"` puis `UPDATE llx_user SET pass_crypted='<hash>', pass=NULL WHERE login='admin';` (dans le **client mysql interactif**, pas en `-e` à cause des `$`).
> Pour les dumps suivants, **ne poser que `pass='admin'`** (sans toucher `pass_crypted`) → le login reste utilisable.

### D. Remplir le package (UI : SellYourSaas → Packages)
3 *Dir with sources* → l'image ; *Template of config file 1* = bloc `conf.php` complet ; *Dir with dump files* =
`__DOL_DATA_ROOT__/sellyoursaas/packages/__PACKAGEREF__` ; *Template of cron file* (ligne complète) ;
*Shell after deployment* (`touch`/`chown`/`chmod`) ; *Shell after switch to paying mode* =
`rm -f __INSTANCEDIR__/documents/installmodules.lock;` ; *Sql after deployment* (grand bloc, avec l'**IP du VPS**
dans `MAIN_EXTERNAL_SMTP_CLIENT_IP_ADDRESS`) ; *Sql to reset password* ; **État = Active**.
*(Pour un nouveau métier : **cloner** un package existant et ne changer que la Réf + le dump.)*

### Pièges rencontrés
- Hôte base OVH = `<base>.mysql.db` (jamais `localhost`).
- Branche GitHub `24.0` inexistante (24 en dev) → copier le code du Master.
- Dolibarr 24 : mdp admin ≥ 8 car → installer avec `adminadmin`, puis SQL pour remettre `pass='admin'`.
- Cert SSL du sous-domaine non immédiat → bypasser l'alerte navigateur le temps qu'il se génère.
- SSH mutualisé restreint (pas de root) → OK image+dump, **insuffisant pour déployer** (→ VPS).

---

## 📎 Annexe B — Guideline : brancher le questionnaire au provisioning

> Recon faite via le swagger : [docs/dolibarr-swagger.json](dolibarr-swagger.json). API Master :
> `https://kaleido.pichinov.fr/api/index.php` (auth `DOLAPIKEY`).

### A. Correspondance métier → Service → Package
| Slug front (`?job=`) | Service / Package | Modules du dump |
|---|---|---|
| `fleuriste` | **Fleuriste** | Produits · Stocks · TakePOS · Factures · Kaleido |
| `freelance` | **Freelance** | Tiers · Propositions · Factures · Projets · Kaleido |
| `garagiste` | **Garagiste** | Produits · Propositions · Stocks · Factures · Kaleido |
| `artisan` | **ArtisanBTP** | Produits · Propositions · Interventions (FICHEINTER) · Projets · Factures · Kaleido |

⚠️ Slug front **`artisan`** → service **`ArtisanBTP`** (mapping `serviceForJob` dans [lib/dolibarr/instances.ts](../lib/dolibarr/instances.ts)).

### B. Données du questionnaire → propriétés de l'instance
- `companyName` → slug → **sous-domaine** → URL `https://<slug>.with1.pichinov.fr`
- `job` → **Service** (table A) → modules/config de la Dolibarr déployée
- `email` → admin de l'instance ; `password` → mdp admin (**Option B : en clair sur TLS** ; jamais journalisé/persisté)
- `managerName` / `legalStatus` / `vat` → société & mentions (non déterminants pour le déploiement)

### C. Flux de provisioning RÉEL (recon `register.php` → `register_instance.php`)
L'**API SYS REST** (`/sellyoursaasapi/*`) ne gère que les **packages** — **aucun endpoint « déployer »**.
La logique est dans **`myaccount/register_instance.php`** :
1. **Tiers** : créé avec `name`, `email`, `phone`, `client=2`, `code_client=-1` (auto).
2. **Contrat** : `ref_customer = <sous-domaine>.<tld>`, `socid`, + **ligne de service** (`fk_product` = id du Service).
3. **Extrafields** (`array_options['options_*']`) : `options_plan`, `options_deployment_status='processing'`,
   `options_deployment_host` (IP VPS), `options_deployment_init_email`, `options_deployment_init_adminpass`
   (**mdp admin EN CLAIR** ← Option B), `options_date_endfreeperiod`, + creds OS/DB **générés par SYS**.
4. **Déclenchement (synchrone ~300 s)** : `sellyoursaasRemoteAction('deployall', $contract, …)` — **méthode PHP**,
   PAS un endpoint REST. Fin OK → `options_deployment_status='done'` + `activateAll()`.
- Lien Service↔Package : le Service porte l'extrafield **`options_package`** = ref du Package.

### D. ⚠️ Conséquence d'archi : l'app POSTe vers `register_instance.php`
L'API REST seule **ne déploie pas** (l'appel `deployall` est interne). → `liveCreateInstance` **POSTe le formulaire
public** vers `register_instance.php` ; SYS fait tout (tiers + contrat + extrafields + creds générés + déploiement).
- **Champs à POSTer** : `username` (e-mail), `orgName`, `password` + `password2` (clair), `phone`, `country`,
  `sldAndSubdomain`, `tldid`, `service` (id Service), `productref`, `package` (ref), `plan`.
- **À valider (`TODO(live)`)** : token anti-abus/CSRF (GET `register.php` d'abord), parsing de la réponse,
  requête longue vs polling.
- **Suivi** (`liveGetInstanceStatus`) : `GET /contracts` → `options_deployment_status` (`processing`→`done`).
- **Unicité sous-domaine** (`liveIsSubdomainAvailable`) : contrats par `ref_customer`.

### E. Décision — mot de passe : **Option B**
Le client choisit son mot de passe ; il transite **en clair sur TLS** (jamais journalisé/persisté) car SYS pose ce
mdp exact sur l'admin de l'instance (extrafield `options_deployment_init_adminpass`). Le hash SHA-256 côté
navigateur est **retiré** ; la jauge de robustesse reste, la validation devient une **politique** (`isPasswordAcceptable`).
*(Option A — SYS génère le mdp — écartée.)*

### F. Test `rest-createonly` (valider le lien app→Master SANS le VPS)
1. DOLAPIKEY sur le Master (droits Tiers + Contrats + Produits).
2. `.env.local` : `DOLIBARR_MODE=live`, `DOLIBARR_API_URL=https://kaleido.pichinov.fr/api/index.php`,
   `DOLIBARR_API_KEY=<clé>`, **`SELLYOURSAAS_PROVISION_MODE=rest-createonly`**. Redémarrer `npm run dev`.
3. Remplir le tunnel → un **tiers « [TEST Provi] »** apparaît dans le Master.
4. **Nettoyer** les `[TEST Provi]` ensuite.
Code : `liveCreateInstanceRestOnly`. Diagnostic : log serveur `[provisioning] createInstance: mode=…`.

> 🧪 **Résultat test API client** : lien front→Master **validé en live** — lecture (GET) ET écriture (POST tiers)
> fonctionnent sur le mutualisé Performance. Le « 503 Varnish » initial = un **champ manquant** (`code_client`,
> exigé par `mod_codeclient_monkey` → fix `code_client: -1`). La création de **contrat** plante en revanche sur le
> mutualisé (un hook SYS appelle une fonction système désactivée) → mise en **best-effort** dans le mode test ;
> elle passera sur le VPS. **« Déploiement introuvable » en fin de tunnel = normal** (pas de contrat/déploiement sur
> le mutualisé). → Confirme : back-office OK sur mutualisé, **déploiement = VPS indispensable**.
