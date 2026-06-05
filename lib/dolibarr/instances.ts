/**
 * Couche métier « instances » : l'unique point d'entrée pour créer et suivre
 * une instance Dolibarr depuis l'application.
 *
 * Toute dépendance au Dolibarr Maître / Sell Your SaaS passe par ici : le reste
 * de l'app (Route Handlers, UI) n'appelle QUE ces fonctions. On peut ainsi :
 *  - développer/tester en mode `mock` (simulation en mémoire) ;
 *  - basculer en `live` (vrais appels REST) sans toucher au front.
 *
 * ⚠️ Module **strictement serveur** (il importe le client porteur du DOLAPIKEY).
 */

import { DolibarrError, dolibarrFetch, getDolibarrMode } from "./client";

// ---------------------------------------------------------------------------
// Types publics
// ---------------------------------------------------------------------------

/** État de déploiement d'une instance, normalisé pour l'UI. */
export type InstanceState = "deploying" | "deployed" | "error";

/** Données minimales requises pour provisionner une instance (cf. PLAN §3). */
export type CreateInstanceInput = {
  /** Raison sociale saisie par le client. */
  companyName: string;
  /** Sous-domaine déjà slugifié et vérifié disponible. */
  subdomain: string;
  /** Nom complet du gérant (admin de l'instance). */
  managerName: string;
  /** E-mail de l'admin (login + contact). */
  email: string;
  /**
   * Mot de passe admin. Utilisé puis jeté côté serveur : ne JAMAIS le
   * journaliser ni le renvoyer au client.
   */
  password: string;
  /** Contexte commercial (non déterminant tant que l'instance est unique). */
  job?: string;
  billing?: string;
};

/** Référence d'une instance créée + son URL finale. */
export type CreateInstanceResult = {
  /** Référence du contrat (sert d'identifiant dans l'URL de suivi). */
  ref: string;
  subdomain: string;
  url: string;
};

/** Statut courant d'une instance interrogé pendant le provisioning. */
export type InstanceStatus = {
  ref: string;
  subdomain: string;
  url: string;
  state: InstanceState;
  /**
   * Indice d'étape franchie (0–4) pour animer le tableau de bord :
   * 1 = BDD, 2 = thème Kaleido, 3 = modules, 4 = accès actif.
   * Indicatif : le Maître ne fournit qu'un statut grossier (en cours / déployé),
   * cette granularité sert au confort visuel côté UI.
   */
  step: number;
};

/** Nombre total de sous-étapes affichées dans le tableau de bord. */
export const PROVISIONING_STEPS = 4;

/** Construit l'URL publique d'une instance à partir de son sous-domaine. */
export function instanceUrl(subdomain: string): string {
  const domain = process.env.INSTANCE_DOMAIN ?? "pichinov.fr";
  return `https://${subdomain}.${domain}`;
}

// ---------------------------------------------------------------------------
// Dispatch mock / live
// ---------------------------------------------------------------------------

/**
 * Indique si un sous-domaine est disponible sur le Maître.
 * @param subdomain Sous-domaine déjà slugifié (`[a-z0-9-]`).
 */
export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  return getDolibarrMode() === "mock"
    ? mockIsSubdomainAvailable(subdomain)
    : liveIsSubdomainAvailable(subdomain);
}

/** Crée le client + le contrat porteur de l'instance, déclenchant le clonage SYS. */
export async function createInstance(
  input: CreateInstanceInput,
): Promise<CreateInstanceResult> {
  return getDolibarrMode() === "mock"
    ? mockCreateInstance(input)
    : liveCreateInstance(input);
}

/**
 * Lit l'état d'avancement d'une instance.
 * @returns le statut, ou `null` si la référence est inconnue.
 */
export async function getInstanceStatus(
  ref: string,
): Promise<InstanceStatus | null> {
  return getDolibarrMode() === "mock"
    ? mockGetInstanceStatus(ref)
    : liveGetInstanceStatus(ref);
}

// ---------------------------------------------------------------------------
// Implémentation MOCK (simulation en mémoire — mode `mock`)
// ---------------------------------------------------------------------------

/** Sous-domaines réservés / déjà pris en simulation (démo du cas « indisponible »). */
const MOCK_TAKEN = new Set([
  "demo",
  "test",
  "kaleido",
  "admin",
  "www",
  "dolibarr",
  "pichinov",
]);

/**
 * Instances simulées créées pendant la session de dev (ref → métadonnées).
 * État volontairement en mémoire : il est réinitialisé à chaque redémarrage du
 * serveur, ce qui convient au développement.
 */
const mockInstances = new Map<
  string,
  { subdomain: string; createdAt: number }
>();

function mockIsSubdomainAvailable(subdomain: string): boolean {
  return !MOCK_TAKEN.has(subdomain);
}

function mockCreateInstance(input: CreateInstanceInput): CreateInstanceResult {
  // Réf lisible et unique : préfixe contrat + horodatage en base 36.
  const ref = `CT-${Date.now().toString(36).toUpperCase()}`;
  mockInstances.set(ref, { subdomain: input.subdomain, createdAt: Date.now() });
  // Le sous-domaine devient indisponible pour les vérifications suivantes.
  MOCK_TAKEN.add(input.subdomain);
  return {
    ref,
    subdomain: input.subdomain,
    url: instanceUrl(input.subdomain),
  };
}

function mockGetInstanceStatus(ref: string): InstanceStatus | null {
  const record = mockInstances.get(ref);
  if (!record) return null;

  // Progression simulée : une étape franchie toutes les 3 s (≈ 9 s au total),
  // pour donner à voir l'animation du tableau de bord en développement.
  const elapsedSeconds = (Date.now() - record.createdAt) / 1000;
  const step = Math.min(PROVISIONING_STEPS, Math.floor(elapsedSeconds / 3) + 1);
  const state: InstanceState =
    step >= PROVISIONING_STEPS ? "deployed" : "deploying";

  return {
    ref,
    subdomain: record.subdomain,
    url: instanceUrl(record.subdomain),
    state,
    step,
  };
}

// ---------------------------------------------------------------------------
// Implémentation LIVE (vrais appels REST — mode `live`)
// ---------------------------------------------------------------------------
//
// ⚠️ À CONFIRMER lors du branchement réel (Lot 7) : le schéma exact exposé par
// Sell Your SaaS (ressource d'instance dédiée ? champs du contrat portant le
// sous-domaine et les identifiants admin/DB ?). Les points à valider sont
// marqués `TODO(Lot 7)`. Tant que ce n'est pas confirmé, garder
// `DOLIBARR_MODE=mock`. Le sous-domaine est un slug `[a-z0-9-]` (cf. couche
// `lib/instances/subdomain.ts`) : son interpolation dans un `sqlfilters` est
// donc sûre (aucun caractère d'échappement possible).

async function liveIsSubdomainAvailable(subdomain: string): Promise<boolean> {
  try {
    // TODO(Lot 7): si SYS expose une ressource d'instances, l'interroger plutôt
    // que les tiers. Ici on s'appuie sur l'unicité du code client = sous-domaine.
    const results = await dolibarrFetch<unknown[]>("thirdparties", {
      query: { sqlfilters: `(t.code_client:=:'${subdomain}')`, limit: 1 },
    });
    return !Array.isArray(results) || results.length === 0;
  } catch (error) {
    // Dolibarr répond 404 quand aucun tiers ne correspond → disponible.
    if (error instanceof DolibarrError && error.status === 404) return true;
    throw error;
  }
}

async function liveCreateInstance(
  input: CreateInstanceInput,
): Promise<CreateInstanceResult> {
  // 1) Créer le tiers (client). L'API renvoie l'identifiant créé.
  const thirdpartyId = await dolibarrFetch<number>("thirdparties", {
    method: "POST",
    body: {
      name: input.companyName,
      email: input.email,
      client: 1,
      code_client: input.subdomain,
    },
  });

  // 2) Créer le contrat porteur de l'instance. Sa création (statut initial géré
  //    par SYS) déclenche le clonage par le cron Sell Your SaaS.
  // TODO(Lot 7): renseigner ici les champs SYS attendus (nom d'instance =
  //   sous-domaine, login + e-mail admin, identifiants DB générés) selon le
  //   package configuré sur le Maître.
  const contractId = await dolibarrFetch<number>("contracts", {
    method: "POST",
    body: {
      socid: thirdpartyId,
      note_private: `instance=${input.subdomain};admin=${input.email}`,
    },
  });

  // Récupère la référence lisible du contrat pour l'URL de suivi.
  const contract = await dolibarrFetch<{ ref?: string }>(
    `contracts/${contractId}`,
  );

  return {
    ref: contract?.ref ?? String(contractId),
    subdomain: input.subdomain,
    url: instanceUrl(input.subdomain),
  };
}

async function liveGetInstanceStatus(
  ref: string,
): Promise<InstanceStatus | null> {
  let contract:
    | { id: number; statut?: number; note_private?: string }
    | undefined;

  try {
    const list = await dolibarrFetch<
      Array<{ id: number; statut?: number; note_private?: string }>
    >("contracts", {
      query: { sqlfilters: `(t.ref:=:'${ref}')`, limit: 1 },
    });
    contract = Array.isArray(list) ? list[0] : undefined;
  } catch (error) {
    if (error instanceof DolibarrError && error.status === 404) return null;
    throw error;
  }
  if (!contract) return null;

  // Récupère le sous-domaine stocké dans la note du contrat (cf. création).
  const subdomain =
    contract.note_private?.match(/instance=([a-z0-9-]+)/)?.[1] ?? ref;

  // TODO(Lot 7): mapper le statut SYS réel (DEPLOY_IN_PROGRESS → DEPLOYED) vers
  //   `state`/`step`. En l'absence de granularité, on reste prudent : un contrat
  //   actif (statut Dolibarr = 1) est considéré déployé.
  const deployed = contract.statut === 1;

  return {
    ref,
    subdomain,
    url: instanceUrl(subdomain),
    state: deployed ? "deployed" : "deploying",
    step: deployed ? PROVISIONING_STEPS : 1,
  };
}