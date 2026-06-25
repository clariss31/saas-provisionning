import { slugify, validateSubdomain, SUBDOMAIN_LIMITS } from "./subdomain";

/**
 * Tests unitaires de la dérivation/validation du sous-domaine (US 5.2, volet
 * logique pur). Le comportement côté UI est couvert par `CompanySearchField.test.tsx`.
 */
describe("slugify", () => {
  it("met en minuscules et remplace les espaces par des tirets", () => {
    expect(slugify("Ma Boite")).toBe("ma-boite");
  });

  it("retire les accents sans insérer de tiret parasite", () => {
    expect(slugify("Café Brûlé")).toBe("cafe-brule");
    expect(slugify("Fleuriste Éloïse")).toBe("fleuriste-eloise");
  });

  it("fusionne les séparateurs et supprime les tirets de bordure", () => {
    expect(slugify("  --Atelier  &  Co--  ")).toBe("atelier-co");
  });

  it("retire les caractères spéciaux et la ponctuation", () => {
    expect(slugify("Garage O'Connor (24/7) !")).toBe("garage-o-connor-24-7");
  });

  it("renvoie une chaîne vide si aucun caractère alphanumérique", () => {
    expect(slugify("###")).toBe("");
  });

  it("tronque à la longueur maximale sans laisser de tiret final", () => {
    const long = "a".repeat(SUBDOMAIN_LIMITS.max + 10);
    expect(slugify(long)).toHaveLength(SUBDOMAIN_LIMITS.max);
    expect(slugify("mot ".repeat(20)).endsWith("-")).toBe(false);
  });
});

describe("validateSubdomain", () => {
  it("accepte un sous-domaine valide", () => {
    expect(validateSubdomain("ma-boite")).toBeNull();
  });

  it("rejette un sous-domaine trop court", () => {
    expect(validateSubdomain("ab")).toMatch(/au moins/);
  });

  it("rejette les mots réservés", () => {
    expect(validateSubdomain("admin")).toMatch(/réservé/);
    expect(validateSubdomain("www")).toMatch(/réservé/);
  });

  it("rejette un format invalide (tiret en bordure)", () => {
    expect(validateSubdomain("-boite")).toMatch(/Format invalide/);
  });
});