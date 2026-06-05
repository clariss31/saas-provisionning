/**
 * Évaluation de la robustesse d'un mot de passe (jauge visuelle du tunnel
 * d'inscription). Module **pur** et testable.
 *
 * NB : ce score n'est qu'une aide à la saisie côté client ; la politique de mot
 * de passe réelle (longueur minimale, hachage) est appliquée côté serveur lors
 * de la création de l'instance.
 */

/** Longueur minimale acceptée pour un mot de passe admin. */
export const PASSWORD_MIN_LENGTH = 8;

/** Score discret de robustesse (0 = vide/très faible → 4 = excellent). */
export type PasswordScore = 0 | 1 | 2 | 3 | 4;

/** Résultat de l'évaluation. */
export type PasswordStrength = {
  score: PasswordScore;
  /** Libellé prêt à afficher. */
  label: string;
  /** `true` si le mot de passe atteint le minimum acceptable pour soumettre. */
  acceptable: boolean;
};

const LABELS: Record<PasswordScore, string> = {
  0: "Très faible",
  1: "Faible",
  2: "Moyen",
  3: "Bon",
  4: "Excellent",
};

/**
 * Calcule la robustesse d'un mot de passe à partir de critères simples
 * (longueur, diversité des classes de caractères).
 *
 * @returns score, libellé et seuil d'acceptation.
 */
export function scorePassword(password: string): PasswordStrength {
  let raw = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) raw++;
  if (password.length >= 12) raw++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) raw++; // mixage de casse
  if (/\d/.test(password)) raw++;
  if (/[^A-Za-z0-9]/.test(password)) raw++; // caractère spécial

  const score = Math.min(4, raw) as PasswordScore;
  // Acceptable = longueur minimale ET au moins un score « moyen ».
  const acceptable = password.length >= PASSWORD_MIN_LENGTH && score >= 2;

  return { score, label: LABELS[score], acceptable };
}

/**
 * Empreinte SHA-256 (hexadécimale) d'un mot de passe, calculée côté client
 * (Web Crypto) **avant transmission** : le mot de passe en clair ne quitte
 * jamais le navigateur.
 *
 * NB : en provisioning réel (Lot 7), la pose du mot de passe admin sur
 * l'instance sera gérée côté serveur par Sell Your SaaS ; ce hash sert à éviter
 * tout transit en clair pendant la phase mock.
 */
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}