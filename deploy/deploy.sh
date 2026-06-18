#!/usr/bin/env bash
#
# Script de déploiement exécuté SUR LE VPS par le workflow GitHub Actions
# (.github/workflows/deploy.yml). Il met le code à jour, réinstalle les
# dépendances, reconstruit l'application puis recharge le serveur via PM2.
#
# `set -euo pipefail` : on stoppe à la première erreur. Conséquence voulue : si
# le build échoue, le `pm2 reload` n'est jamais atteint et l'ANCIENNE version
# reste en ligne — pas de coupure de service sur un déploiement cassé.

set -euo pipefail

# Répertoire de l'application sur le serveur (surchargeable via la variable
# d'environnement APP_DIR). Doit correspondre au `cwd` de ecosystem.config.js.
APP_DIR="${APP_DIR:-/var/www/saas-provisionning}"

cd "$APP_DIR"

echo "→ Récupération de la dernière version (origin/main)…"
git fetch --prune origin
# reset --hard : on aligne strictement le serveur sur la branche distante.
# `.env.local` (ignoré par git) n'est pas touché : les secrets sont préservés.
git reset --hard origin/main

echo "→ Installation des dépendances (devDependencies incluses, requises au build)…"
npm ci --include=dev

echo "→ Build de production…"
npm run build

echo "→ Rechargement du serveur via PM2…"
# startOrReload : démarre l'app si elle n'existe pas encore dans PM2, la
# recharge sinon. Idempotent, donc robuste y compris au tout premier passage.
pm2 startOrReload ecosystem.config.js --update-env
# Persiste la liste des processus pour qu'ils redémarrent au reboot du VPS.
pm2 save

echo "✓ Déploiement terminé."
