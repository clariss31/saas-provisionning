/**
 * Normalisation des résultats de l'API publique **Recherche d'entreprises**
 * (`recherche-entreprises.api.gouv.fr`, base SIRENE de l'INSEE).
 *
 * Module **pur** (aucun effet de bord, aucune dépendance) : utilisé côté serveur
 * par la route proxy [app/api/company/search/route.ts] pour transformer le gros
 * payload brut de l'API en une forme {@link CompanyResult} propre et typée, et
 * couvert par des tests unitaires.
 *
 * On s'appuie sur l'objet `siege` (établissement siège) pour l'adresse et le
 * SIRET — c'est ce que faisait déjà le « wizard SIRENE » du module Dolibarr
 * kaleido qui sert de référence. On ajoute en plus la **dérivation du dirigeant**
 * (que kaleido n'exploitait pas) pour se passer du champ « nom du gérant ».
 */

// ---------------------------------------------------------------------------
// Formes brutes renvoyées par l'API (partielles : seuls les champs utilisés).
// ---------------------------------------------------------------------------

/** Établissement siège, tel que renvoyé par l'API. */
type RawSiege = {
  siret?: string;
  adresse?: string;
  numero_voie?: string;
  type_voie?: string;
  libelle_voie?: string;
  code_postal?: string;
  libelle_commune?: string;
  activite_principale?: string;
};

/** Dirigeant (personne physique ou morale) renvoyé par l'API. */
type RawDirigeant = {
  nom?: string;
  prenoms?: string;
  qualite?: string;
  type_dirigeant?: string;
};

/** Un élément du tableau `results[]` de l'API. */
export type RawCompany = {
  siren?: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  adresse_complete?: string;
  nature_juridique?: string;
  categorie_entreprise?: string;
  siege?: RawSiege;
  dirigeants?: RawDirigeant[];
};

/** Réponse brute de l'endpoint `/search`. */
export type RawSearchResponse = { results?: RawCompany[] };

// ---------------------------------------------------------------------------
// Forme normalisée renvoyée au client.
// ---------------------------------------------------------------------------

/**
 * Entreprise normalisée, prête à pré-remplir le formulaire d'inscription.
 * Tous les champs sont des chaînes (jamais `null`/`undefined`) sauf `manager`,
 * volontairement `null` quand aucun dirigeant « personne physique » n'existe.
 */
export type CompanyResult = {
  /** Numéro SIREN (9 chiffres). */
  siren: string;
  /** Raison sociale / dénomination. */
  name: string;
  /** SIRET du siège (14 chiffres). */
  siret: string;
  /** Adresse de la voie du siège (numéro + type + libellé), sans CP ni ville. */
  address: string;
  /** Code postal du siège. */
  zip: string;
  /** Commune du siège. */
  town: string;
  /** Code APE/NAF de l'activité principale. */
  naf: string;
  /** Code de catégorie juridique INSEE (sert au pré-remplissage du statut). */
  natureJuridique: string;
  /** Nom du dirigeant déduit (« Prénom Nom »), ou `null` si indéterminable. */
  manager: string | null;
};

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

/** Garantit une chaîne nettoyée (trim) à partir d'une valeur potentiellement absente. */
function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Met une chaîne en « casse de titre » (l'API renvoie tout en MAJUSCULES).
 * Gère les séparateurs espace ET tiret (ex. « JEAN-PIERRE » → « Jean-Pierre »).
 */
function toTitleCase(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/(^|[\s-])([a-zà-ÿ])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

/**
 * Reconstruit l'adresse de la voie à partir des composants du siège.
 * Repli sur `siege.adresse` puis `adresse_complete` si les composants manquent
 * (ces replis contiennent CP + ville, mais valent mieux qu'une adresse vide).
 */
function formatAddress(raw: RawCompany): string {
  const siege = raw.siege ?? {};
  const street = [siege.numero_voie, siege.type_voie, siege.libelle_voie]
    .map(str)
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return street || str(siege.adresse) || str(raw.adresse_complete);
}

// ---------------------------------------------------------------------------
// API publique du module
// ---------------------------------------------------------------------------

/**
 * Déduit le nom du gérant à partir du tableau `dirigeants[]`.
 *
 * On retient le **premier dirigeant « personne physique »** et on compose
 * « Prénom Nom » : on ne garde que le premier prénom (l'API en liste parfois
 * plusieurs) et on remet le tout en casse de titre.
 *
 * @returns le nom formaté, ou `null` si aucun dirigeant personne physique.
 */
export function deriveManager(raw: RawCompany): string | null {
  const dirigeants = Array.isArray(raw.dirigeants) ? raw.dirigeants : [];
  const person = dirigeants.find((d) => d.type_dirigeant === "personne physique");
  if (!person) return null;

  const firstName = str(person.prenoms).split(/\s+/)[0] ?? "";
  const lastName = str(person.nom);
  const full = [firstName, lastName].filter(Boolean).join(" ");
  return full ? toTitleCase(full) : null;
}

/**
 * Transforme un résultat brut de l'API en {@link CompanyResult} normalisé.
 */
export function mapSearchResult(raw: RawCompany): CompanyResult {
  const siege = raw.siege ?? {};
  return {
    siren: str(raw.siren),
    name: str(raw.nom_complet) || str(raw.nom_raison_sociale),
    siret: str(siege.siret),
    address: formatAddress(raw),
    zip: str(siege.code_postal),
    town: str(siege.libelle_commune),
    naf: str(siege.activite_principale),
    natureJuridique: str(raw.nature_juridique),
    manager: deriveManager(raw),
  };
}

/**
 * Mappe un code de **catégorie juridique INSEE** (`nature_juridique`) vers l'un
 * des statuts proposés à l'étape « Fiscalité » du tunnel (cf. `LEGAL_STATUSES`
 * dans `InscriptionForm`). Best-effort, par préfixe de code :
 *  - `10xx` → entrepreneur individuel (`ei`) ;
 *  - `54xx` → SARL (inclut l'EURL, indissociable par ce code) ;
 *  - `57xx` → SAS (inclut la SASU) ;
 *  - `55xx` → SA.
 *
 * @returns le slug de statut, ou `""` si non déterminable (l'utilisateur choisit).
 */
export function mapNatureJuridiqueToLegalStatus(natureJuridique: string): string {
  const code = str(natureJuridique);
  if (code.startsWith("10")) return "ei";
  if (code.startsWith("54")) return "sarl";
  if (code.startsWith("57")) return "sas";
  if (code.startsWith("55")) return "sa";
  return "";
}