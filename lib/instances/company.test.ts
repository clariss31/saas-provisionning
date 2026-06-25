import {
  mapSearchResult,
  deriveManager,
  mapNatureJuridiqueToLegalStatus,
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
  nature_juridique: "5710",
  categorie_entreprise: "PME",
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
      natureJuridique: "5710",
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
    // Aucun composant de voie → repli sur l'adresse complète du siège.
    expect(out.address).toBe("1 PLACE TEST 75001 PARIS");
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

describe("mapNatureJuridiqueToLegalStatus", () => {
  it("mappe les familles de codes INSEE connues", () => {
    expect(mapNatureJuridiqueToLegalStatus("1000")).toBe("ei");
    expect(mapNatureJuridiqueToLegalStatus("5499")).toBe("sarl");
    expect(mapNatureJuridiqueToLegalStatus("5710")).toBe("sas");
    expect(mapNatureJuridiqueToLegalStatus("5599")).toBe("sa");
  });

  it("renvoie une chaîne vide si non déterminable", () => {
    expect(mapNatureJuridiqueToLegalStatus("9220")).toBe("");
    expect(mapNatureJuridiqueToLegalStatus("")).toBe("");
  });
});
