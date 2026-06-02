/**
 * Validation et assainissement des messages du formulaire de contact.
 *
 * Module **pur** (aucun effet de bord, aucune dépendance serveur) : il est
 * importé par la Server Action et couvert par des tests unitaires. La règle
 * d'or : ne jamais faire confiance aux données reçues du client — tout est
 * revalidé ici, côté serveur.
 *
 * Axes de sécurité couverts :
 *  - longueurs bornées (anti-abus / déni de service) ;
 *  - liste blanche stricte pour le sujet ;
 *  - suppression des caractères de contrôle et des sauts de ligne sur les
 *    champs « une ligne » → empêche l'injection d'en-têtes e-mail
 *    (CRLF injection) lorsque l'e-mail / le nom sont réutilisés ;
 *  - format d'e-mail validé (le motif rejette tout espace, donc tout CR/LF).
 *
 * Le rendu React échappe déjà le HTML : aucune valeur n'est réinjectée en tant
 * que markup, ce qui neutralise les tentatives de XSS stocké / réfléchi.
 */

/** Sujets autorisés (clé technique → libellé affiché). Source unique. */
export const CONTACT_SUBJECTS = {
  support: "Support technique",
  sales: "Question commerciale",
  other: "Autre demande",
} as const;

/** Clé de sujet valide. */
export type ContactSubject = keyof typeof CONTACT_SUBJECTS;

/** Bornes de longueur (caractères). */
export const LIMITS = {
  nameMin: 2,
  nameMax: 100,
  emailMax: 254, // longueur maximale d'une adresse e-mail (RFC 5321)
  messageMin: 10,
  messageMax: 5000,
} as const;

/** Données validées, prêtes à être transmises au transport e-mail. */
export type ContactData = {
  name: string;
  email: string;
  subject: ContactSubject;
  message: string;
};

/** Erreurs par champ (libellés en français, prêts à afficher). */
export type ContactFieldErrors = Partial<Record<keyof ContactData, string>>;

/** Résultat de validation : succès typé ou erreurs par champ. */
export type ValidationResult =
  | { success: true; data: ContactData }
  | { success: false; errors: ContactFieldErrors };

// Codes des sauts de ligne et tabulation, conservés dans le message multi-ligne.
const TAB = 0x09;
const LINE_FEED = 0x0a;

/**
 * Indique si un point de code est un caractère de contrôle (plage C0
 * U+0000–U+001F, DEL U+007F, ou C1 U+0080–U+009F). On filtre par code plutôt
 * que par regex pour ne jamais manipuler d'octet de contrôle dans le source.
 */
function isControl(code: number): boolean {
  return code <= 0x1f || (code >= 0x7f && code <= 0x9f);
}

/**
 * Retire tous les caractères de contrôle d'un champ « une ligne » (CR/LF
 * compris → anti-injection d'en-têtes e-mail) puis normalise les espaces.
 */
function cleanSingleLine(value: string): string {
  let out = "";
  for (const ch of value) {
    out += isControl(ch.codePointAt(0) ?? 0) ? " " : ch;
  }
  return out.replace(/\s+/g, " ").trim();
}

/**
 * Nettoie un champ multi-ligne (le message) : normalise les fins de ligne en
 * `\n`, conserve les retours à la ligne et les tabulations, retire les autres
 * caractères de contrôle.
 */
function cleanMultiLine(value: string): string {
  const normalized = value.replace(/\r\n?/g, "\n");
  let out = "";
  for (const ch of normalized) {
    const code = ch.codePointAt(0) ?? 0;
    if (isControl(code) && code !== LINE_FEED && code !== TAB) continue;
    out += ch;
  }
  return out.trim();
}

/** Récupère une valeur de champ sous forme de chaîne (FormData → string). */
function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

/**
 * Valide et assainit les champs bruts du formulaire de contact.
 *
 * @param raw Données issues du `FormData` (toujours considérées hostiles).
 * @returns Données nettoyées et typées, ou les erreurs par champ.
 */
export function validateContact(raw: {
  name: FormDataEntryValue | null;
  email: FormDataEntryValue | null;
  subject: FormDataEntryValue | null;
  message: FormDataEntryValue | null;
}): ValidationResult {
  const errors: ContactFieldErrors = {};

  const name = cleanSingleLine(asString(raw.name));
  const email = cleanSingleLine(asString(raw.email)).toLowerCase();
  const subjectRaw = cleanSingleLine(asString(raw.subject));
  const message = cleanMultiLine(asString(raw.message));

  // Nom
  if (name.length < LIMITS.nameMin) {
    errors.name = "Veuillez indiquer votre nom complet.";
  } else if (name.length > LIMITS.nameMax) {
    errors.name = `Le nom ne doit pas dépasser ${LIMITS.nameMax} caractères.`;
  }

  // E-mail : motif simple mais sûr (aucun espace → aucun CR/LF possible).
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email.length === 0) {
    errors.email = "Veuillez indiquer votre adresse e-mail.";
  } else if (email.length > LIMITS.emailMax || !emailPattern.test(email)) {
    errors.email = "Cette adresse e-mail n'est pas valide.";
  }

  // Sujet : liste blanche stricte.
  if (!(subjectRaw in CONTACT_SUBJECTS)) {
    errors.subject = "Veuillez sélectionner un sujet.";
  }

  // Message
  if (message.length < LIMITS.messageMin) {
    errors.message = `Votre message doit contenir au moins ${LIMITS.messageMin} caractères.`;
  } else if (message.length > LIMITS.messageMax) {
    errors.message = `Votre message ne doit pas dépasser ${LIMITS.messageMax} caractères.`;
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name,
      email,
      subject: subjectRaw as ContactSubject,
      message,
    },
  };
}
