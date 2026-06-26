import {
  mapSearchResult,
  deriveManager,
  deriveLegalForm,
  firstVatNumber,
  type RawCompany,
} from "./company";

/**
 * Tests du mapping des résultats de l'API Recherche d'entreprises (SIRENE).
 * Fixture inspirée d'un vrai résultat (`PROGISEIZE`).
 */

const PROGISEIZE: RawCompany = {
  siren: "838722379",
  nom_complet: "PROGISEIZE",
  nom_raison_sociale: "PROGISEIZE",
  nature_juridique: "5710", // SAS → code Dolibarr « 57 »
  categorie_entreprise: "PME",
  complements: { tva: ["FR12838722379"] },
  siege: {
    siret: "83872237900032",
    adresse: "12 RUE DENIS PAPIN 16160 GOND-PONTOUVRE",
    numero_voie: "12",
    type_voie: "RUE",
    libelle_voie: "DENIS PAPIN",
    code_postal: "16160",
    libelle_commune: "GOND-PONTOUVRE",
    activite_principale: "62.02A",
  },
  dirigeants: [
    {
      nom: "DAMHET",
      prenoms: "ANTHONY ANDRE CHARLES",
      qualite: "Président de SAS",
      type_dirigeant: "personne physique",
    },
  ],
};

describe("mapSearchResult", () => {
  it("normalise un résultat complet via le siège", () => {
    expect(mapSearchResult(PROGISEIZE)).toEqual({
      siren: "838722379",
      name: "PROGISEIZE",
      siret: "83872237900032",
      address: "12 RUE DENIS PAPIN", // numéro + type + libellé (sans CP/ville)
      zip: "16160",
      town: "GOND-PONTOUVRE",
      naf: "62.02A",
      legalForm: "57", // 2 premiers chiffres de nature_juridique
      tvaIntra: "FR12838722379",
      manager: "Anthony Damhet",
    });
  });

  it("retombe sur nom_raison_sociale et siege.adresse si besoin", () => {
    const raw: RawCompany = {
      siren: "111222333",
      nom_raison_sociale: "ACME",
      siege: { siret: "11122233300011", adresse: "1 PLACE TEST 75001 PARIS" },
    };
    const out = mapSearchResult(raw);
    expect(out.name).toBe("ACME");
    expect(out.address).toBe("1 PLACE TEST 75001 PARIS");
    expect(out.legalForm).toBe("");
    expect(out.tvaIntra).toBe("");
    expect(out.manager).toBeNull();
  });
});

describe("deriveManager", () => {
  it("retient le premier dirigeant personne physique (Prénom Nom, casse de titre)", () => {
    expect(deriveManager(PROGISEIZE)).toBe("Anthony Damhet");
  });

  it("gère les noms composés (tirets)", () => {
    expect(
      deriveManager({
        dirigeants: [
          { nom: "DE LA TOUR", prenoms: "JEAN-PIERRE", type_dirigeant: "personne physique" },
        ],
      }),
    ).toBe("Jean-Pierre De La Tour");
  });

  it("renvoie null sans dirigeant personne physique", () => {
    expect(deriveManager({ dirigeants: [] })).toBeNull();
    expect(
      deriveManager({
        dirigeants: [{ nom: "HOLDING X", type_dirigeant: "personne morale" }],
      }),
    ).toBeNull();
    expect(deriveManager({})).toBeNull();
  });
});

describe("deriveLegalForm", () => {
  it("réduit le code INSEE 4 chiffres au code Dolibarr 2 chiffres", () => {
    expect(deriveLegalForm({ nature_juridique: "5710" })).toBe("57");
    expect(deriveLegalForm({ nature_juridique: "5499" })).toBe("54");
    expect(deriveLegalForm({ nature_juridique: "1000" })).toBe("10");
    expect(deriveLegalForm({ nature_juridique: "9220" })).toBe("92");
  });

  it("renvoie une chaîne vide si absent", () => {
    expect(deriveLegalForm({})).toBe("");
    expect(deriveLegalForm({ nature_juridique: "" })).toBe("");
  });
});

describe("firstVatNumber", () => {
  it("lit le 1er n° TVA, à la racine ou dans complements", () => {
    expect(firstVatNumber({ tva: ["FR123", "FR456"] })).toBe("FR123");
    expect(firstVatNumber({ complements: { tva: ["FR789"] } })).toBe("FR789");
  });

  it("renvoie une chaîne vide si aucun n° TVA", () => {
    expect(firstVatNumber({})).toBe("");
    expect(firstVatNumber({ complements: {} })).toBe("");
  });
});
