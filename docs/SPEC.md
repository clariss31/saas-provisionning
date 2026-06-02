# Spécifications fonctionnelles

**Projet :** Plateforme de Provisioning SaaS pour Dolibarr (déclinaisons métiers)
**Contexte :** Mission en entreprise (Option A) — Agence Pichinov

---

## 1. Périmètre et objectifs du projet

### 1.1. Description générale

L'application est une plateforme web moderne permettant à des professionnels
indépendants ou des TPE (freelances, fleuristes, garagistes, artisans) de
souscrire de manière totalement autonome à une instance Dolibarr clé en main,
épurée et pré-configurée pour leur secteur d'activité.

L'application orchestre :

- Le catalogue dynamique des offres par métier.
- La grille tarifaire multi-engagements.
- Le tunnel de conversion (onboarding utilisateur) avec collecte de données
  fiscales.
- L'ordre de création automatisé (provisioning) de l'instance via le
  Dolibarr Maître.
- La gestion de l'abonnement et de la facturation mensuelle via le module
  Sell Your SaaS.

### 1.2. Contraintes d'hébergement et d'intégration

- **Hébergement :** l'application Next.js compilée sera hébergée directement
  sur le serveur Dolibarr en exploitant le module natif "Site Web" de
  l'infrastructure de l'agence.
- **Identité visuelle (UX/UI) :** l'interface doit reprendre fidèlement la
  charte graphique, les variables de couleurs, les espacements et le style
  moderne du module Kaleido (conçu par Progi16 en collaboration avec
  Pichinov). L'objectif est de masquer la complexité classique de Dolibarr
  pour offrir une expérience fluide inspirée des standards du marché comme
  Indy ou Henrri. Voir [DESIGN.md](../DESIGN.md).

### 1.3. Déclinaisons métiers (templates)

Le provisioning s'appuie sur 4 profils types pré-configurés en base de
données. L'application Next.js transmet l'identifiant du template choisi
pour activer uniquement les modules Dolibarr nécessaires.

#### Freelance / Consultant (prestataire de services)

- **Besoins :** aucun besoin de stockage ni de caisse de vente physique.
- **Modules Dolibarr activés d'office :** Tiers (Clients), Propositions
  commerciales (Devis), Factures (Services), Projets (Suivi du temps).

#### Fleuriste (commerce de proximité avec magasin)

- **Besoins :** vente physique au comptoir, gestion de produits périssables
  et suivi de l'inventaire.
- **Modules Dolibarr activés d'office :** Produits (Prix achat/vente), Stocks
  (Incrémentation/Décrémentation), Point de Vente (TakePOS), Factures.

#### Garagiste / Mécanicien (métier technique hybride)

- **Besoins :** facturation combinée de main-d'œuvre (services) et de pièces
  de rechange (produits) sur un même document.
- **Modules Dolibarr activés d'office :** Produits & Services, Propositions
  commerciales (Devis auto obligatoire), Stocks (Pièces de rechange),
  Factures.

#### Créateur / Artisan (petite entreprise de fabrication et vente)

- **Besoins :** suivi de la transformation de matières premières en produits
  finis et vente multi-canaux (boutique, salons).
- **Modules Dolibarr activés d'office :** Produits & Stocks, BOM
  (Nomenclature / Composition des produits), Factures.

### 1.4. Grille tarifaire unifiée

Mensuel/Annuel
Starter : 10 € / mois
Professionnel : 50 € / mois
Premium : 100 € / mois

## 2. Architecture de l'application & parcours utilisateur

### 2.1. Descriptif détaillé des 7 pages

#### Page 1 — Accueil (Landing Page)

- **Description :** page vitrine principale présentant la proposition de
  valeur de la plateforme (la puissance de Dolibarr avec la simplicité
  d'Indy).
- **Éléments clés :** header global (logo, navigation, connexion), section
  Hero avec bouton d'action (CTA) vers le catalogue, réassurance textuelle
  (Sécurité, RGPD) et footer.

#### Page 2 — Fonctionnalités

- **Description :** page de démonstration technique détaillant les avantages
  de l'interface modernisée style Kaleido.
- **Éléments clés :** grille de présentation des fonctionnalités transverses
  (générateur de factures conformes, pilotage de la trésorerie,
  synchronisation automatique, design mobile-first).

#### Page 3 — Catalogue Métiers *(interface dynamique principale n°1)*

- **Description :** présentation sous forme de cartes des 4 déclinaisons
  sectorielles disponibles pour l'onboarding.
- **Action :** le clic sur un métier enregistre le choix et démarre le
  questionnaire.

#### Page 4 — Tarifs

- **Description :** affichage transparent de la grille tarifaire unifiée.
- **Action :** le clic sur une offre transmet le choix d'engagement à l'URL
  (ex : `/onboarding?billing=annual&job=fleuriste`) pour pré-paramétrer
  l'étape suivante.

#### Page 5 — Tunnel d'inscription *(interface dynamique principale n°2)*

- **Description :** formulaire de capture multi-étapes (stepper) conçu pour
  collecter les informations indispensables à la configuration de l'ERP
  final.
- **Déroulement des étapes :**
  1. **Identité entreprise :** raison sociale (générant l'URL de
     sous-domaine de l'instance) et nom du gérant.
  2. **Fiscalité :** questions cibles (ex : « Êtes-vous assujetti à la
     TVA ? »).
  3. **Identifiants :** saisie de l'email et du mot de passe de
     l'administrateur.
- **Interactions dynamiques :**
  - Validation des champs de formulaire à la volée (RegEx email, jauge de
    force du mot de passe).
  - **Vérification de disponibilité asynchrone :** lors de la saisie de la
    raison sociale, un appel API vérifie en direct la disponibilité du
    sous-domaine sur le Dolibarr Maître, affichant un indicateur visuel
    (vert/rouge) sans bloquer l'interface.
  - Utilisation de skeleton loaders pendant le passage entre les étapes du
    formulaire.

#### Page 6 — Tableau de bord de provisioning *(interface dynamique principale n°3)*

- **Description :** page de transition post-onboarding affichant l'état
  d'avancement de la création technique de l'instance client.
- **Interactions dynamiques :**
  - Mise à jour asynchrone du DOM : l'application interroge en arrière-plan
    (polling ou WebSocket) l'état d'avancement du script Sell Your SaaS.
  - Les étapes passent visuellement de « En cours » à « Validé » au fur et
    à mesure (Création BDD → Injection du thème Kaleido → Configuration
    des modules métiers).
  - À la confirmation finale de l'API, le DOM modifie son bouton de
    chargement en un CTA principal sécurisé : « Accéder à mon espace
    [Nom du Métier] ».

#### Page 7 — Contact

- **Description :** page standard de support et de mise en relation pour les
  prospects ou utilisateurs rencontrant des difficultés lors du
  provisioning.
- **Éléments clés :** formulaire de contact avec validation côté client et
  coordonnées de l'agence Pichinov.

---

## 3. Spécifications techniques et modèle de données

### 3.1. Architecture de données & API

L'application Next.js est découplée mais communique de façon sécurisée avec
l'API REST du Dolibarr Maître.

- **Mécanique d'API (lecture) :** au chargement de la page Catalogue,
  Next.js exécute une requête `GET` pour récupérer les modèles métiers
  disponibles afin de générer dynamiquement l'interface.
- **Mécanique d'API (écriture) :** à la fin de la page 5, l'application
  émet un `POST` contenant l'objet d'instance complet. Ce signal déclenche
  le processus automatisé de clonage de Sell Your SaaS.

### 3.2. Contraintes de conformité et de qualité

- **Accessibilité & RGPD :** respect strict des normes WCAG (attributs ARIA
  sur le sélecteur de prix et le formulaire d'onboarding, contrastes de
  l'interface validés). Aucune donnée hautement sensible n'est enregistrée
  en base sans cryptage (les mots de passe sont hashés en amont).
- **Performance & SEO :** exploitation du composant `<Image/>` de Next.js
  pour toutes les illustrations métiers. Les pages vitrines (Accueil,
  Tarifs, Fonctionnalités) seront pré-rendues côté serveur (SSR/SSG) pour
  garantir des scores Lighthouse optimaux. Un fichier `sitemap.xml`
  dynamique listera les routes accessibles.
- **Tests unitaires :** écriture obligatoire d'au moins deux tests unitaires
  avec Jest et React Testing Library :
  1. Changement d'état du bouton Toggle de la page Tarifs.
  2. Comportement de la vérification de sous-domaine dans le composant
     d'onboarding.
