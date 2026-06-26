import { type NextRequest, NextResponse } from "next/server";
import { slugify, validateSubdomain } from "@/lib/instances/subdomain";
import { isSubdomainAvailable, createInstance } from "@/lib/dolibarr/instances";
import { isPasswordAcceptable } from "@/lib/instances/password";
import { DolibarrError } from "@/lib/dolibarr/client";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * `POST /api/inscription` — crée une instance à partir des données du tunnel
 * d'inscription (Lot 4).
 *
 * Flux : validation **serveur** (la route est joignable directement, jamais de
 * confiance au client) → création de l'instance via la couche `lib/dolibarr`
 * (appels réels au Dolibarr Maître / Sell Your SaaS).
 *
 * L'e-mail « votre ERP est prêt » n'est PAS envoyé par l'application : c'est
 * **SellYourSaas** qui l'émet côté serveur à la fin du déploiement (plus fiable
 * qu'un envoi déclenché depuis le navigateur du client).
 *
 * Le mot de passe arrive **en clair** (Option B, sur TLS) : Sell Your SaaS doit
 * pouvoir poser ce mot de passe exact sur l'admin de l'instance. On le valide,
 * on le transmet à la couche `lib/dolibarr`, mais on ne le **journalise jamais**.
 */

/** Forme brute du corps reçu (tout est considéré hostile jusqu'à validation). */
type InscriptionBody = {
  companyName?: unknown;
  managerName?: unknown;
  legalStatus?: unknown;
  vat?: unknown;
  email?: unknown;
  password?: unknown;
  job?: unknown;
  billing?: unknown;
  // Données SIRENE auto-remplies (optionnelles ; non encore propagées — Phase 2).
  siren?: unknown;
  siret?: unknown;
  address?: unknown;
  zip?: unknown;
  town?: unknown;
  departement?: unknown;
  naf?: unknown;
  tva?: unknown;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Récupère une valeur de champ sous forme de chaîne. */
function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Anti-abus : la création d'instance est coûteuse (tiers + contrat + déploiement)
  // → on limite à 5 tentatives / 10 min par IP.
  const rl = rateLimit(`inscription:${clientIp(request)}`, 5, 10 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives de création. Réessayez dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: InscriptionBody;
  try {
    body = (await request.json()) as InscriptionBody;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const companyName = asString(body.companyName).trim();
  // Nom du gérant : désormais **déduit** côté client de l'API SIRENE (plus de
  // saisie obligatoire). On l'accepte tel quel, vide compris.
  const managerName = asString(body.managerName).trim();
  const email = asString(body.email).trim().toLowerCase();
  const password = asString(body.password);
  const legalStatus = asString(body.legalStatus);
  const vat = asString(body.vat);
  const job = asString(body.job) || undefined;
  const billing = asString(body.billing) || undefined;
  // Données SIRENE : transmises à la couche métier (usage en Phase 2).
  const siren = asString(body.siren).trim();
  const siret = asString(body.siret).trim();
  const address = asString(body.address).trim();
  const zip = asString(body.zip).trim();
  const town = asString(body.town).trim();
  const departement = asString(body.departement).trim();
  const naf = asString(body.naf).trim();
  const tva = asString(body.tva).trim();

  // --- Validation serveur ---------------------------------------------------
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }
  // Mot de passe en clair (Option B) : on revérifie la politique (longueur +
  // robustesse) côté serveur — jamais de confiance au client.
  if (!isPasswordAcceptable(password)) {
    return NextResponse.json(
      { error: "Le mot de passe ne respecte pas la politique de sécurité." },
      { status: 400 },
    );
  }
  if (legalStatus === "" || (vat !== "oui" && vat !== "non")) {
    return NextResponse.json(
      { error: "Informations fiscales incomplètes." },
      { status: 400 },
    );
  }

  // Le sous-domaine est dérivé côté serveur (autorité), puis revalidé.
  const subdomain = slugify(companyName);
  const formatError = validateSubdomain(subdomain);
  if (formatError) {
    return NextResponse.json({ error: formatError }, { status: 400 });
  }
  try {
    if (!(await isSubdomainAvailable(subdomain))) {
      return NextResponse.json({ error: "Ce sous-domaine est déjà pris." }, { status: 409 });
    }

    // --- Création de l'instance (Dolibarr Maître / Sell Your SaaS) -----------
    const instance = await createInstance({
      companyName,
      subdomain,
      managerName,
      email,
      password,
      legalStatus,
      vatLiable: vat === "oui",
      job,
      billing,
      siren,
      siret,
      address,
      zip,
      town,
      departement,
      naf,
      tva,
    });

    return NextResponse.json({
      ref: instance.ref,
      subdomain: instance.subdomain,
      url: instance.url,
    });
  } catch (error) {
    // On logge l'erreur réelle côté serveur (terminal) pour diagnostic ; le mot
    // de passe n'apparaît jamais dans ces objets d'erreur.
    console.error("[inscription] échec de la création de l'instance :", error);
    // Rejet « métier » remontable à l'utilisateur (ex. email déjà utilisé) = status 4xx
    // → on affiche son message. Sinon = panne technique → message neutre.
    if (
      error instanceof DolibarrError &&
      typeof error.status === "number" &&
      error.status >= 400 &&
      error.status < 500
    ) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "La création a échoué. Réessayez." },
      { status: 502 },
    );
  }
}