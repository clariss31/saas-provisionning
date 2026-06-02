import { validateContact, LIMITS } from "./validation";

/** Caractères de contrôle construits par code (jamais de littéral dans le source). */
const NUL = String.fromCharCode(0);
const TAB = String.fromCharCode(9);

/** Construit un jeu de champs valide, surchargeable champ par champ. */
function buildFields(overrides: Partial<Record<string, string>> = {}) {
  return {
    name: "Jean Dupont",
    email: "jean.dupont@example.com",
    subject: "support",
    message: "Bonjour, j'aimerais en savoir plus sur vos offres.",
    ...overrides,
  };
}

describe("validateContact — validation et sécurité du formulaire de contact", () => {
  it("accepte un message valide et normalise les valeurs", () => {
    const result = validateContact(
      buildFields({
        name: "  Jean Dupont  ",
        email: "Jean.Dupont@Example.com",
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Jean Dupont"); // espaces normalisés
      expect(result.data.email).toBe("jean.dupont@example.com"); // minuscules
      expect(result.data.subject).toBe("support");
    }
  });

  it("rejette un sujet hors de la liste blanche", () => {
    const result = validateContact(buildFields({ subject: "<script>" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.subject).toBeDefined();
    }
  });

  it("bloque l'injection d'en-têtes e-mail (CRLF dans l'adresse)", () => {
    const result = validateContact(
      buildFields({ email: "victime@example.com\r\nBcc: attaquant@evil.com" }),
    );

    // Les CR/LF sont retirés → l'adresse contient des espaces → motif invalide.
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.email).toBeDefined();
    }
  });

  it("retire les caractères de contrôle du nom (champ une ligne)", () => {
    const result = validateContact(buildFields({ name: `John${TAB}Doe` }));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("John Doe");
    }
  });

  it("préserve les retours à la ligne du message mais retire les autres contrôles", () => {
    const result = validateContact(
      buildFields({ message: `Première ligne\nSeconde${NUL} ligne du message` }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toContain("\n"); // saut de ligne conservé
      expect(result.data.message).not.toContain(NUL); // NUL retiré
      expect(result.data.message).toContain("Seconde ligne");
    }
  });

  it("conserve le texte tel quel (l'échappement anti-XSS est fait au rendu par React)", () => {
    const payload = "<script>alert('xss')</script> merci d'avance";
    const result = validateContact(buildFields({ message: payload }));

    expect(result.success).toBe(true);
    if (result.success) {
      // La validation ne mutile pas le contenu : la défense XSS repose sur
      // l'échappement automatique de React et l'e-mail en texte brut.
      expect(result.data.message).toBe(payload);
    }
  });

  it("refuse un message trop court", () => {
    const result = validateContact(buildFields({ message: "court" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.message).toBeDefined();
    }
  });

  it("refuse un message trop long", () => {
    const result = validateContact(
      buildFields({ message: "a".repeat(LIMITS.messageMax + 1) }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.message).toBeDefined();
    }
  });

  it("exige un nom et une adresse e-mail valides", () => {
    const result = validateContact(
      buildFields({ name: "", email: "pas-un-email" }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBeDefined();
    }
  });
});
