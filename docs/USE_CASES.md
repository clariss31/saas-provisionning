# Diagrammes de cas d'usage

> Documentation fonctionnelle — Plateforme de Provisioning SaaS pour Dolibarr (déclinaisons métiers)
> Agence Pichinov

Ce document décrit les acteurs et les cas d'usage de l'application. Les diagrammes sont écrits en [Mermaid](https://mermaid.js.org/) : ils se versionnent comme du texte et sont rendus nativement par GitHub, GitLab et la plupart des outils de documentation.

> **Note de notation.** Mermaid ne propose pas de diagramme de cas d'usage UML natif. On l'approxime avec des graphes orientés où les acteurs sont des nœuds rectangulaires `[Acteur]`, les cas d'usage des nœuds arrondis `(Cas d'usage)`, et les relations `«include»` / `«extend»` des flèches pointillées étiquetées.

---

## 1. Acteurs

| Acteur | Type | Rôle |
|--------|------|------|
| **Visiteur / Prospect** | Humain (non authentifié) | Découvre la vitrine, parcourt le catalogue et les tarifs. |
| **Professionnel** | Humain | Freelance, fleuriste, garagiste ou artisan qui souscrit et suit la création de son instance. |
| **Dolibarr Maître** | Système (API REST) | Fournit les modèles métiers (`GET`) et reçoit l'ordre d'instance (`POST`). |
| **Sell Your SaaS** | Système (module Dolibarr) | Clone l'instance, configure les modules, gère l'abonnement et la facturation. |

---

## 2. Vue d'ensemble du système

```mermaid
graph LR
    %% Acteurs
    PRO(["👤 Professionnel<br/>(& Visiteur)"])
    DOL(["⚙ Dolibarr Maître<br/>API REST"])
    SYS(["⚙ Sell Your SaaS<br/>Provisioning"])

    subgraph PLATEFORME["Plateforme de Provisioning SaaS"]
        UC1(["Consulter la vitrine<br/>& les fonctionnalités"])
        UC2(["Parcourir le catalogue métiers"])
        UC3(["Consulter la grille tarifaire"])
        UC4(["S'inscrire<br/>(tunnel d'onboarding)"])
        UC5(["Suivre le provisioning<br/>de l'instance"])
        UC6(["Accéder à mon espace métier"])
        UC7(["Contacter le support"])
    end

    PRO --- UC1
    PRO --- UC2
    PRO --- UC3
    PRO --- UC4
    PRO --- UC5
    PRO --- UC6
    PRO --- UC7

    UC2 --- DOL
    UC4 --- DOL
    UC5 --- SYS

    classDef actor fill:#6c63f0,stroke:#4f46c9,color:#ffffff;
    classDef system fill:#b0a8d4,stroke:#6c63f0,color:#2e2a45;
    classDef uc fill:#f8f4fb,stroke:#6c63f0,color:#2e2a45;
    class PRO actor;
    class DOL,SYS system;
    class UC1,UC2,UC3,UC4,UC5,UC6,UC7 uc;
```

---

## 3. Découverte & Sélection — *Pages 1 à 4 & 7*

```mermaid
graph LR
    VIS(["👤 Visiteur / Prospect"])
    DOL(["⚙ Dolibarr Maître<br/>GET modèles"])

    subgraph PUBLIC["Espace public / Vitrine"]
        L(["Consulter la landing page"])
        F(["Consulter les fonctionnalités"])
        C(["Parcourir le catalogue métiers"])
        T(["Consulter la grille tarifaire"])
        S(["Contacter le support"])
        CM(["Choisir un métier"])
        CE(["Choisir un engagement"])
    end

    VIS --- L
    VIS --- F
    VIS --- C
    VIS --- T
    VIS --- S

    C -. "«extend»" .-> CM
    T -. "«extend»" .-> CE
    C --- DOL

    classDef actor fill:#6c63f0,stroke:#4f46c9,color:#ffffff;
    classDef system fill:#b0a8d4,stroke:#6c63f0,color:#2e2a45;
    classDef uc fill:#f8f4fb,stroke:#6c63f0,color:#2e2a45;
    class VIS actor;
    class DOL system;
    class L,F,C,T,S,CM,CE uc;
```

- **Choisir un métier** — 4 templates : Freelance · Fleuriste · Garagiste · Artisan.
- **Choisir un engagement** — 3 offres : Mensuel · Annuel · À vie.
- Le catalogue est généré dynamiquement à partir d'un appel `GET` vers le Dolibarr Maître.

---

## 4. Tunnel d'inscription — *Page 5 (onboarding multi-étapes)*

```mermaid
graph LR
    PRO(["👤 Professionnel"])
    DOL(["⚙ Dolibarr Maître<br/>vérif. async"])

    subgraph TUNNEL["Tunnel de conversion"]
        BASE(["S'inscrire<br/>(stepper multi-étapes)"])
        E1(["Saisir l'identité entreprise"])
        E2(["Renseigner la fiscalité (TVA)"])
        E3(["Créer les identifiants admin"])
        E4(["Vérifier la dispo. du sous-domaine"])
    end

    PRO --- BASE
    BASE -. "«include»" .-> E1
    BASE -. "«include»" .-> E2
    BASE -. "«include»" .-> E3
    BASE -. "«include»" .-> E4
    E4 --- DOL

    classDef actor fill:#6c63f0,stroke:#4f46c9,color:#ffffff;
    classDef system fill:#b0a8d4,stroke:#6c63f0,color:#2e2a45;
    classDef uc fill:#f8f4fb,stroke:#6c63f0,color:#2e2a45;
    classDef base fill:#6c63f0,stroke:#4f46c9,color:#ffffff;
    class PRO actor;
    class DOL system;
    class E1,E2,E3,E4 uc;
    class BASE base;
```

**Interactions dynamiques :** validation à la volée (RegEx e-mail, jauge de force du mot de passe), vérification asynchrone du sous-domaine (indicateur vert/rouge), skeleton loaders entre les étapes.

---

## 5. Provisioning & Accès — *Page 6 (tableau de bord)*

```mermaid
graph LR
    PRO(["👤 Professionnel"])
    SYS(["⚙ Sell Your SaaS<br/>clone & config"])
    DOL(["⚙ Dolibarr Maître<br/>héberge l'instance"])

    subgraph ORCH["Orchestration de l'instance"]
        SUIVI(["Suivre l'avancement<br/>du provisioning"])
        ACCES(["Accéder à mon<br/>espace métier"])
        P1(["Créer la base de données"])
        P2(["Injecter le thème Kaleido"])
        P3(["Configurer les modules métiers"])
        P4(["Confirmer & activer l'accès"])
    end

    PRO --- SUIVI
    PRO --- ACCES
    SUIVI -. "«include»" .-> P1
    SUIVI -. "«include»" .-> P2
    SUIVI -. "«include»" .-> P3
    SUIVI -. "«include»" .-> P4

    P1 --- SYS
    P3 --- SYS
    P4 --- DOL

    classDef actor fill:#6c63f0,stroke:#4f46c9,color:#ffffff;
    classDef system fill:#b0a8d4,stroke:#6c63f0,color:#2e2a45;
    classDef uc fill:#f8f4fb,stroke:#6c63f0,color:#2e2a45;
    classDef base fill:#6c63f0,stroke:#4f46c9,color:#ffffff;
    class PRO actor;
    class SYS,DOL system;
    class P1,P2,P3,P4 uc;
    class SUIVI,ACCES base;
```

L'application interroge l'état d'avancement en arrière-plan (polling ou WebSocket). Les étapes passent de *En cours* à *Validé* (Création BDD → Injection du thème Kaleido → Configuration des modules métiers). À la confirmation finale, le bouton de chargement devient le CTA « Accéder à mon espace [Nom du Métier] ».

---

## 6. Récapitulatif des cas d'usage par acteur

### Visiteur / Prospect
- Consulter la vitrine & les fonctionnalités
- Parcourir le catalogue métiers
- Consulter la grille tarifaire
- Choisir un métier & un engagement
- Contacter le support

### Professionnel
- S'inscrire via le tunnel d'onboarding
- Vérifier la disponibilité du sous-domaine
- Suivre le provisioning de l'instance
- Accéder à son espace métier

### Dolibarr Maître *(système)*
- Fournir les modèles métiers (`GET`)
- Vérifier le sous-domaine (async)
- Recevoir l'ordre d'instance (`POST`)
- Héberger l'instance créée

### Sell Your SaaS *(système)*
- Cloner la base de données
- Injecter le thème Kaleido
- Configurer les modules métiers
- Gérer l'abonnement & la facturation

---

*4 acteurs · 7 pages · 18 cas d'usage couvrant la découverte, la conversion et le provisioning automatisé via Sell Your SaaS.*