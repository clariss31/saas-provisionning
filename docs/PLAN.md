# Plan d'action — Provisionner une instance Dolibarr (SellYourSaas)

## 🎯 Objectif — ✅
À la fin du questionnaire (`/inscription`), l'app crée **automatiquement une vraie instance
Dolibarr** pré-configurée pour le métier choisi, accessible sur `https://<client>.with1.pichinov.fr`.
→ **Le pipeline complet fonctionne de bout en bout** : questionnaire → POST portail → déploiement
automatique (compte Unix, base, dump, vhost+cert, mot de passe admin) → instance connectable.

---

## 🏗️ Architecture finale — **MONO-SERVEUR sur VPS**
- **Un seul VPS Linux** cumule **Master** (back-office : clients, contrats, packages, services) **ET
  serveur de déploiement** (instances clientes : comptes Unix, bases, vhosts Apache).
- **Pourquoi pas le mutualisé `kaleido.pichinov.fr` ?** Le déploiement (`sellyoursaasRemoteAction('deployall')`)
  fait du SSH sortant via `exec`/`shell_exec`, **désactivés sur l'hébergement partagé** → le mutualisé **ne peut
  pas orchestrer**. Le Master doit donc être là où ces fonctions marchent = le VPS. Le mutualisé est **abandonné
  pour SYS** (gardé comme source des dumps / sauvegarde).
- **App Next.js** = tunnel public ; à la soumission elle POSTe le formulaire public vers
  `register_instance.php` du portail (SYS fait tout le reste). Suivi par polling de l'API REST.
- **NFS inutile** en mono-serveur (pas de partage d'image entre serveurs).
- `withX` = pool de déploiement (scaling futur : `with1`, `with2`…). Ici **`with1`**.

---

## 🔑 Accès & emplacements clés

### VPS (Master + déploiement)
- **Machine** : `vps-2f090f3f.vps.ovh.net` — **IPv4 `51.178.29.164`**, IPv6 `2001:41d0:367:345::1`, **Ubuntu 24.04.4 LTS**. Hostname `with1` / FQDN `with1.pichinov.fr`.
- **SSH** : `ssh ubuntu@51.178.29.164` puis `sudo -i` (root). *(Clé SSH + coupure du password = durcissement à venir.)*
- **Back-office Dolibarr (Master)** : `https://with1.pichinov.fr` — admin `admin` / `<mdp choisi à l'install>`.
- **Portail client (myaccount)** : `https://myaccount.with1.pichinov.fr`.
- **Instances** : `https://<client>.with1.pichinov.fr`.
- **Compte Unix central** : `admin` (`/home/admin/wwwroot`). Dolibarr Master = `…/dolibarr` (branche `develop` = 24.0.0-beta), module SYS = `…/dolibarr_sellyoursaas` (lié dans `dolibarr/htdocs/custom/sellyoursaas`).
- **DATA_ROOT Master** : `/home/admin/wwwroot/dolibarr_documents`. **Image** déployable : `…/sellyoursaas/git/dolibarr_24.0`. **Dumps** : `…/sellyoursaas/packages/<Métier>/<metier>.sql`.
- **Base** : MariaDB 10.11, base `dolibarr`, user applicatif `sellyoursaas` (mdp dans `/etc/sellyoursaas.conf`), root via socket Unix.
- **Conf SYS** : `/etc/sellyoursaas.conf` (mono-serveur : `masterserver=1`+`instanceserver=1`, `dnsserver=0`, `signature_key=…`).
- **Agent de déploiement** : service `remote_server_launcher` (port 8080), log **`/var/log/remote_server.log`**.
- **Log Dolibarr Master** (activé) : `/home/admin/wwwroot/dolibarr_documents/dolibarr.log`.
- **API REST** : `https://with1.pichinov.fr/api/index.php` (en-tête `DOLAPIKEY`) — lecture (unicité sous-domaine + suivi statut).
- **DNS (OVH, zone pichinov.fr)** : A/AAAA `with1` + **wildcard `*.with1`** → VPS ; reverse `with1.pichinov.fr`. Certificat Let's Encrypt **wildcard `*.with1.pichinov.fr` + `with1.pichinov.fr`** (plugin DNS-OVH, auto-renouvelé).

### Mutualisé (source des dumps — abandonné pour SYS)
- **SSH** : `ssh ridinteadu-fabrice@ssh.cluster128.hosting.ovh.net`. Home **`/homez.786/ridinteadu`** (≠ `/home/ridinteadu`).
- **Dumps source** : `~/kaleido/dolibarr/documents/sellyoursaas/{git,packages}` (copiés vers le VPS par rsync).
- **Install de référence** (fabrique les dumps) : `https://ref.pichinov.fr` (Annexe A §B).

---

## 📋 Les étapes, dans l'ordre

### Phase 0 — Front & préparation (sur le mutualisé, AVANT le VPS) ✅
- **0.1 Front Next.js** (mode `mock`) : tunnel `/inscription` (3 étapes) + check sous-domaine (US 5.2) + tableau de bord `/provisioning/[ref]` (polling) + e-mail MailJet. Couche `lib/dolibarr/*` avec bascule `mock`/`live`.
- **0.2 Module SYS configuré** sur le mutualisé (brouillon) : comptes anonymes, tags, réglages.
- **0.3 Dolibarr de référence → dumps « usine »** des 4 métiers (Annexe A).
- **0.4 4 packages + 4 services** créés sur le mutualisé (brouillon).
- **0.5 Recon API** : SYS n'a **pas** d'endpoint REST de déploiement ; tout passe par `register_instance.php` (Annexe B §C/§D).
- **0.6 Pivot d'archi** : le test live a révélé que le mutualisé **ne peut pas déployer** (`exec`/`shell_exec` off) → décision **mono-serveur sur VPS**. Tout est **recréé** sur le VPS (l'image + les dumps sont copiés tels quels).

### Phase 1 — Base OS du VPS (root) ✅
> Préalable : DNS posés chez OVH (A/AAAA `with1` + `*.with1` → IP VPS ; reverse via section IP → « Modifier le reverse »).

- **1.1 Hostname + `/etc/hosts`** : `hostnamectl set-hostname with1` ; mapping `51.178.29.164 with1.pichinov.fr with1` ; `hostname -f` → `with1.pichinov.fr`.
- **1.2 Réglages login** : `ln -fs /bin/bash /usr/bin/sh` ; longueur mdp min 16 (`minlength=16` sur la ligne `pam_unix.so` de `/etc/pam.d/common-password`).
- **1.3 Compte Unix `admin`** : `useradd -m -s /usr/bin/bash -g admin admin` (uid ≥ 1000) ; dossiers `/home/admin/{logs,wwwroot,backup}`.
- **1.4 SSH** : `chmod go-rw /etc/ssh/sshd_config` ; bloc `Match User osu*` (`PasswordAuthentication yes`) en fin de `sshd_config` ; sudoers drop-in `Defaults set_home`/`use_pty` ; `sshd -t` puis `systemctl reload ssh`. *(Pas de `AllowUsers`/coupure password ici = durcissement plus tard.)*
- **1.5 Dossiers de travail** (mono-disque, pas de 2ᵉ disque ni NFS) : `/mnt/diskhome/home`, `/mnt/diskbackup/{backup,archives-test,archives-paid}`, `/home/jail` + liens symboliques, `…/dolibarr_documents/sellyoursaas_local/{spam,crt}`.
- **1.6 Sources** (en `admin`, dans `~/wwwroot`) : `git clone … dolibarr --branch develop` (= 24.0.0-beta, comme l'image) + `git clone … dolibarr_sellyoursaas`.
- **1.7 Conf SYS** : `/etc/sellyoursaas.conf` (`domain=pichinov.fr`, `subdomain=with1.pichinov.fr`, `masterserver=1`, `instanceserver=1`, `dnsserver=0`, `ipserverdeployment`/`allowed_hosts=51.178.29.164`, `databasehost=localhost`, `database=dolibarr`, `databaseuser=sellyoursaas`, `databasepass=<auto openssl rand -hex 16>`, `dolibarrdir=…/dolibarr`, backupdir/archivedir…) + `/etc/sellyoursaas-public.conf` + `mkdir /etc/sellyoursaas.d`.

### Phase 2 — Composants système (root) ✅
- **2.1 Paquets** (mode non-interactif + preseed Postfix « Internet Site » / mailname `with1.pichinov.fr`) : `apache2`+`libapache2-mpm-itk`, `mariadb-server/-client`, `php 8.3` (+ extensions), `ufw`, `fail2ban`, `certbot` (ajouté en 2.6), antivirus/antispam, `postfix`/`mailutils`, etc. ⚠️ `php8.3-fpm` **désactivé** (`systemctl disable php8.3-fpm`) — SYS utilise **MPM-ITK + mod_php**, pas php-fpm.
- **2.2 UID + Apache** : `/etc/login.defs` `UID_MAX`/`GID_MAX` = 500000 ; `a2dismod mpm_event` + `a2enmod mpm_prefork mpm_itk php8.3 rewrite headers ssl http2 vhost_alias …` ; `LimitUIDRange 1 500000` + `LimitGIDRange` ; dossiers `sellyoursaas-{available,online,offline}` + lien `sellyoursaas-enabled` ; `IncludeOptional sellyoursaas-enabled/*.conf` dans `apache2.conf` ; drop-in `PrivateTmp=false`.
- **2.3 MariaDB** : root via socket (défaut OK) ; `CREATE DATABASE dolibarr` ; user `sellyoursaas`@`localhost` + GRANTs larges (gère la base Master ET celles des instances) ; mdp lu depuis `/etc/sellyoursaas.conf`.
- **2.4 PHP de base** : `/etc/php/sellyoursaas-base.ini` (timezone Europe/Paris, `memory_limit=512M`, upload 20M/post 24M, `max_execution_time=600`, `max_input_vars=5000`) lié dans `cli/conf.d` + `apache2/conf.d`. *(Le `sellyoursaas.ini` du dépôt = pré-traitement mail `phpsendmail`, à activer au durcissement.)*
- **2.5 Agent de déploiement** : `ln -fs …/scripts/remote_server_launcher.sh /etc/init.d/remote_server_launcher` ; `systemctl enable --now` → écoute `php -S 0.0.0.0:8080`.
- **2.6 certbot + cert wildcard** : `apt install certbot python3-certbot-dns-ovh` ; **jeton API OVH** (api.ovh.com/createToken, droits GET/POST/PUT/DELETE `/domain/zone/*`) → `/etc/letsencrypt/ovh.ini` (chmod 600) ; `certbot certonly --dns-ovh -d "with1.pichinov.fr" -d "*.with1.pichinov.fr"` (auto-renew).
- **2.7 Firewall + fail2ban** : `ufw allow 22,80,443` puis `default deny incoming`/`allow outgoing` + `--force enable` (le 8080 et le 3306 restent **bloqués de l'extérieur**) ; `fail2ban` actif (prison `sshd`).
- **2.8 `secureBash`** (shell restreint des comptes d'instance) : `cp /bin/dash /bin/secureBash; cp /usr/bin/dash /usr/bin/secureBash; chmod 755 /usr/bin/secureBash`. **Indispensable** (sinon l'auth `osu…` échoue au 1er déploiement — cf. Annexe C).
- **2.9 MariaDB joignable par le réseau** (pour le « SQL après déploiement » : le Master se reconnecte à la base de l'instance via son FQDN) : `bind-address = 0.0.0.0` ; user `sellyoursaas`@`'%'` (mêmes GRANTs) ; `ufw allow from 51.178.29.164 to any port 3306`. Le 3306 reste bloqué pour l'extérieur.
- *(Sautés à ce stade : **Jailkit** (pas de SSH client → inutile), **NFS** (mono-serveur), **AppArmor/watchdogs/crons SYS** = durcissement.)*

### Phase 3 — Master Dolibarr + module SYS ✅
- **3.1 Vhost back-office** : `/etc/apache2/sites-available/with1.pichinov.fr.conf` (80→443, cert wildcard, `DocumentRoot …/dolibarr/htdocs`, **`AssignUserId admin admin`** pour que PHP tourne en `admin` et puisse écrire, `open_basedir`). `a2ensite` + `a2dissite 000-default`.
- **3.2 Installeur Dolibarr** (`https://with1.pichinov.fr/install/`) : base `dolibarr`/`localhost`/`sellyoursaas`, **« Créer la base/l'utilisateur » DÉCOCHÉ**, **répertoire documents = `/home/admin/wwwroot/dolibarr_documents`** (chemin absolu !), URL racine `https://with1.pichinov.fr`. Puis `touch …/dolibarr_documents/install.lock`.
- **3.3 Module SellYourSaas** : `ln -fs /home/admin/wwwroot/dolibarr_sellyoursaas /home/admin/wwwroot/dolibarr/htdocs/custom/sellyoursaas` (le dépôt **EST** le module — pas de sous-dossier `htdocs`) → activer dans Configuration → Modules (+ dépendances).
- **3.4 Config du module** (setup) : nom `Provi`, domaine `pichinov.fr`, e-mails, **URL compte client = `https://myaccount.with1.pichinov.fr`** (avec le `https://` !), répertoires (`/home/jail/home`, `/mnt/diskbackup/…`), **« SSH public keys à déployer »** = contenu de `/home/admin/.ssh/id_rsa_sellyoursaas.pub`.
- **3.5 Comptes anonymes + tags** : users `anonymous` + `anonymousbatch` (permissions minimales, cf. skill) ; catégories produit/tiers (« Services Cloud » / clients).
- **3.6 Fiche serveur de déploiement** (SellYourSaas → Serveurs de déploiement → Nouveau) : domaine `with1.pichinov.fr`, hôte `with1`, IP `51.178.29.164`, **Clé de signature** (🔄). ⚠️ La 🔄 n'a pas persisté → clé posée par SQL **identique** dans la fiche (`llx_sellyoursaas_deploymentserver.serversignaturekey`) ET dans `/etc/sellyoursaas.conf` (`signature_key=…`) + `systemctl restart remote_server_launcher` (cf. Annexe C).
- **3.7 Clé SSH `admin`** : `ssh-keygen … id_rsa_sellyoursaas` ; `pub` dans son propre `authorized_keys` ; `~/.ssh/config` (IdentityFile pour l'IP/FQDN/github) → le Master se connecte en SSH **à lui-même** sans mdp.
- **3.8 Transfert image + dumps** (mutualisé → VPS, en `admin`) : `rsync -az ridinteadu-fabrice@ssh.cluster128.hosting.ovh.net:kaleido/dolibarr/documents/sellyoursaas/git/  …/sellyoursaas/git/` (≈300 Mo) puis idem `packages/`. **Puis fix collation** (dumps faits sous MySQL 8) : `sed -i -E 's/utf8mb4_0900_[a-z_]+/utf8mb4_unicode_ci/g' …/packages/*/*.sql` (sinon MariaDB rejette à l'import, cf. Annexe C).
- **3.9 Recréer 4 packages + 4 services** : packages clonés (Annexe A) — tous les champs sont **portables** (variables `__DOL_DATA_ROOT__`…), l'IP du VPS est déjà dans `MAIN_EXTERNAL_SMTP_CLIENT_IP_ADDRESS`. Services type **Application**, liés au package, **durée par défaut obligatoire** (ex. 1 mois), 30 j d'essai, catégorie « Services Cloud ». L'URL d'inscription se récupère via **SellYourSaas → Subscription Pages**.
- **3.10 Vhost portail myaccount** : `/etc/apache2/sites-available/myaccount.with1.pichinov.fr.conf` (cert wildcard, `DocumentRoot …/dolibarr_sellyoursaas/myaccount`, **`Alias /source /home/admin/wwwroot/dolibarr/htdocs`**). Puis **lien bootstrap** : `ln -s …/dolibarr/htdocs/main.inc.php …/dolibarr_sellyoursaas/myaccount/main.inc.php`. Symlinks cert d'instance : `/etc/apache2/with.sellyoursaas.com.{crt,key,-intermediate.crt}` → `…/letsencrypt/live/with1.pichinov.fr/{fullchain,privkey,chain}.pem`.
- **3.11 Premier déploiement de test** → instance `testfleuriste.with1.pichinov.fr` accessible, login `admin` OK. ✅

### Phase 4 — Brancher l'app Next.js (live) ✅
- **4.1 Prérequis Master** : module **API/Web services REST** activé + **DOLAPIKEY** (fiche user admin → onglet Clé API).
- **4.2 `.env.local`** : `DOLIBARR_MODE=live`, `DOLIBARR_API_URL=https://with1.pichinov.fr/api/index.php` + `DOLIBARR_API_KEY=<clé>`, `SELLYOURSAAS_REGISTER_URL=https://myaccount.with1.pichinov.fr/register_instance.php`, `SELLYOURSAAS_ACCOUNT_URL=https://myaccount.with1.pichinov.fr`, `INSTANCE_DOMAIN=with1.pichinov.fr`. **Pas** de `SELLYOURSAAS_PROVISION_MODE` (vide = vrai déploiement ; `rest-createonly` = test sans déploiement).
- **4.3 `liveCreateInstance`** ([lib/dolibarr/instances.ts](../lib/dolibarr/instances.ts)) finalisé : **GET `register.php`** (récupère cookie de session + **jeton CSRF**) → **POST `register_instance.php`** avec `token` + champs exacts (`username, orgName, phone, password×2, country=FR, sldAndSubdomain, tldid=.with1.pichinov.fr, plan=<service>, origin, partner, tz_string=Europe/Paris`) + cookie + Referer. `register_instance.php` est **synchrone (~5 min)** → on attend **≤12 s** : un rejet (email déjà pris, sous-domaine pris…) revient vite → **erreur remontée à l'UI** ; sinon **fire-and-forget** + suivi par polling.
- **4.4 UI** ([ProvisioningDashboard.tsx](../components/provisioning/ProvisioningDashboard.tsx)) : tolérance des **404 transitoires** (le contrat met quelques s à exister) ; **bouton final → `status.url`** (URL réelle de l'instance, plus kaleido).
- **4.5 Test bout-en-bout** ✅ : questionnaire (email + sous-domaine **neufs**) → déploiement → tableau de bord → instance accessible.

### Phase 5 — Durcissement & polish (en cours 🔄)

- **5.1 Polish — message « email déjà utilisé »** ✅ (18/06) : le rejet SYS *« account already exists »* est mappé en `DolibarrError(…, 409)` dans `lib/dolibarr/instances.ts` → la route `/api/inscription` renvoie le message (status 4xx) → le formulaire l'affiche tel quel : **« Le mail a déjà été utilisé sur une autre instance. Connectez-vous sur votre espace ou utilisez un autre mail. »**. Les autres rejets SYS → message FR générique ; le détail brut reste loggé côté serveur.
- **5.2 Rate-limiting** ✅ (18/06) : `lib/rate-limit.ts` (fenêtre fixe **en mémoire**, par IP via `X-Forwarded-For`) → `/api/inscription` = **5 / 10 min**, `/api/subdomain/check` = **30 / min**. Réponses `429` (+ `Retry-After`). ⚠️ mono-processus seulement ; serverless/multi-instance → store partagé (Redis). Lint + 37 tests verts.
- **5.3 Crons SYS (cycle de vie)** ✅ (18/06) : sans le cron, **aucun** des **22 jobs planifiés** ne tournait (facturation récurrente, fin d'essai → suspension → désinstallation, dumps). Mis en place + **4 pièges corrigés** (tous vérifiés par `cron_run_jobs.php … anonymousbatch`) :
  - **`CRON_KEY` vide** → générée (`openssl rand -hex 24`) et posée en base (const `chaine`, entity 1). Sinon `cron_run_jobs.php` tourne **sans authentification**.
  - **Délais SYS manquants** → `SuspendExpired*` / `UndeployOld*` / `AlertHardEndTrial` en `BadValueForDelay…`. Posé : `…BEFORE_TRIAL_SUSPEND=7`, `…TRIAL_UNDEPLOYMENT=30`, `…PAID_SUSPEND=15`, `…PAID_UNDEPLOYMENT=60`, `…BEFORE_TRIAL_END_FOR_SOFT_ALERT=7`, `…HARD_ALERT=1`, `MAX_UNDEPLOY_PER_CALL=10` (réglables dans le setup module).
  - **Jobs de maintenance en `entity=0`** (`PurgeDeleteTemporaryFilesShort`…) → « User login anonymousbatch does not exist » (le compte batch est en entity 1). Master mono-société → `UPDATE llx_cronjob SET entity=1 WHERE entity=0`.
  - **`Fatal: mysqli object is already closed`** en fin de run = **bénin** (closure de shutdown sur DB déjà fermée, *après* l'exécution des jobs ; `CleanUnfinishedCronjobShort` nettoie les jobs réellement bloqués). **Pas de patch cœur**.
  - **Crontabs** — `admin` : `*/10 cron_run_jobs.php <KEY> anonymousbatch` + `batch_customers.php updatestatsonly` (5h05) + `backupdelete` (0h05) ; `root` : `backup_mysql_system.sh` (0h10) + `perms.sh` (4h00) + `batch_detect_evil_instances.php` (9h00). **+ protection IP** (`cron.service.d/override.conf` : placeholder `1.2.3.4` → IP réelle **avant** `restart cron`, sinon cron ne démarre pas) — anti double-facturation si le VPS est cloné.
  - **Vérifié** (back-office → Outils admin → Travaux planifiés) : jobs exécutés (*Dernier code* 0, *Prochaine exécution* renseignée — ex. job 16 « 124 fichiers supprimés ») ; service `cron` **active** avec la protection IP. *(Jobs agenda e-mail/SMS standard Dolibarr en ⚠️ « non activés » = bénins, hors périmètre SYS.)*
- **5.4 SSH** ✅ (18/06) : clé `id_ed25519` ajoutée au compte `ubuntu` ; password coupé pour les comptes **humains** via le drop-in **`/etc/ssh/sshd_config.d/00-hardening.conf`** (`PasswordAuthentication no` + `PermitRootLogin prohibit-password`). Piège : deux drop-ins cloud-init se contredisaient (`50-cloud-init`=yes **l'emporte** sur `60-cloudimg`=no — « first value wins ») → le `00-`, trié en premier, gagne. Instances **`osu*` préservées** (`Match User osu*` garde `PasswordAuthentication yes`), vérifié **avant** reload par `sshd -T -C user=…` (ubuntu→no, osu*→yes). **Pas d'`AllowUsers`** (bloquerait les `osu*`). `fail2ban`/sshd déjà actif. Testé : clé OK, password → `Permission denied (publickey)`.
- **5.5 E-mails (Postfix + SPF/DKIM/DMARC)** ✅ (18/06) : envoi du SaaS **isolé** sur le sous-domaine `with1.pichinov.fr` (ne PAS toucher le mail apex `pichinov.fr` de l'entreprise = MX OVH + son propre SPF).
  - **opendkim** : clé 2048 bits, sélecteur `mail`, socket `inet:8891@localhost` (Postfix chrooté), `SigningTable *@with1.pichinov.fr`. Postfix branché (`smtpd_milters`/`non_smtpd_milters`, `milter_default_action=accept`) + **`inet_protocols=ipv4`** (PTR posé en IPv4 seulement → évite le rejet IPv6-sans-PTR).
  - **DNS (zone `pichinov.fr`)** : SPF `with1` = `v=spf1 ip4:51.178.29.164 -all` ; DKIM `mail._domainkey.with1` ; DMARC `_dmarc.with1` = `v=DMARC1; p=none; rua=mailto:support@pichinov.com; fo=1`. Les 3 vérifiés propagés.
  - **Expéditeur** : `MAIN_MAIL_EMAIL_FROM` (était le placeholder `robot@domain.com`) + `SELLYOURSAAS_NOREPLY_EMAIL` → `noreply@with1.pichinov.fr` ; `SUPERVISION/MAIN_EMAIL` restent `support@pichinov.com` (destinataires).
  - **Testé** : `opendkim-testkey` → `key OK` ; mail local à `root` signé (`DKIM-Signature: d=with1.pichinov.fr s=mail`) ; mail-tester **7/10** (auth verte ; points manquants = contenu du mail de test, pas l'auth). Logs mail via **journald** (`journalctl`, pas de `/var/log/mail.log` sur Ubuntu 24.04).
  - **Différé** : wrapper `phpsendmail` (utile pour contrôler les mails *des instances*, pas pour l'auth du Master).
- **5.6 AppArmor (isolation des instances)** ✅ (18/06) : profils SYS posés (`usr.bin.secureBash`, main `usr.sbin.apache2` + local `apache2-deployment` qui porte les hats) ; profil **`clamd` désactivé** (`getattr DENIED` depuis le web sinon). Rollout prudent : `apparmor_parser -Q` (valider sans charger) → **complain** (`a2enmod apparmor` + reload) → test instance → **enforce**. Vérifié en enforce : back-office 200, portail 200, **instance navigable**.
  - **Mécanique** : le main `apache2` est volontairement permissif (`/** mrwlkix`), la confinement est dans les **hats**. Master/portail (vhosts **sans** `AADefaultHatName`) → hat permissif `null-<hostname>` (repli sur le parent — côté *trusted*, OK). **Instances** → hat **`sellyoursaas-instances`** (via `AADefaultHatName` du template vhost), **confiné à `/mnt/diskhome/home/osu*/`** = l'isolation multi-tenant.
  - Pièges : Ubuntu **livre apache2 désactivé** (`/etc/apparmor.d/disable/usr.sbin.apache2`, à retirer) ; en complain les audits sont `apparmor="ALLOWED"` (= ce qui serait bloqué en enforce). **Rollback** = `aa-complain … ; systemctl reload apache2`. Le profil `secureBash` (shell SFTP des `osu*`) est aussi en enforce → bloque `/etc/passwd`, `/home/`, sudo.
- **5.7 Divers** ⬜ : les **3 autres métiers** (Freelance/Garagiste/ArtisanBTP) marchent à l'identique (dumps déjà corrigés) ; commit branche `instances` ; cas serverless de `liveCreateInstance` (`after()`/file si déploiement non-persistant).

### Vérification (faite ✅)
1. `/inscription` → tiers + contrat créés dans le Master (statut `processing`). ✅
2. SYS déploie sur le VPS → `/provisioning/[ref]` progresse jusqu'à `DEPLOYED`. ✅
3. Le bouton final ouvre `https://<client>.with1.pichinov.fr` réellement accessible. ✅
4. `npm test` vert. ✅ *(WAVE / Lighthouse à revérifier au polish.)*

### Phase 6 — Mise en ligne du front Next.js (provi.pichinov.fr) ✅ (18/06)
Front déployé en production sur le **même VPS `with1`**, avec **déploiement automatique sur push `main`**. Fichiers dans `deploy/` + runbook `deploy/README.md`.

- **URL** : `https://provi.pichinov.fr` — certificat Let's Encrypt **dédié** via `certbot certonly --dns-ovh -d provi.pichinov.fr` (le wildcard `*.with1.pichinov.fr` ne couvre PAS `provi`, qui est un frère de `with1` sous `pichinov.fr`). DNS : A `provi` → `51.178.29.164`.
- **Reverse proxy = Apache** (déjà en place pour Dolibarr/SYS sur 80/443) — **pas de nginx** (conflit de ports). `a2enmod proxy proxy_http` ; vhost `/etc/apache2/sites-available/provi.pichinov.fr.conf` (modèle versionné `deploy/apache/provi.pichinov.fr.conf`) : `ProxyPass http://127.0.0.1:3000`, `ProxyPreserveHost On`, `RequestHeader set X-Forwarded-Proto https`. AppArmor laisse passer le proxy (pas de règle réseau bloquante sur le profil Apache).
- **Runtime** : `next start` géré par **PM2** sous l'utilisateur Unix `deploy` (non-sudoer), dans `/var/www/saas-provisionning`, écoute uniquement sur `127.0.0.1:3000` (`ecosystem.config.js`, `--hostname 127.0.0.1`). `NODE_OPTIONS=--dns-result-order=ipv4first` (garde-fou IPv6, Annexe C). `pm2 startup systemd -u deploy` + `pm2 save` → survie crash **et** reboot.
- **Secrets prod** : `/var/www/saas-provisionning/.env.local` (valeurs §4.2), git-ignoré, **jamais écrasé** par un déploiement.
- **CI/CD** : `.github/workflows/deploy.yml` — sur push `main` : job **build-test** (lint + tests + build sur Ubuntu) PUIS job **deploy** en SSH (user `deploy`, action `appleboy/ssh-action`) qui lance `deploy/deploy.sh` (`git reset --hard origin/main` → `npm install` → `npm run build` → `pm2 reload`). Secrets repo : `VPS_HOST`, `VPS_USER`, `VPS_PORT`, `VPS_SSH_KEY`.
- **Piège lockfile** : on utilise `npm install` (PAS `npm ci`) partout — le `package-lock.json` généré sous Windows n'embarque pas les dépendances optionnelles Linux (`@emnapi/*`) → `npm ci` échoue en CI comme sur le VPS.
- **Reste à faire** : valider un cycle complet push→prod ; audit WAVE / Lighthouse sur l'URL prod ; (option) appeler l'API Dolibarr en `127.0.0.1` pour ne pas exposer la clé.

---

## 📎 Annexe A — Runbook : créer un package métier (reproductible)

> Les **dumps** ont été produits sur le mutualisé puis **copiés sur le VPS** (Phase 3.8). Cette annexe documente
> leur fabrication (réutilisable pour un nouveau métier). Sur le VPS, un package se **clone** ensuite via l'UI.

### A. Image de code + Kaleido
```bash
cd ~/kaleido/dolibarr/documents/sellyoursaas/git
mkdir -p dolibarr_24.0/htdocs
cp -r ~/kaleido/dolibarr/htdocs/.  dolibarr_24.0/htdocs/      # branche GitHub 24.0 inexistante → on copie le code
cp -r ~/kaleido/dolibarr/scripts   dolibarr_24.0/
rm -f  dolibarr_24.0/htdocs/conf/conf.php                    # ne pas embarquer la conf du Master
rm -rf dolibarr_24.0/htdocs/custom/sellyoursaas              # une instance n'est pas un Master
ls dolibarr_24.0/htdocs/custom/kaleido/core/modules/modKaleido.class.php   # Kaleido présent
```

### B. Install de référence (pour produire le dump)
1. **Base MySQL** OVH : hôte = **`<base>.mysql.db`** (jamais `localhost`).
2. Copier `dolibarr_24.0` → `~/kaleido/reference` + sous-domaine **Multisite** `ref.pichinov.fr` → `kaleido/reference/htdocs` (SSL).
3. Installeur `https://ref.pichinov.fr` : `mysqli`, `<base>.mysql.db`, port 3306, **DÉCOCHER** « Créer la base/l'utilisateur », admin `admin`/`adminadmin` (≥ 8 car). `touch …/reference/documents/install.lock`.
4. Configuration → Modules → activer **Kaleido** + les modules du métier (SPEC §1.3).

### C. Dump « usine »
```bash
# admin remis en état "défaut" attendu par le package (sinon le reset mdp par instance ne s'applique pas) :
mysql -h <base>.mysql.db -u <user> -p <base> -e \
  "UPDATE llx_user SET pass='admin', pass_crypted='25edccd81ce2def41eae1317392fd106d8152a5b' WHERE login='admin';"
mysqldump --no-tablespaces --single-transaction -h <base>.mysql.db -u <user> -p <base> > ~/<metier>.sql
mkdir -p ~/kaleido/dolibarr/documents/sellyoursaas/packages/<Ref> && mv ~/<metier>.sql $_
```
> ⚠️ **Collation** : le MySQL 8 du mutualisé écrit `utf8mb4_0900_ai_ci`, **inconnue de MariaDB**. Avant import sur
> le VPS : `sed -i -E 's/utf8mb4_0900_[a-z_]+/utf8mb4_unicode_ci/g' <metier>.sql` (cf. Annexe C).
> ⚠️ Après ce SQL, le login `ref.pichinov.fr` est cassé (pass_crypted = marker). Le restaurer si besoin :
> `php -r "echo password_hash('adminadmin', PASSWORD_DEFAULT);"` puis `UPDATE llx_user SET pass_crypted='<hash>', pass=NULL WHERE login='admin';`.

### D. Remplir le package (UI : SellYourSaas → Packages)
3 *Dir with sources* → l'image ; *Template of config file 1* = `conf.php` complet (db_host **`127.0.0.1`**) ;
*Dir with dump files* = `__DOL_DATA_ROOT__/sellyoursaas/packages/__PACKAGEREF__` ; *Template of cron file* ;
*Shell after deployment* ; *Sql after deployment* (grand bloc, **IP du VPS** dans `MAIN_EXTERNAL_SMTP_CLIENT_IP_ADDRESS`) ;
*Sql to reset password* ; **État = Active**. *(Nouveau métier : **cloner** un package, changer la Réf + le dump.)*

---

## 📎 Annexe B — Guideline : le questionnaire → le provisioning

### A. Correspondance métier → Service → Package
| Slug front (`?job=`) | Service / Package | Modules du dump |
|---|---|---|
| `fleuriste` | **Fleuriste** | Produits · Stocks · TakePOS · Factures · Kaleido |
| `freelance` | **Freelance** | Tiers · Propositions · Factures · Projets · Kaleido |
| `garagiste` | **Garagiste** | Produits · Propositions · Stocks · Factures · Kaleido |
| `artisan` | **ArtisanBTP** | Produits · Propositions · Interventions (FICHEINTER) · Projets · Factures · Kaleido |

⚠️ Slug front **`artisan`** → service **`ArtisanBTP`** (mapping `serviceForJob`).

### B. Données du questionnaire → instance
- `companyName` → slug → **sous-domaine** → `https://<slug>.with1.pichinov.fr`
- `job` → **Service** (table A) → modules/config de la Dolibarr déployée
- `email` → admin de l'instance ; `password` → mdp admin (**Option B : en clair sur TLS**, jamais journalisé/persisté)
- `country=FR` et `phone=""` sont posés par défaut côté app (pas demandés au questionnaire).

### C. Flux RÉEL (`register.php` → `register_instance.php`)
Pas d'endpoint REST de déploiement. La logique est dans **`myaccount/register_instance.php`** : crée tiers +
contrat (`ref_customer = <sous-domaine>.<tld>`) + extrafields (`options_deployment_*`, dont
`options_deployment_init_adminpass` = **mdp admin en clair**) + creds Unix/DB générés, puis **déclenche
`sellyoursaasRemoteAction('deployall')`** (synchrone ~5 min) → `options_deployment_status='done'`.

### D. Implémentation app (`liveCreateInstance`)
1. **GET `register.php?plan=<ref>`** → **cookie de session** (`getSetCookie`) + **jeton CSRF** (champ caché `token`). Sans token → **HTTP 403** « Token not provided ».
2. **POST `register_instance.php`** : `token` + `username` (email) + `orgName` + `phone` + `password`/`password2` (clair) + `country=FR` + `sldAndSubdomain` + `tldid=.with1.pichinov.fr` + `plan=<ref>` + `origin` + `partner=0` + `tz_string=Europe/Paris` ; en-têtes `Cookie` + `Referer`.
3. **Synchrone** → on attend **≤12 s** (Promise.race) : réponse rapide qui **redirige vers register.php** = rejet → on suit la redirection pour lire le message et **lever une erreur** (ex. *« An account already exists for this email »*) ; sinon = déploiement lancé → **fire-and-forget** + on rend la réf.
4. **Suivi** : `liveGetInstanceStatus` lit `options_deployment_status` (`processing`→`done`). **Unicité** : contrats par `ref_customer`.

### E. Décision mot de passe = **Option B**
Le client choisit son mdp ; transite en clair sur TLS (jamais journalisé/persisté) car SYS le pose tel quel sur
l'admin de l'instance. Hash SHA-256 navigateur **retiré** ; validation = politique (`isPasswordAcceptable`).

---

## 📎 Annexe C — Pièges rencontrés (et leurs correctifs)

### Install VPS / système
- **php-fpm timeout au démarrage** → on **désactive** php-fpm (SYS = MPM-ITK + mod_php).
- **`secureBash` manquant** (`useradd: missing shell '/bin/secureBash'` → déploiement « Could not authenticate with username osu… », OK seulement au redéploiement) → `cp /bin/dash /bin/secureBash; cp /usr/bin/dash /usr/bin/secureBash; chmod 755 /usr/bin/secureBash`.

### Déploiement
- **« signature does not match … signature_key … /etc/sellyoursaas.conf »** → la clé de la fiche serveur (colonne `serversignaturekey`) doit être **identique** à `signature_key=` dans `/etc/sellyoursaas.conf`, puis `systemctl restart remote_server_launcher`.
- **Vhost d'instance : `SSLCertificateFile … with.sellyoursaas.com.crt does not exist`** → symlinks `/etc/apache2/with.sellyoursaas.com.{crt,key,-intermediate.crt}` → cert Let's Encrypt wildcard.
- **Import dump : `ERROR 1273 Unknown collation 'utf8mb4_0900_ai_ci'`** (dump MySQL 8 sur MariaDB) → `sed -i -E 's/utf8mb4_0900_[a-z_]+/utf8mb4_unicode_ci/g'` sur les dumps.
- **« Failed to connect … <instance>.with1…/dbn… » après l'import** (le Master joint la base de l'instance via son FQDN pour le SQL-after-deploy, mais MariaDB n'écoutait qu'en `127.0.0.1`) → `bind-address=0.0.0.0` + user `sellyoursaas`@`'%'` + `ufw allow from 51.178.29.164 to any port 3306`.

### Portail myaccount
- **« Include of main fails »** → `ln -s …/dolibarr/htdocs/main.inc.php …/dolibarr_sellyoursaas/myaccount/main.inc.php`.
- **Assets 404 sous `/source/…`** (jQuery/jstz ne chargent pas → `tz_string` vide → `ErrorBadValueProperty`) → `Alias /source /home/admin/wwwroot/dolibarr/htdocs` dans le vhost myaccount.
- **URL d'inscription en 404 / `…/custom/sellyoursaas/myaccount.with1.pichinov.fr/register.php`** → mettre l'**URL compte client avec `https://`** dans le setup ; récupérer le lien via **Subscription Pages**.
- **« Service/Plan was not found »** → service sans **durée par défaut** ; et utiliser l'URL de Subscription Pages (param `plan`).

### Branchement app (POST programmatique vers `register_instance.php`)
- **403 « Token not provided »** → faire un **GET `register.php`** d'abord pour récupérer le **cookie de session + le `token`**, puis POSTer avec.
- **`Cookie`/`Referer` via fetch** : undici (Node) **les envoie** (contrairement au navigateur) → pas besoin de client bas niveau.
- **« An account already exists for this email »** = règle métier SYS (1 compte/email) → utiliser un email neuf, ou passer par le dashboard client.
- **Suivi « Déploiement introuvable » prématuré** → tolérer plusieurs **404 transitoires** (contrat créé en asynchrone).
- **`register_instance.php` synchrone (~5 min)** → ne pas l'`await` complètement : Promise.race ≤12 s, puis fire-and-forget + polling.
- **`fetch failed` / `ConnectTimeoutError` vers le Master en DEV (IPv6)** : `with1.pichinov.fr` a un `AAAA` (IPv6 du VPS, **fonctionnelle** : route + sortie + Apache dual-stack + ufw IPv6). Mais une machine de dev dont l'**IPv6 FAI est cassée** tente l'IPv6 et timeout 10 s (Node/undici ne fait pas toujours le repli Happy-Eyeballs). **Fix dev** : `NODE_OPTIONS=--dns-result-order=ipv4first` avant `npm run dev`. **En prod : aucun souci** — l'app est co-localisée et appelle le Master en `127.0.0.1` (cf. DEPLOY.md). → On **garde l'`AAAA`**.
- **Faux rejet d'inscription** (l'instance EST créée mais l'app affichait « refusée par le portail ») : `register_instance.php` peut **répondre vite avec une redirection SANS bloc d'erreur** quand la création réussit. Correctif `liveCreateInstance` : ne **plus** traiter toute redirection rapide comme un rejet → ne lever une erreur que si un **vrai message** est extrait (`<div class="error">` ou code `ErrorXxx`) ; sinon considérer la création lancée et laisser le **polling** trancher (un vrai échec finit en 404 → « introuvable » après tolérance).

### Déploiement du front Next.js (Phase 6 — CI/CD GitHub → VPS)
- **`npm ci` échoue : « can only install when package.json and package-lock.json are in sync » + paquets `@emnapi/*` manquants/invalides.** Le `package-lock.json` est généré sous **Windows** et n'embarque pas les dépendances **optionnelles propres à Linux** (repli WASM `@emnapi/*`). `npm ci`, strict, refuse — **en CI (runner Ubuntu) comme sur le VPS**. → On utilise **`npm install --no-audit --no-fund`** partout (`deploy/deploy.sh` ET `.github/workflows/deploy.yml`), qui réconcilie le lock pour la plateforme courante.
- **Build en déploiement : `EACCES: permission denied, unlink '/var/www/saas-provisionning/.next/build/...'`.** Des fichiers de `.next/` appartiennent à **`root`** (un `npm run build` a été lancé en root à un moment), or le déploiement tourne en **`deploy`** → il ne peut pas réécrire ces fichiers. → **Correctif** : en root, `chown -R deploy:deploy /var/www/saas-provisionning` (massue si ça persiste : `rm -rf /var/www/saas-provisionning/.next` puis le `chown`). **Prévention** : ne JAMAIS builder/`npm` en root dans ce dossier — uniquement en `deploy` (le déploiement auto le fait déjà).
- **Conflit de ports nginx ↔ Apache.** Le VPS sert déjà Dolibarr/SYS via **Apache** sur 80/443 ; installer **nginx** comme reverse proxy entre en conflit (impossible de partager les ports). → On réutilise **Apache** comme reverse proxy (`a2enmod proxy proxy_http` + vhost `provi.pichinov.fr.conf` → `ProxyPass http://127.0.0.1:3000`), nginx désactivé. Le certificat de `provi.pichinov.fr` est **dédié** (`certbot certonly --dns-ovh`) car le wildcard `*.with1.pichinov.fr` ne couvre pas `provi`.
- **Warning « Node.js 20 deprecated » en CI** (actions forcées sur Node 24) → passer `actions/checkout` et `actions/setup-node` en **`@v5`** (le `node-version: "20"` du build, lui, reste — c'est la version Node de l'app, pas celle des actions).
