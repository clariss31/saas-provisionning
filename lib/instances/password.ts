/**
 * Évaluation de la robustesse d'un mot de passe (jauge visuelle du tunnel
 * d'inscription). Module **pur** et testable, utilisable côté client ET serveur.
 *
 * NB : ce score est à la fois l'aide à la saisie côté client et la **politique
 * de mot de passe** revérifiée côté serveur (`/api/inscription`). Le mot de passe
 * transite **en clair sur TLS** (Option B) car Sell Your SaaS doit pouvoir poser
 * ce mot de passe exact sur le compte admin de l'instance — il n'est jamais
 * journalisé ni persisté au-delà de la requête.
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

/** Longueur maximale acceptée (garde-fou anti-abus, pas une contrainte métier). */
export const PASSWORD_MAX_LENGTH = 128;

/**
 * Politique de mot de passe appliquée **côté serveur** avant provisioning.
 * Renvoie `true` si le mot de passe est conforme (longueur dans les bornes et
 * robustesse « acceptable » au sens de {@link scorePassword}).
 */
export function isPasswordAcceptable(password: string): boolean {
  return (
    password.length <= PASSWORD_MAX_LENGTH && scorePassword(password).acceptable
  );
}