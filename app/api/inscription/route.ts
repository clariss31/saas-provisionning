import { type NextRequest, NextResponse } from "next/server";
import { slugify, validateSubdomain } from "@/lib/instances/subdomain";
import { isSubdomainAvailable, createInstance } from "@/lib/dolibarr/instances";

/**
 * `POST /api/inscription` — crée une instance à partir des données du tunnel
 * d'inscription (Lot 4).
 *
 * Flux : validation **serveur** (la route est joignable directement, jamais de
 * confiance au client) → création de l'instance via la couche `lib/dolibarr`
 * (en `mock` tant que l'infra n'est pas branchée).
 *
 * L'e-mail « Votre ERP est prêt » n'est PAS envoyé ici : il part à la **fin du
 * provisioning** (cf. `POST /api/provisioning/notify`).
 *
 * Le mot de passe arrive déjà **haché** (SHA-256) : le clair ne quitte jamais
 * le navigateur (cf. `hashPassword`). On ne le journalise jamais.
 */

/** Forme brute du corps reçu (tout est considéré hostile jusqu'à validation). */
type InscriptionBody = {
  companyName?: unknown;
  managerName?: unknown;
  legalStatus?: unknown;
  vat?: unknown;
  email?: unknown;
  passwordHash?: unknown;
  job?: unknown;
  billing?: unknown;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Récupère une valeur de champ sous forme de chaîne. */
function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: InscriptionBody;
  try {
    body = (await request.json()) as InscriptionBody;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const companyName = asString(body.companyName).trim();
  const managerName = asString(body.managerName).trim();
  const email = asString(body.email).trim().toLowerCase();
  const passwordHash = asString(body.passwordHash);
  const legalStatus = asString(body.legalStatus);
  const vat = asString(body.vat);
  const job = asString(body.job) || undefined;
  const billing = asString(body.billing) || undefined;

  // --- Validation serveur ---------------------------------------------------
  if (managerName.length < 2) {
    return NextResponse.json({ error: "Le nom du gérant est requis." }, { status: 400 });
  }
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }
  // Le mot de passe est une empreinte SHA-256 (64 caractères hexadécimaux).
  if (!/^[a-f0-9]{64}$/.test(passwordHash)) {
    return NextResponse.json({ error: "Mot de passe invalide." }, { status: 400 });
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
  if (!(await isSubdomainAvailable(subdomain))) {
    return NextResponse.json({ error: "Ce sous-domaine est déjà pris." }, { status: 409 });
  }

  // --- Création de l'instance (mock tant que DOLIBARR_MODE !== "live") -------
  const instance = await createInstance({
    companyName,
    subdomain,
    managerName,
    email,
    password: passwordHash,
    legalStatus,
    vatLiable: vat === "oui",
    job,
    billing,
  });

  return NextResponse.json({
    ref: instance.ref,
    subdomain: instance.subdomain,
    url: instance.url,
  });
}