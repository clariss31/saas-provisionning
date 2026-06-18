/**
 * Configuration PM2 — gestionnaire de processus du serveur Next.js en production.
 *
 * PM2 garde l'application vivante (redémarrage automatique en cas de crash), la
 * relance au reboot du VPS (via `pm2 startup` + `pm2 save`) et permet un
 * rechargement lors des déploiements (`pm2 reload`).
 *
 * Démarrage initial : `pm2 start ecosystem.config.js` puis `pm2 save`.
 *
 * IMPORTANT — les secrets (clés API Dolibarr/MailJet, URLs internes) ne sont
 * PAS définis ici : ils vivent dans le fichier `.env.local` du serveur (ignoré
 * par git) et sont chargés automatiquement par Next au runtime. Ce fichier-ci
 * ne contient donc aucune donnée sensible et peut être committé sans risque.
 */
module.exports = {
  apps: [
    {
      name: "saas-provisionning",
      // On invoque directement le binaire Next plutôt que `npm start` : la
      // transmission des signaux d'arrêt (SIGINT/SIGTERM) est plus fiable, ce
      // qui garantit un arrêt propre du serveur lors des rechargements.
      script: "node_modules/next/dist/bin/next",
      // `--hostname 127.0.0.1` : le serveur n'écoute QUE en local. Il n'est
      // donc jamais joignable directement depuis Internet sur le port 3000 ;
      // seul Nginx (reverse proxy) lui parle. Renforce la sécurité.
      args: "start --hostname 127.0.0.1 --port 3000",
      // Répertoire de l'application sur le VPS — à adapter si vous l'installez
      // ailleurs (doit correspondre à APP_DIR dans deploy/deploy.sh).
      cwd: "/var/www/saas-provisionning",
      // Mode « fork » : une seule instance, suffisant pour ce front léger.
      // Passer en « cluster » seulement si la charge réelle l'exige.
      exec_mode: "fork",
      instances: 1,
      // Garde-fou : redémarre l'app si elle dépasse ce seuil mémoire (utile sur
      // un VPS partagé avec Dolibarr et MySQL).
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
