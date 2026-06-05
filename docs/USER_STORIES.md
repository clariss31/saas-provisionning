# User Stories — Plateforme de Provisioning SaaS pour Dolibarr

**Projet :** Plateforme de souscription autonome à une instance Dolibarr clé
en main (déclinaisons métiers).
**Contexte :** Mission entreprise — Agence Pichinov.
**Périmètre :** 7 pages · 4 templates métiers · 3 engagements tarifaires ·
provisioning automatisé via *Sell Your SaaS*.

Pour la spécification fonctionnelle complète, voir [SPEC.md](SPEC.md).

---

## Épique 2 — Pages vitrines (Accueil & Fonctionnalités)

### US 2.1 — Consulter la proposition de valeur

- **En tant que :** visiteur / prospect non authentifié
- **Je veux :** comprendre rapidement l'offre depuis la page d'accueil
- **Afin de :** décider si la solution répond à mon besoin et accéder au
  catalogue

**GIVEN** j'arrive sur la page d'accueil (Landing Page)
**WHEN** la page se charge
**THEN** je vois la section Hero, la proposition de valeur (la puissance
de Dolibarr avec la simplicité d'Indy), des éléments de réassurance et un
appel à l'action vers le catalogue.

**Critères d'acceptation :**

- Le header global est présent (logo, navigation, lien Connexion) ainsi que
  le footer.
- Un CTA principal redirige vers le catalogue métiers.
- Les mentions de réassurance (Sécurité, RGPD) sont visibles.
- La page est pré-rendue côté serveur (SSR/SSG) afin de garantir un score
  Lighthouse optimal.

### US 2.2 — Découvrir les fonctionnalités transverses

- **En tant que :** visiteur / prospect
- **Je veux :** consulter le détail des fonctionnalités de la plateforme
- **Afin de :** évaluer les bénéfices concrets avant de souscrire

**GIVEN** je navigue vers la page Fonctionnalités
**WHEN** la page s'affiche
**THEN** je vois une grille présentant les fonctionnalités transverses
(générateur de factures conformes, pilotage de la trésorerie,
synchronisation automatique, design mobile-first).

**Critères d'acceptation :**

- Chaque fonctionnalité est illustrée via le composant `<Image/>` de
  Next.js.
- La présentation reprend fidèlement la charte Kaleido (couleurs,
  espacements, style moderne).
- La page est responsive et pensée mobile-first.
- Les contrastes et la structure sémantique respectent les normes WCAG.

---

## Épique 3 — Catalogue Métiers *(interface dynamique n°1)*

### US 3.1 — Parcourir le catalogue des métiers

- **En tant que :** visiteur / prospect
- **Je veux :** voir les déclinaisons métiers disponibles sous forme de
  cartes
- **Afin de :** choisir le profil correspondant à mon activité

**GIVEN** j'accède à la page Catalogue
**WHEN** la page se charge
**THEN** l'application exécute une requête `GET` vers l'API du Dolibarr
Maître et génère dynamiquement une carte par modèle métier disponible
(Freelance, Fleuriste, Garagiste, Artisan).

**Critères d'acceptation :**

- Les modèles métiers sont récupérés dynamiquement via l'API REST (aucune
  liste codée en dur).
- Chaque carte présente le métier, ses bénéfices et les modules Dolibarr
  activés d'office.
- Un état de chargement (skeleton loader) s'affiche pendant la récupération
  des données.
- En cas d'échec de l'API, un message d'erreur clair est présenté avec une
  possibilité de réessayer.

### US 3.2 — Sélectionner un métier et démarrer l'onboarding

- **En tant que :** visiteur / prospect
- **Je veux :** cliquer sur une carte métier
- **Afin de :** enregistrer mon choix et démarrer le questionnaire
  d'inscription

**GIVEN** le catalogue est affiché
**WHEN** je clique sur une carte métier
**THEN** le système enregistre l'identifiant du template choisi et me
dirige vers le tunnel d'inscription pré-paramétré.

**Critères d'acceptation :**

- L'identifiant du template sélectionné est conservé et transmis à l'étape
  suivante (ex : `?job=fleuriste`).
- Le métier choisi conditionne les modules Dolibarr qui seront activés lors
  du provisioning.
- La sélection démarre immédiatement le tunnel de conversion.

---

## Épique 4 — Tarifs

### US 4.1 — Consulter la grille tarifaire

- **En tant que :** visiteur / prospect
- **Je veux :** visualiser les prix et les engagements proposés
- **Afin de :** comparer les offres en toute transparence

**GIVEN** j'accède à la page Tarifs
**WHEN** la page s'affiche
**THEN** je vois la grille tarifaire unifiée avec les 3 engagements :
Mensuel (19 €/mois), Annuel (15 €/mois, soit 180 €) et À vie (499 € en un
versement).

**Critères d'acceptation :**

- Les trois offres sont présentées clairement avec leur prix et leurs
  conditions.
- Le sélecteur de prix porte les attributs ARIA nécessaires à
  l'accessibilité.
- Les contrastes de l'interface respectent les normes WCAG.

### US 4.2 — Basculer entre les engagements

- **En tant que :** visiteur / prospect
- **Je veux :** utiliser un bouton de bascule (toggle) pour changer
  l'engagement affiché
- **Afin de :** voir instantanément le tarif correspondant à chaque durée

**GIVEN** je suis sur la page Tarifs
**WHEN** je clique sur le toggle (mensuel / annuel / à vie)
**THEN** les prix affichés se mettent à jour immédiatement, sans
rechargement de la page.

**Critères d'acceptation :**

- Le changement d'état du toggle met à jour l'affichage des prix de façon
  réactive.
- **Un test unitaire (Jest + React Testing Library) valide le changement
  d'état du bouton Toggle.**
- Le toggle est utilisable au clavier et son état est annoncé aux lecteurs
  d'écran (ARIA).

### US 4.3 — Choisir une offre

- **En tant que :** visiteur / prospect
- **Je veux :** sélectionner une offre tarifaire
- **Afin de :** pré-paramétrer mon inscription avec le bon engagement

**GIVEN** une offre est affichée
**WHEN** je clique sur le bouton de souscription d'une offre
**THEN** le choix d'engagement est transmis via l'URL vers le tunnel
(ex : `/onboarding?billing=annual&job=fleuriste`).

**Critères d'acceptation :**

- Le paramètre d'engagement et le métier sélectionné sont passés à la page
  d'onboarding.
- L'étape d'inscription est pré-paramétrée en conséquence.

---

## Épique 5 — Tunnel d'inscription / Onboarding *(interface dynamique n°2)*

### US 5.1 — Renseigner l'identité de l'entreprise

- **En tant que :** professionnel en cours d'inscription
- **Je veux :** saisir ma raison sociale et le nom du gérant
- **Afin de :** initialiser la configuration de mon instance et son
  sous-domaine

**GIVEN** je suis à la première étape du stepper
**WHEN** je saisis ma raison sociale
**THEN** le système en dérive automatiquement l'URL du sous-domaine
proposé pour mon instance.

**Critères d'acceptation :**

- La raison sociale génère automatiquement une proposition de sous-domaine.
- Les champs obligatoires sont validés avant de pouvoir avancer.
- La progression dans le stepper est clairement indiquée à l'utilisateur.

### US 5.2 — Vérifier la disponibilité du sous-domaine en temps réel

- **En tant que :** professionnel en cours d'inscription
- **Je veux :** savoir immédiatement si le sous-domaine choisi est
  disponible
- **Afin de :** choisir un nom valide sans interrompre ma saisie

**GIVEN** je saisis ou modifie ma raison sociale / mon sous-domaine
**WHEN** ma saisie se stabilise
**THEN** un appel API asynchrone interroge le Dolibarr Maître et affiche
un indicateur visuel (vert = disponible, rouge = indisponible) sans
bloquer l'interface.

**Critères d'acceptation :**

- La vérification est asynchrone et ne gèle jamais le formulaire.
- Un indicateur visuel clair (vert / rouge) reflète en direct la
  disponibilité.
- **Un test unitaire (Jest + React Testing Library) valide le comportement
  de la vérification de sous-domaine.**
- Un sous-domaine indisponible empêche la validation de l'étape.

### US 5.3 — Renseigner la situation fiscale

- **En tant que :** professionnel en cours d'inscription
- **Je veux :** répondre aux questions fiscales (ex : assujettissement à
  la TVA)
- **Afin de :** que mon instance Dolibarr soit configurée conformément à
  mon régime

**GIVEN** je suis à l'étape Fiscalité
**WHEN** je réponds aux questions ciblées
**THEN** mes réponses sont enregistrées pour paramétrer l'ERP final.

**Critères d'acceptation :**

- Les questions s'adaptent au contexte (assujetti à la TVA ou non).
- Les réponses conditionnent la configuration de l'instance.
- Les champs sont validés avant le passage à l'étape suivante.

### US 5.4 — Créer les identifiants administrateur

- **En tant que :** professionnel en cours d'inscription
- **Je veux :** définir l'email et le mot de passe de l'administrateur
- **Afin de :** sécuriser l'accès à ma future instance

**GIVEN** je suis à l'étape Identifiants
**WHEN** je saisis mon email et mon mot de passe
**THEN** le système valide le format de l'email (RegEx) et affiche une
jauge de force du mot de passe en temps réel.

**Critères d'acceptation :**

- L'email est validé à la volée via une expression régulière.
- Une jauge de force du mot de passe guide l'utilisateur pendant la saisie.
- Le mot de passe est hashé en amont : aucune donnée sensible n'est
  stockée en clair.
- L'étape ne peut être validée qu'avec des identifiants conformes.

### US 5.5 — Naviguer entre les étapes du formulaire

- **En tant que :** professionnel en cours d'inscription
- **Je veux :** avancer et revenir entre les étapes de manière fluide
- **Afin de :** compléter mon inscription sans frustration ni perte de
  données

**GIVEN** je suis dans le tunnel multi-étapes
**WHEN** je passe d'une étape à une autre
**THEN** un skeleton loader s'affiche pendant la transition et les données
déjà saisies sont conservées.

**Critères d'acceptation :**

- Des skeleton loaders sont affichés lors des transitions entre étapes.
- Les données saisies sont préservées lors d'un retour en arrière.
- L'ensemble du formulaire respecte les normes WCAG (attributs ARIA,
  navigation clavier).

### US 5.6 — Soumettre l'inscription et déclencher le provisioning

- **En tant que :** professionnel en cours d'inscription
- **Je veux :** valider mon inscription
- **Afin de :** lancer la création automatique de mon instance

**GIVEN** toutes les étapes sont complétées et valides
**WHEN** je confirme l'inscription à la fin de l'étape finale
**THEN** l'application émet une requête `POST` contenant l'objet d'instance
complet, ce qui déclenche le clonage via Sell Your SaaS et me redirige
vers le tableau de bord de provisioning.

**Critères d'acceptation :**

- Le `POST` contient l'ensemble des données collectées (métier, engagement,
  identité, fiscalité, identifiants hashés).
- L'envoi déclenche le processus automatisé de Sell Your SaaS.
- En cas d'échec, un message d'erreur explicite est affiché et les données
  saisies ne sont pas perdues.
- Aucune donnée sensible n'est transmise en clair dans l'URL.

---

## Épique 6 — Tableau de bord de provisioning *(interface dynamique n°3)*

### US 6.1 — Suivre l'avancement du provisioning

- **En tant que :** professionnel venant de s'inscrire
- **Je veux :** voir en temps réel l'état de création de mon instance
- **Afin de :** être rassuré et informé pendant la phase d'attente

**GIVEN** mon inscription a été soumise
**WHEN** le script Sell Your SaaS s'exécute en arrière-plan
**THEN** l'application interroge l'état d'avancement (polling ou
WebSocket) et met à jour le DOM ; chaque étape passe de « En cours » à
« Validé » (Création BDD → Injection du thème Kaleido → Configuration des
modules métiers).

**Critères d'acceptation :**

- L'avancement est mis à jour de façon asynchrone, sans rechargement de
  page.
- Chaque étape affiche visuellement son statut (en cours / validé).
- En cas d'erreur de provisioning, l'utilisateur en est informé clairement.

### US 6.2 — Accéder à mon espace métier

- **En tant que :** professionnel dont l'instance est prête
- **Je veux :** accéder à mon instance Dolibarr fraîchement créée
- **Afin de :** commencer à utiliser mon ERP pré-configuré

**GIVEN** le provisioning est terminé avec succès
**WHEN** l'API confirme la fin de la création de l'instance
**THEN** le bouton de chargement se transforme en un CTA principal
sécurisé « Accéder à mon espace [Nom du Métier] ».

**Critères d'acceptation :**

- Le CTA n'apparaît qu'après la confirmation finale de l'API.
- Le lien dirige vers l'instance nouvellement provisionnée.
- L'accès se fait de manière sécurisée.

---

## Épique 7 — Contact & Support

### US 7.1 — Contacter le support

- **En tant que :** prospect ou utilisateur rencontrant une difficulté
- **Je veux :** envoyer un message via le formulaire de contact
- **Afin de :** obtenir de l'aide ou des informations sur la plateforme

**GIVEN** je suis sur la page Contact
**WHEN** je remplis le formulaire et je le soumets
**THEN** le système valide les champs côté client et transmet ma demande.

**Critères d'acceptation :**

- La validation des champs est effectuée côté client avant l'envoi.
- Les coordonnées de l'agence Pichinov sont affichées sur la page.
- Un message de confirmation s'affiche après l'envoi.
- Le formulaire est accessible (labels, attributs ARIA, contrastes).

---

## Exigences transverses (non fonctionnelles)

Ces exigences s'appliquent à l'ensemble des user stories ci-dessus.

- **Accessibilité (WCAG) :** attributs ARIA sur le sélecteur de prix et le
  formulaire d'onboarding, contrastes validés sur toute l'interface.
- **RGPD & sécurité :** aucune donnée hautement sensible enregistrée sans
  cryptage ; mots de passe hashés en amont.
- **Performance & SEO :** composant `<Image/>` de Next.js pour les
  illustrations ; pages vitrines (Accueil, Tarifs, Fonctionnalités)
  pré-rendues (SSR/SSG) ; `sitemap.xml` dynamique listant les routes
  accessibles.
- **Identité visuelle :** respect de la charte Kaleido (variables de
  couleurs, espacements, style moderne — voir [DESIGN.md](../DESIGN.md)).
- **Tests unitaires obligatoires :** au minimum le toggle de la page Tarifs
  (US 4.2) et la vérification de sous-domaine de l'onboarding (US 5.2).
