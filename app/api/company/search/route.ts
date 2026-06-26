import { type NextRequest, NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import {
  mapSearchResult,
  type CompanyResult,
  type RawSearchResponse,
} from "@/lib/instances/company";

/**
 * `GET /api/company/search?q=...` — proxy vers l'API publique **Recherche
 * d'entreprises** (base SIRENE, `recherche-entreprises.api.gouv.fr`).
 *
 * Pourquoi un proxy serveur plutôt qu'un `fetch` direct depuis le navigateur
 * (comme le faisait kaleido) : on **normalise** le gros payload de l'API en une
 * forme propre ({@link CompanyResult}) côté serveur, on applique un **rate-limit**
 * réutilisable, et on uniformise la gestion d'erreur (le client ne reçoit jamais
 * d'erreur brute, seulement une liste — éventuellement vide).
 *
 * Note : l'API gouv limite par IP. En proxy, tous les visiteurs partagent l'IP du
 * serveur → on borne les appels via `minlength=3` + le debounce côté client.
 */

/** Contrat de réponse, réutilisé par le composant client. */
export type CompanySearchResponse = { results: CompanyResult[] };

const API_URL = "https://recherche-entreprises.api.gouv.fr/search";
/** En-deçà, on ne lance aucun appel (cohérent avec le debounce client). */
const MIN_QUERY_LENGTH = 3;
/** Nombre de suggestions renvoyées (aligné sur le wizard kaleido). */
const RESULTS_LIMIT = 6;

export async function GET(
  request: NextRequest,
): Promise<NextResponse<CompanySearchResponse>> {
  // Anti-abus : 20 recherches / min par IP (l'appel sort vers une API tierce).
  if (!rateLimit(`company:${clientIp(request)}`, 20, 60_000).allowed) {
    return NextResponse.json({ results: [] });
  }

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ results: [] });
  }

  try {
    const res = await fetch(
      `${API_URL}?q=${encodeURIComponent(q)}&per_page=${RESULTS_LIMIT}`,
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
    if (!res.ok) {
      console.error(`[company/search] API Recherche d'entreprises HTTP ${res.status}`);
      return NextResponse.json({ results: [] });
    }
    const data = (await res.json()) as RawSearchResponse;
    // On ignore les entrées sans SIREN (inexploitables côté formulaire).
    const results = (data.results ?? [])
      .map(mapSearchResult)
      .filter((company) => company.siren !== "");
    return NextResponse.json({ results });
  } catch (error) {
    console.error(
      "[company/search] échec de l'appel à l'API Recherche d'entreprises :",
      error,
    );
    return NextResponse.json({ results: [] });
  }
}