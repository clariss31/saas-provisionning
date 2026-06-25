/**
 * Client bas niveau pour l'API REST du Dolibarr Maître.
 *
 * ⚠️ Module **strictement serveur** : il porte le jeton `DOLAPIKEY` et ne doit
 * jamais être importé par un composant client. Il n'est consommé que par la
 * couche métier (`lib/dolibarr/instances.ts`) et les Route Handlers.
 *
 * Tous les appels sont des requêtes HTTP réelles vers l'API REST du Maître ;
 * l'URL et la clé proviennent de `DOLIBARR_API_URL` / `DOLIBARR_API_KEY`.
 */

/** Erreur normalisée remontée par le client (message + statut HTTP éventuel). */
export class DolibarrError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "DolibarrError";
    this.status = status;
  }
}

/** Options d'un appel à l'API REST. */
type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** Corps JSON (sérialisé automatiquement). */
  body?: unknown;
  /** Paramètres ajoutés à la chaîne de requête. */
  query?: Record<string, string | number | undefined>;
};

/** Construit l'URL absolue d'une ressource à partir de son chemin relatif. */
function buildUrl(path: string, query?: FetchOptions["query"]): string {
  const base = process.env.DOLIBARR_API_URL?.replace(/\/$/, "");
  if (!base) {
    throw new DolibarrError("DOLIBARR_API_URL n'est pas configurée.");
  }
  const url = new URL(`${base}/${path.replace(/^\//, "")}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * Effectue un appel authentifié à l'API REST Dolibarr (en-tête `DOLAPIKEY`).
 *
 * @throws {DolibarrError} si la configuration manque ou si la réponse est en
 *   échec ; le `status` HTTP est conservé pour permettre un traitement fin
 *   (ex. 404 = ressource absente, interprété comme « disponible »).
 */
export async function dolibarrFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const apiKey = process.env.DOLIBARR_API_KEY;
  if (!apiKey) {
    throw new DolibarrError("DOLIBARR_API_KEY n'est pas configurée.");
  }

  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers: {
      DOLAPIKEY: apiKey,
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    // Données de provisioning toujours fraîches : pas de mise en cache.
    cache: "no-store",
  });

  if (!res.ok) {
    // Dolibarr renvoie usuellement `{ error: { code, message } }` en JSON, mais une
    // couche en amont (serveur web, WAF OVH, fatal PHP) peut renvoyer du HTML/texte.
    // On lit le corps BRUT pour exposer la vraie raison dans le message d'erreur.
    const bodyText = await res.text().catch(() => "");
    let detail = "";
    try {
      const data = JSON.parse(bodyText) as { error?: { message?: string } };
      detail = data?.error?.message ?? "";
    } catch {
      // Corps non-JSON : on garde un extrait lisible du texte brut.
      detail = bodyText.replace(/\s+/g, " ").trim().slice(0, 300);
    }
    throw new DolibarrError(
      `Appel Dolibarr en échec (HTTP ${res.status})${detail ? ` : ${detail}` : ""}.`,
      res.status,
    );
  }

  // 204 No Content : pas de corps à parser.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}