/**
 * Dérivation et validation du sous-domaine d'une instance.
 *
 * Module **pur** (aucune dépendance, aucun effet de bord) → réutilisable côté
 * client (aperçu live pendant la saisie) ET serveur (source de vérité dans la
 * route de vérification), et couvert par des tests unitaires.
 *
 * Le sous-domaine devient l'URL de l'instance : `<subdomain>.<INSTANCE_DOMAIN>`.
 * Il doit donc être un libellé DNS sûr : `[a-z0-9]` séparés par des tirets.
 */

/** Longueurs admissibles pour un sous-domaine (caractères). */
export const SUBDOMAIN_LIMITS = { min: 3, max: 40 } as const;

/**
 * Sous-domaines réservés (techniques) : refusés même s'ils sont « libres » côté
 * Dolibarr, pour éviter toute collision avec l'infrastructure de l'agence.
 */
export const RESERVED_SUBDOMAINS = new Set<string>([
  "www",
  "admin",
  "api",
  "app",
  "mail",
  "smtp",
  "ftp",
  "ns",
  "dev",
  "staging",
  "test",
  "demo",
  "kaleido",
  "dolibarr",
  "pichinov",
]);

// Bornes de code points utilisées par le slugify (évite toute regex contenant
// des caractères spéciaux en source).
const COMBINING_MIN = 0x300; // début du bloc « combining diacritical marks »
const COMBINING_MAX = 0x36f; // fin du bloc
const CODE_0 = 0x30;
const CODE_9 = 0x39;
const CODE_A = 0x61;
const CODE_Z = 0x7a;

/**
 * Transforme une raison sociale en sous-domaine candidat :
 *  - accents décomposés (NFD) puis **diacritiques retirés** (`Café` → `cafe`,
 *    `Brûlé` → `brule`, sans tiret parasite) ;
 *  - passage en minuscules ;
 *  - tout caractère hors `[a-z0-9]` traité comme une frontière de mot (tiret) ;
 *  - tirets multiples fusionnés, pas de tiret en bordure ;
 *  - tronqué à la longueur maximale.
 *
 * Implémenté par un parcours de code points (plutôt qu'une regex Unicode) pour
 * rester lisible et robuste.
 *
 * @param raw Raison sociale brute saisie par l'utilisateur.
 * @returns Le sous-domaine normalisé (vide si la saisie n'a aucun alphanumérique).
 */
export function slugify(raw: string): string {
  const decomposed = raw.normalize("NFD").toLowerCase();
  let out = "";
  // Un séparateur n'est matérialisé (par un tiret) que lorsqu'un caractère
  // alphanumérique le suit : cela fusionne les séparateurs et évite tout tiret
  // en tête ou en fin.
  let pendingSeparator = false;

  for (const ch of decomposed) {
    const code = ch.codePointAt(0) ?? 0;

    // Diacritique combinant issu de la décomposition NFD : ignoré.
    if (code >= COMBINING_MIN && code <= COMBINING_MAX) continue;

    const isAlphaNum =
      (code >= CODE_A && code <= CODE_Z) || (code >= CODE_0 && code <= CODE_9);

    if (isAlphaNum) {
      if (pendingSeparator && out.length > 0) out += "-";
      pendingSeparator = false;
      out += ch;
      if (out.length >= SUBDOMAIN_LIMITS.max) break;
    } else if (out.length > 0) {
      pendingSeparator = true;
    }
  }

  // Garde-fou : la troncature ne doit jamais laisser de tiret final.
  return out.slice(0, SUBDOMAIN_LIMITS.max).replace(/-+$/g, "");
}

/**
 * Valide le **format** d'un sous-domaine déjà slugifié (longueur, caractères
 * autorisés, mots réservés). Ne vérifie PAS la disponibilité (qui dépend du
 * Dolibarr Maître).
 *
 * @returns un libellé d'erreur prêt à afficher, ou `null` si le format est valide.
 */
export function validateSubdomain(subdomain: string): string | null {
  if (subdomain.length < SUBDOMAIN_LIMITS.min) {
    return `Le sous-domaine doit contenir au moins ${SUBDOMAIN_LIMITS.min} caractères.`;
  }
  if (subdomain.length > SUBDOMAIN_LIMITS.max) {
    return `Le sous-domaine ne doit pas dépasser ${SUBDOMAIN_LIMITS.max} caractères.`;
  }
  // Lettres/chiffres séparés par des tirets simples, sans tiret en bordure.
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(subdomain)) {
    return "Format invalide : lettres, chiffres et tirets uniquement.";
  }
  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    return "Ce sous-domaine est réservé.";
  }
  return null;
}