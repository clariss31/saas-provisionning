import { type NextRequest, NextResponse } from "next/server";
import { slugify, validateSubdomain } from "@/lib/instances/subdomain";
import { isSubdomainAvailable } from "@/lib/dolibarr/instances";

/**
 * Réponse de la vérification de sous-domaine (contrat avec le composant client).
 */
export type SubdomainCheckResponse = {
  /** Sous-domaine dérivé de la saisie (source de vérité, calculé côté serveur). */
  subdomain: string;
  /** `true` si le format est valide ET le sous-domaine libre côté Maître. */
  available: boolean;
  /** Motif d'indisponibilité prêt à afficher, ou `null` si disponible. */
  reason: string | null;
};

/**
 * `GET /api/subdomain/check?name=<raison sociale>` — vérifie en temps réel la
 * disponibilité du sous-domaine dérivé d'une raison sociale (US 5.2).
 *
 * Étapes : on slugifie côté serveur (autorité), on valide le format, puis on
 * interroge le Dolibarr Maître via la couche isolée `lib/dolibarr` (en mode
 * `mock` tant que l'infra n'est pas branchée).
 *
 * Le handler est dynamique (il lit la query) et n'est donc jamais mis en cache.
 */
export async function GET(request: NextRequest): Promise<NextResponse<SubdomainCheckResponse>> {
  const raw = request.nextUrl.searchParams.get("name") ?? "";
  const subdomain = slugify(raw);

  // 1) Validation de format (longueur, caractères, mots réservés).
  const formatError = validateSubdomain(subdomain);
  if (formatError) {
    return NextResponse.json({ subdomain, available: false, reason: formatError });
  }

  // 2) Unicité auprès du Dolibarr Maître.
  try {
    const available = await isSubdomainAvailable(subdomain);
    return NextResponse.json({
      subdomain,
      available,
      reason: available ? null : "Ce sous-domaine est déjà pris.",
    });
  } catch (error) {
    // Échec de l'appel au Maître : on logge l'erreur réelle côté serveur (terminal)
    // pour diagnostic, et on renvoie un message neutre plutôt qu'un 500 brut.
    console.error("[subdomain/check] échec de la vérification au Maître :", error);
    return NextResponse.json({
      subdomain,
      available: false,
      reason: "Vérification impossible, réessayez.",
    });
  }
}