# Mise en ligne — VPS Ubuntu + déploiement automatique GitHub

Met l'application **Next.js** en production sur le **même VPS que le Dolibarr
Maître** (`with1`, OVH), avec un **déploiement automatique à chaque push sur `main`**.

- Domaine du front : **`provi.pichinov.fr`**
- Dépôt **public** : `github.com/clariss31/saas-provisionning` → clone HTTPS, pas de clé de déploiement.
- Le VPS sert **déjà Dolibarr via Apache** (MPM-ITK) sur 80/443 → on réutilise **Apache
  comme reverse proxy** vers le serveur Next local (pas de nginx, qui entrerait en conflit de ports).

## Architecture

```
                      Internet (HTTPS)
                            │
                    ┌───────▼────────┐
                    │  Apache 2.4    │  (déjà en place pour Dolibarr/SYS)
                    │  :80 / :443    │  vhosts : with1 / myaccount / *.with1
                    └───────┬────────┘  + vhost provi.pichinov.fr (reverse proxy)
                            │ ProxyPass → http://127.0.0.1:3000
                    ┌───────▼────────┐
                    │  Next.js       │  `next start`, géré par PM2 (user deploy)
                    │  127.0.0.1:3000│  n'écoute qu'en local
                    └───────┬────────┘
                            │ API REST + register_instance.php
                    ┌───────▼────────┐
                    │  Dolibarr      │  Maître SellYourSaas (with1.pichinov.fr)
                    └────────────────┘
```

## Pré-requis

- Accès SSH **sudo** au VPS.
- **DNS** : enregistrement **A** `provi.pichinov.fr` → IP du VPS (`51.178.29.164`).
- Certbot + plugin **dns-ovh** déjà installés (credentials dans `/etc/letsencrypt/ovh.ini`).

---

## Étape 0 — Amener le code sur `main` (en local)

Le déploiement auto se déclenche sur `main` et le VPS clone/synchronise `main` :

```bash
git checkout main
git merge --ff-only instances
git push origin main
```

## Étape 1 — Node.js + PM2 (sur le VPS, en sudo)

> Apache, MariaDB, certbot sont déjà installés (stack SYS). On n'ajoute QUE Node + PM2.

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
node -v && pm2 -v
```

## Étape 2 — Utilisateur applicatif + répertoire

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo mkdir -p /var/www/saas-provisionning
sudo chown -R deploy:deploy /var/www/saas-provisionning
```

> Pour basculer sur ce compte sans mot de passe (il n'en a pas) : depuis root
> `su - deploy`, ou de partout `sudo su - deploy`.

## Étape 3 — Clone + secrets (en tant que `deploy`)

```bash
su - deploy
cd /var/www
git clone https://github.com/clariss31/saas-provisionning.git
cd saas-provisionning
```

Crée `.env.local` (ignoré par git). Valeurs de prod (cf. docs/PLAN.md §4.2) :

```ini
DOLIBARR_MODE=live
DOLIBARR_API_URL=https://with1.pichinov.fr/api/index.php
DOLIBARR_API_KEY=<DOLAPIKEY admin>
SELLYOURSAAS_REGISTER_URL=https://myaccount.with1.pichinov.fr/register_instance.php
SELLYOURSAAS_ACCOUNT_URL=https://myaccount.with1.pichinov.fr
INSTANCE_DOMAIN=with1.pichinov.fr
MJ_APIKEY_PUBLIC=<clé publique MailJet>
MJ_APIKEY_PRIVATE=<clé privée MailJet>
MAIL_FROM=contact@pichinov.com
```

## Étape 4 — Build + démarrage PM2 (en `deploy`)

```bash
npm install --no-audit --no-fund   # PAS npm ci : le lock (généré sous Windows) n'a pas les deps optionnelles Linux
npm run build
pm2 start ecosystem.config.js
pm2 save
curl -I http://127.0.0.1:3000      # doit renvoyer HTTP 200
```

Démarrage auto au reboot (en root) :

```bash
exit
pm2 startup systemd -u deploy --hp /home/deploy   # exécuter la commande sudo affichée
```

## Étape 5 — Reverse proxy Apache + HTTPS

En root. Modules proxy + certificat dédié (`provi` n'est pas couvert par le wildcard `*.with1`) :

```bash
a2enmod proxy proxy_http
certbot certonly --dns-ovh --dns-ovh-credentials /etc/letsencrypt/ovh.ini -d provi.pichinov.fr
```

Vhost (le modèle versionné est `deploy/apache/provi.pichinov.fr.conf`) :

```bash
sudo cp /var/www/saas-provisionning/deploy/apache/provi.pichinov.fr.conf /etc/apache2/sites-available/
sudo a2ensite provi.pichinov.fr
sudo apache2ctl configtest          # doit afficher "Syntax OK"
sudo systemctl reload apache2       # gracieux : ne coupe pas Dolibarr
curl -I https://provi.pichinov.fr   # HTTP/1.1 200 OK
```

> **503 ?** AppArmor (cf. docs/PLAN.md §5.6) peut bloquer la connexion sortante d'Apache
> vers `127.0.0.1:3000`. Ajouter `network inet stream,` + `network inet6 stream,` au profil
> `usr.sbin.apache2`, puis `apparmor_parser -r /etc/apparmor.d/usr.sbin.apache2 && systemctl reload apache2`.

## Étape 6 — Déploiement automatique GitHub

### 6.1 Clé SSH « GitHub Actions → VPS » (sur votre poste)

```bash
ssh-keygen -t ed25519 -C "github-actions" -f gh_actions_deploy -N ""
```

Ajouter la clé **publique** dans `/home/deploy/.ssh/authorized_keys` sur le VPS.

### 6.2 Secrets GitHub (Settings → Secrets and variables → Actions)

| Secret        | Valeur                                                        |
| ------------- | ------------------------------------------------------------- |
| `VPS_HOST`    | `51.178.29.164`                                               |
| `VPS_USER`    | `deploy`                                                      |
| `VPS_PORT`    | `22`                                                          |
| `VPS_SSH_KEY` | contenu **intégral** de la clé **privée** `gh_actions_deploy` |

### 6.3 Tester

Onglet **Actions → Déploiement production → Run workflow**, ou pousser sur `main`.
Le workflow lance [deploy/deploy.sh](deploy.sh) sur le VPS (git reset → `npm install`
→ build → `pm2 reload`). Ensuite, `git push origin main` met l'app à jour tout seul.

---

## Exploitation

```bash
sudo -u deploy pm2 status
sudo -u deploy pm2 logs saas-provisionning
```

Changer un secret : éditer `/var/www/saas-provisionning/.env.local` (jamais écrasé par
le déploiement) puis `sudo -u deploy pm2 restart saas-provisionning`.

## Dépannage

| Symptôme                      | Piste                                                        |
| ----------------------------- | ------------------------------------------------------------ |
| 502/503 sur provi             | App down (`pm2 status`/`pm2 logs`) ou AppArmor (cf. étape 5) |
| build « Killed »              | Manque de RAM → ajouter un swap                              |
| build-test rouge en CI        | Reproduire : `npm install && npm run lint && npm test && npm run build` |
| SSH refusé dans le workflow   | `VPS_SSH_KEY` (privée complète) + clé publique dans `authorized_keys` |
