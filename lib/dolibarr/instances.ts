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
   * Mot de passe admin **en clair** (Option B). Transmis à Sell Your SaaS pour
   * poser le mot de passe exact de l'admin de l'instance. Ne JAMAIS le
   * journaliser ni le renvoyer au client.
   */
  password: string;
  /** Statut juridique (configurera la fiscalité de l'instance, cf. étape 2). */
  legalStatus?: string;
  /** Assujettissement à la TVA. */
  vatLiable?: boolean;
  /** Métier choisi (`?job=`) → sélectionne le Service SYS (cf. {@link serviceForJob}). */
  job?: string;
  /** Engagement choisi (`?billing=`) — contexte commercial. */
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
  // Schéma de sous-domaine des instances Sell Your SaaS (ex. with1.pichinov.fr).
  const domain = process.env.INSTANCE_DOMAIN ?? "with1.pichinov.fr";
  return `https://${subdomain}.${domain}`;
}

// ---------------------------------------------------------------------------
// Correspondance métier → Service Sell Your SaaS
// ---------------------------------------------------------------------------

/**
 * Slug de métier (front, `?job=`) → réf du **Service SYS** (type Application) qui
 * porte le Package = le dump = les modules de l'instance (cf. PLAN « Guideline §A »).
 * ⚠️ Le slug front `artisan` correspond au service `ArtisanBTP`.
 */
export const JOB_TO_SERVICE: Record<string, string> = {
  fleuriste: "Fleuriste",
  freelance: "Freelance",
  garagiste: "Garagiste",
  artisan: "ArtisanBTP",
};

/** Réf de service utilisée par défaut si le métier est absent/inconnu. */
export const DEFAULT_SERVICE_REF = "Fleuriste";

/** Réf du Service SYS pour un slug de métier (défaut : {@link DEFAULT_SERVICE_REF}). */
export function serviceForJob(job: string | undefined): string {
  return (job ? JOB_TO_SERVICE[job] : undefined) ?? DEFAULT_SERVICE_REF;
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
  const mode = getDolibarrMode();
  // Diagnostic serveur (terminal `npm run dev`) — aucune donnée sensible. Permet
  // de vérifier que l'app est bien en `live` (sinon `mock` = rien n'atteint le Master).
  console.info(
    `[provisioning] createInstance: mode=${mode}` +
      (mode === "live"
        ? `, provision=${process.env.SELLYOURSAAS_PROVISION_MODE ?? "register"}`
        : ""),
  );
  return mode === "mock"
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

/** Coordonnées d'envoi de l'e-mail « instance prête ». */
export type ReadyNotification = {
  to: string;
  companyName: string;
  url: string;
};

/**
 * Réclame (une seule fois) l'envoi de l'e-mail « votre ERP est prêt » pour une
 * instance déployée. **Idempotent** : renvoie les coordonnées au premier appel,
 * puis `null` (déjà notifié, instance inconnue, ou pas encore déployée).
 *
 * Appelé par la route de notification quand le provisioning est terminé — c'est
 * le serveur qui retrouve le destinataire à partir de la réf (jamais le client).
 */
export async function claimReadyNotification(
  ref: string,
): Promise<ReadyNotification | null> {
  return getDolibarrMode() === "mock"
    ? mockClaimReadyNotification(ref)
    : liveClaimReadyNotification(ref);
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
  {
    subdomain: string;
    createdAt: number;
    email: string;
    companyName: string;
    /** L'e-mail « prêt » n'est envoyé qu'une fois (idempotence). */
    notified: boolean;
  }
>();

function mockIsSubdomainAvailable(subdomain: string): boolean {
  return !MOCK_TAKEN.has(subdomain);
}

function mockCreateInstance(input: CreateInstanceInput): CreateInstanceResult {
  // Réf lisible et unique : préfixe contrat + horodatage en base 36.
  const ref = `CT-${Date.now().toString(36).toUpperCase()}`;
  mockInstances.set(ref, {
    subdomain: input.subdomain,
    createdAt: Date.now(),
    email: input.email,
    companyName: input.companyName,
    notified: false,
  });
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

/**
 * Mock : renvoie les coordonnées au premier appel, puis `null` (idempotent). On
 * ne re-vérifie pas le statut temporel ici — c'est le tableau de bord (source de
 * la simulation) qui déclenche l'appel une fois « prêt ».
 */
function mockClaimReadyNotification(ref: string): ReadyNotification | null {
  const record = mockInstances.get(ref);
  if (!record || record.notified) return null;
  record.notified = true;
  return {
    to: record.email,
    companyName: record.companyName,
    url: instanceUrl(record.subdomain),
  };
}

// ---------------------------------------------------------------------------
// Implémentation LIVE (mode `live`)
// ---------------------------------------------------------------------------
//
// Recon (cf. PLAN « Guideline §C/§D ») : Sell Your SaaS n'a PAS d'endpoint REST
// de déploiement. Le déploiement est déclenché par le portail `myaccount` —
// `register_instance.php` — qui appelle en interne `sellyoursaasRemoteAction('deployall')`.
//  → `liveCreateInstance` POSTe donc le formulaire vers `register_instance.php`
//    (SYS y crée tiers + contrat + extrafields + identifiants Unix/DB + déploie).
//  → Le SUIVI et l'UNICITÉ se lisent via l'API REST (`/contracts`, en-tête DOLAPIKEY).
//
// ⚠️ `TODO(live)` = à valider une fois le serveur de déploiement (VPS) en place :
// token anti-abus/CSRF de `register_instance.php`, format exact de sa réponse
// (réf du contrat), et `tldid`. Tant que `SELLYOURSAAS_REGISTER_URL` est absente,
// le mode live échoue explicitement (garder `DOLIBARR_MODE=mock`).
// NB sécurité : `subdomain` est un slug `[a-z0-9-]` (cf. `lib/instances/subdomain.ts`),
// son interpolation dans un `sqlfilters` est donc sûre.

/**
 * Unicité du sous-domaine : SYS pose `ref_customer = <sous-domaine>.<tld>` sur le
 * contrat ; on cherche donc un contrat dont `ref_customer` commence par le slug.
 */
async function liveIsSubdomainAvailable(subdomain: string): Promise<boolean> {
  try {
    const results = await dolibarrFetch<unknown[]>("contracts", {
      query: { sqlfilters: `(t.ref_customer:like:'${subdomain}.%')`, limit: 1 },
    });
    return !Array.isArray(results) || results.length === 0;
  } catch (error) {
    // 404 = aucun contrat correspondant → sous-domaine disponible.
    if (error instanceof DolibarrError && error.status === 404) return true;
    throw error;
  }
}

async function liveCreateInstance(
  input: CreateInstanceInput,
): Promise<CreateInstanceResult> {
  // Mode de TEST (avant l'existence du serveur de déploiement) : on crée le tiers
  // + le contrat via l'API REST, SANS déclencher le déploiement. Permet de vérifier
  // que le tunnel parle bien au Master (auth, connectivité, mapping métier→service).
  if (process.env.SELLYOURSAAS_PROVISION_MODE === "rest-createonly") {
    return liveCreateInstanceRestOnly(input);
  }

  const registerUrl = process.env.SELLYOURSAAS_REGISTER_URL;
  if (!registerUrl) {
    throw new DolibarrError(
      "SELLYOURSAAS_REGISTER_URL non configurée : provisioning live indisponible.",
    );
  }

  const tld = process.env.INSTANCE_DOMAIN ?? "with1.pichinov.fr";
  // Le métier choisi → la réf du Service (= Package = modules de l'instance).
  const serviceRef = serviceForJob(input.job);
  // URL du portail myaccount : sert de Referer. `register_instance.php` REFUSE un
  // Referer vide (contrôle anti-bot) → on en pose toujours un.
  const accountUrl =
    process.env.SELLYOURSAAS_ACCOUNT_URL ?? `https://myaccount.${tld}`;

  // Le portail applique une protection CSRF (jeton lié à la session) ET exige un
  // Referer non vide. On reproduit donc le navigateur : GET register.php d'abord
  // pour récupérer le COOKIE de session + le TOKEN, puis POST register_instance.php.
  const registerPageUrl = `${accountUrl}/register.php?plan=${encodeURIComponent(serviceRef)}`;
  const pageRes = await fetch(registerPageUrl, { cache: "no-store" });
  const pageHtml = await pageRes.text();
  // Cookie de session (PHPSESSID…) : on ne garde que `clé=valeur` (sans les attributs).
  const setCookies =
    (pageRes.headers as unknown as { getSetCookie?: () => string[] })
      .getSetCookie?.() ?? [];
  const sessionCookie = setCookies.map((c) => c.split(";")[0]).join("; ");
  // Jeton anti-CSRF caché du formulaire (l'ordre des attributs name/value peut varier).
  const token =
    (pageHtml.match(/<input[^>]+name="token"[^>]+value="([^"]+)"/i) ??
      pageHtml.match(/<input[^>]+value="([^"]+)"[^>]+name="token"/i))?.[1] ?? "";

  // Champs EXACTS du formulaire public register.php, calés sur un déploiement réel :
  //  - `token` = jeton CSRF lié au cookie de session récupéré ci-dessus ;
  //  - `plan` = réf du Service ; `tldid` inclut le point de tête (« .with1.pichinov.fr ») ;
  //  - `tz_string` NON vide (sinon ErrorBadValueProperty) → on force Europe/Paris ;
  //  - `password`/`password2` EN CLAIR (Option B) — jamais journalisés ni renvoyés.
  const form = new URLSearchParams({
    token,
    username: input.email,
    orgName: input.companyName,
    phone: "",
    password: input.password,
    password2: input.password,
    country: "FR",
    sldAndSubdomain: input.subdomain,
    tldid: `.${tld}`,
    plan: serviceRef,
    origin: "app",
    partner: "0",
    partnerkey: "",
    checkboxnonprofitorga: "",
    tz_string: "Europe/Paris",
  });

  // register_instance.php est SYNCHRONE : il déploie (~5 min) AVANT de répondre.
  // Stratégie : on lance le POST et on attend AU PLUS ~12 s. Un rejet (CSRF, champ
  // invalide, sous-domaine pris…) revient vite → on le détecte et on le journalise ;
  // sinon (pas de réponse rapide) le déploiement est lancé → on rend la main, le POST
  // file en arrière-plan, et l'UI suit l'avancement par polling de getInstanceStatus.
  const postPromise = fetch(registerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: sessionCookie,
      Referer: registerPageUrl,
    },
    referrer: registerPageUrl,
    referrerPolicy: "unsafe-url",
    body: form.toString(),
    redirect: "manual",
    cache: "no-store",
  });
  const early = await Promise.race([
    postPromise.then(async (res) => ({
      status: res.status,
      location: res.headers.get("location") ?? "-",
      body: (await res.text().catch(() => ""))
        .slice(0, 300)
        .replace(/\s+/g, " ")
        .trim(),
    })),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 12_000)),
  ]);
  if (early) {
    // Réponse immédiate. Ça PEUT être un rejet (CSRF, champ invalide, email déjà
    // pris…), mais aussi une **création réussie** que SYS confirme par une redirection
    // rapide (tiers + contrat créés). On ne lève donc une erreur QUE si on récupère un
    // **vrai message d'erreur** (bloc `.error` ou code `ErrorXxx`). Sinon, on considère
    // la création lancée et on laisse le polling de getInstanceStatus trancher (un vrai
    // échec finira en 404 → l'UI affiche « introuvable » après sa tolérance).
    let detail = "";
    if (early.location !== "-") {
      try {
        const errUrl = new URL(early.location, accountUrl).toString();
        const errHtml = await (
          await fetch(errUrl, {
            headers: { Cookie: sessionCookie },
            cache: "no-store",
          })
        ).text();
        const blocks = [
          ...errHtml.matchAll(
            /<div[^>]*class="[^"]*error[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
          ),
        ]
          .map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
          .filter(Boolean);
        // detail reste "" si AUCUN bloc d'erreur n'est trouvé (= pas un rejet).
        detail = blocks.join(" | ").slice(0, 300) || errHtml.match(/Error[A-Z][A-Za-z]+/)?.[0] || "";
      } catch (e) {
        // Suivi de la redirection impossible → on ne peut pas conclure à un rejet.
        console.warn(`[provisioning] suivi de la redirection KO : ${e}`);
        detail = "";
      }
    } else if (/\b(error|erreur|exist|invalid)\b/i.test(early.body)) {
      // Pas de redirection : un éventuel message d'erreur serait dans le corps direct.
      detail = early.body;
    }

    if (detail) {
      // Vrai message d'erreur → rejet « métier » remonté à l'UI (status 4xx). Détail brut loggé.
      console.warn(`[provisioning] inscription refusée par le portail : ${detail}`);
      const message = /already exists/i.test(detail)
        ? "Le mail a déjà été utilisé sur une autre instance. Connectez-vous sur votre espace ou utilisez un autre mail."
        : "L'inscription a été refusée par le portail. Vérifiez vos informations et réessayez.";
      throw new DolibarrError(message, 409);
    }
    // Réponse rapide SANS message d'erreur = création lancée → on laisse filer le POST.
    console.info(
      "[provisioning] register_instance : réponse rapide sans erreur → création en cours (suivi par polling).",
    );
    void postPromise.catch((error) =>
      console.error("[provisioning] POST register_instance (arrière-plan) :", error),
    );
  } else {
    // Pas de réponse rapide = déploiement synchrone en cours. On laisse filer le POST.
    console.info(
      "[provisioning] register_instance : déploiement lancé (aucun rejet immédiat).",
    );
    void postPromise.catch((error) =>
      console.error("[provisioning] POST register_instance (arrière-plan) :", error),
    );
  }

  // SYS pose `ref_customer = <sous-domaine>.<tld>` sur le contrat → réf de suivi.
  const ref = `${input.subdomain}.${tld}`;
  return { ref, subdomain: input.subdomain, url: instanceUrl(input.subdomain) };
}

/**
 * Provisioning de TEST `rest-createonly` : crée le **tiers** + un **contrat** dans
 * le Master via l'API REST, **sans** déclencher le déploiement. Sert à valider la
 * connexion app→Master (auth, connectivité, mapping métier→service) avant que le
 * serveur de déploiement existe.
 *
 * ⚠️ Crée de **vraies données** (préfixées « [TEST Provi] ») dans le Master de prod
 * → à supprimer après le test. Le mot de passe n'est PAS stocké ici (inutile sans
 * déploiement). La réf de suivi est `ref_customer` (= sous-domaine.tld), cohérente
 * avec {@link liveGetInstanceStatus}.
 */
async function liveCreateInstanceRestOnly(
  input: CreateInstanceInput,
): Promise<CreateInstanceResult> {
  const tld = process.env.INSTANCE_DOMAIN ?? "with1.pichinov.fr";
  const serviceRef = serviceForJob(input.job);
  const refCustomer = `${input.subdomain}.${tld}`;

  // 1) Tiers (client). Préfixe « [TEST Provi] » pour repérer/nettoyer facilement.
  //    `code_client: -1` = laisser Dolibarr générer le code (le Master impose un
  //    code via le module `mod_codeclient_monkey`), comme `register_instance.php`.
  const thirdpartyId = await dolibarrFetch<number>("thirdparties", {
    method: "POST",
    body: {
      name: `[TEST Provi] ${input.companyName}`,
      email: input.email,
      client: 2,
      code_client: -1,
    },
  });

  // 2) Contrat rattaché — best-effort. Sur le Master MUTUALISÉ, la création de
  //    contrat via l'API peut planter (un hook du module SYS se déclenche et
  //    appelle une fonction système désactivée par OVH → 503 Varnish). Le but du
  //    test (« le tiers apparaît dans le Master ») est déjà atteint au point 1 :
  //    on ne fait donc PAS échouer le test si le contrat ne passe pas (il passera
  //    sur le VPS, où ces fonctions sont disponibles).
  try {
    await dolibarrFetch<number>("contracts", {
      method: "POST",
      body: {
        socid: thirdpartyId,
        date_contrat: Math.floor(Date.now() / 1000),
        ref_customer: refCustomer,
        note_private: `[TEST Provi] metier=${serviceRef} sous-domaine=${input.subdomain} email=${input.email} — créé sans déploiement (mode rest-createonly).`,
      },
    });
  } catch (error) {
    console.warn(
      `[provisioning] rest-createonly : tiers #${thirdpartyId} créé, mais contrat KO (attendu sur le mutualisé) :`,
      error instanceof DolibarrError ? error.message : error,
    );
  }

  return {
    ref: refCustomer,
    subdomain: input.subdomain,
    url: instanceUrl(input.subdomain),
  };
}

async function liveGetInstanceStatus(
  ref: string,
): Promise<InstanceStatus | null> {
  // Suivi : extrafield `options_deployment_status` du contrat (`processing` → `done`).
  type LiveContract = {
    ref_customer?: string;
    array_options?: { options_deployment_status?: string };
  };
  let contract: LiveContract | undefined;
  try {
    const list = await dolibarrFetch<LiveContract[]>("contracts", {
      query: { sqlfilters: `(t.ref_customer:=:'${ref}')`, limit: 1 },
    });
    contract = Array.isArray(list) ? list[0] : undefined;
  } catch (error) {
    if (error instanceof DolibarrError && error.status === 404) return null;
    throw error;
  }
  if (!contract) return null;

  const subdomain = contract.ref_customer?.split(".")[0] ?? ref;
  const status = contract.array_options?.options_deployment_status;
  const state: InstanceState =
    status === "done" ? "deployed" : status === "error" ? "error" : "deploying";

  return {
    ref,
    subdomain,
    url: instanceUrl(subdomain),
    state,
    // Granularité indicative pour l'UI : 4 quand prêt, sinon « en cours ».
    step: state === "deployed" ? PROVISIONING_STEPS : 1,
  };
}

// TODO(live): notification « prête » — lire le contrat, vérifier
//   options_deployment_status='done', et garantir l'idempotence via un extrafield.
async function liveClaimReadyNotification(
  _ref: string,
): Promise<ReadyNotification | null> {
  return null;
}