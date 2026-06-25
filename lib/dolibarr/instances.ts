/**
 * Couche métier « instances » : l'unique point d'entrée pour créer et suivre
 * une instance Dolibarr depuis l'application.
 *
 * Toute dépendance au Dolibarr Maître / Sell Your SaaS passe par ici : le reste
 * de l'app (Route Handlers, UI) n'appelle QUE ces fonctions. Tous les appels
 * sont réels — API REST du Maître (lecture) et portail Sell Your SaaS (création).
 *
 * ⚠️ Module **strictement serveur** (il importe le client porteur du DOLAPIKEY).
 */

import { DolibarrError, dolibarrFetch } from "./client";

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
  /** Nom complet du gérant (utilisateur principal de l'instance). */
  managerName: string;
  /**
   * E-mail du client : sert d'identité à l'inscription SYS **et** de login
   * Dolibarr sur l'instance (posé par le « SQL après déploiement » du Package).
   */
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
// Accès réel au Dolibarr Maître / Sell Your SaaS
// ---------------------------------------------------------------------------
//
// Recon (cf. PLAN « Guideline §C/§D ») : Sell Your SaaS n'a PAS d'endpoint REST
// de déploiement. Le déploiement est déclenché par le portail `myaccount` —
// `register_instance.php` — qui appelle en interne `sellyoursaasRemoteAction('deployall')`.
//  → `createInstance` POSTe donc le formulaire vers `register_instance.php`
//    (SYS y crée tiers + contrat + extrafields + identifiants Unix/DB + déploie).
//  → Le SUIVI et l'UNICITÉ se lisent via l'API REST (`/contracts`, en-tête DOLAPIKEY).
//
// Tant que `SELLYOURSAAS_REGISTER_URL` est absente, la création échoue
// explicitement (configuration de provisioning requise).
// NB sécurité : `subdomain` est un slug `[a-z0-9-]` (cf. `lib/instances/subdomain.ts`),
// son interpolation dans un `sqlfilters` est donc sûre.

/**
 * Indique si un sous-domaine est disponible sur le Maître.
 *
 * Unicité du sous-domaine : SYS pose `ref_customer = <sous-domaine>.<tld>` sur le
 * contrat ; on cherche donc un contrat dont `ref_customer` commence par le slug.
 *
 * @param subdomain Sous-domaine déjà slugifié (`[a-z0-9-]`).
 */
export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
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

/** Crée le client + le contrat porteur de l'instance, déclenchant le clonage SYS. */
export async function createInstance(
  input: CreateInstanceInput,
): Promise<CreateInstanceResult> {
  const registerUrl = process.env.SELLYOURSAAS_REGISTER_URL;
  if (!registerUrl) {
    throw new DolibarrError(
      "SELLYOURSAAS_REGISTER_URL non configurée : provisioning indisponible.",
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
    // ⚠️ `register_instance.php` valide CE champ comme une **adresse e-mail** et
    // s'en sert d'identité SYS : y mettre un login « prenom.nom » est refusé
    // (« Email address … is incorrect »). On y met donc l'e-mail. Le login
    // Dolibarr réel de l'instance est posé séparément par le « SQL après
    // déploiement » du Package (cf. utilisateur « clienttemplate »).
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
 * Lit l'état d'avancement d'une instance.
 * @returns le statut, ou `null` si la référence est inconnue.
 */
export async function getInstanceStatus(
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