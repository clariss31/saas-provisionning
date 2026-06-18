/**
 * Limiteur de débit minimaliste, **en mémoire** (fenêtre fixe par clé).
 *
 * Protège les routes publiques (`/api/inscription`, `/api/subdomain/check`) d'un
 * usage abusif : elles tapent le Dolibarr Maître et déclenchent des déploiements.
 *
 * ⚠️ Conçu pour un **serveur Node persistant mono-processus** (le cas de cette app).
 * En multi-instance / serverless, l'état n'est pas partagé → il faudrait un store
 * commun (Redis, Upstash…). C'est une **première barrière**, pas une protection
 * anti-DDoS (à compléter par un WAF / rate-limit côté reverse-proxy en prod).
 */

type Bucket = { count: number; resetAt: number };

/** Compteurs par clé (`<route>:<ip>`). Purgé opportunément (cf. {@link rateLimit}). */
const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  /** `true` si la requête est autorisée. */
  allowed: boolean;
  /** Secondes avant réinitialisation de la fenêtre (utile pour l'en-tête `Retry-After`). */
  retryAfterSec: number;
};

/**
 * Autorise `limit` requêtes par fenêtre de `windowMs` pour une `key` donnée.
 * @param key Identifiant logique (ex. `"inscription:1.2.3.4"`).
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  // Pas de fenêtre en cours (ou expirée) → on en ouvre une neuve.
  if (!bucket || now >= bucket.resetAt) {
    // Purge opportuniste des entrées expirées pour borner la mémoire.
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

/**
 * Extrait l'IP cliente d'une requête. Derrière un reverse-proxy, on prend la
 * **première** valeur de `X-Forwarded-For` (l'IP d'origine), sinon `X-Real-IP`.
 */
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
