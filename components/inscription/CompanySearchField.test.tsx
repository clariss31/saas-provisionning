import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompanySearchField from "./CompanySearchField";
import type { CompanyResult } from "@/lib/instances/company";

/**
 * Tests du champ de recherche d'entreprise.
 *
 * Couvre **US 5.2** (vérification de disponibilité du sous-domaine, critère
 * d'acceptation obligatoire de CLAUDE.md — repris de l'ancien `SubdomainField`)
 * ET le comportement de recherche/auto-remplissage SIRENE.
 *
 * `fetch` est mocké **selon l'URL** : `/api/subdomain/check` et
 * `/api/company/search` répondent chacun leur forme.
 */

type SubdomainResponse = { subdomain: string; available: boolean; reason: string | null };

const PROGISEIZE: CompanyResult = {
  siren: "838722379",
  name: "PROGISEIZE",
  siret: "83872237900032",
  address: "12 RUE DENIS PAPIN",
  zip: "16160",
  town: "GOND-PONTOUVRE",
  naf: "62.02A",
  natureJuridique: "5710",
  manager: "Anthony Damhet",
};

/** Mocke `fetch` en aiguillant selon l'endpoint appelé. */
function mockFetch(opts: {
  subdomain: SubdomainResponse;
  companies?: CompanyResult[];
}) {
  global.fetch = jest.fn((input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    const body = url.includes("/api/company/search")
      ? { results: opts.companies ?? [] }
      : opts.subdomain;
    return Promise.resolve({ json: async () => body });
  }) as unknown as typeof fetch;
}

/** Hôte gérant l'état contrôlé du champ. */
function Harness({ onSelect }: { onSelect?: (c: CompanyResult) => void }) {
  const [value, setValue] = useState("");
  return (
    <CompanySearchField
      value={value}
      onValueChange={setValue}
      onSelect={onSelect ?? (() => {})}
      onSubdomainStatus={() => {}}
      domain="pichinov.fr"
    />
  );
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("CompanySearchField — disponibilité du sous-domaine (US 5.2)", () => {
  it("affiche l'aperçu de l'URL en slugifiant la raison sociale", async () => {
    mockFetch({ subdomain: { subdomain: "ma-boite", available: true, reason: null } });
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText(/raison sociale/i), "Ma Boîte");

    expect(screen.getByText("ma-boite.pichinov.fr")).toBeInTheDocument();
  });

  it("indique « disponible » lorsque l'API renvoie available=true", async () => {
    mockFetch({ subdomain: { subdomain: "ma-boite", available: true, reason: null } });
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText(/raison sociale/i), "Ma Boîte");

    expect(await screen.findByText("Sous-domaine disponible")).toBeInTheDocument();
  });

  it("indique l'indisponibilité lorsque l'API renvoie available=false", async () => {
    mockFetch({
      subdomain: { subdomain: "demo", available: false, reason: "Ce sous-domaine est déjà pris." },
    });
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText(/raison sociale/i), "Demo");

    expect(await screen.findByText(/déjà pris/i)).toBeInTheDocument();
  });

  it("ne lance aucune requête tant que le champ est vide", () => {
    mockFetch({ subdomain: { subdomain: "", available: false, reason: null } });
    render(<Harness />);

    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("CompanySearchField — recherche & auto-remplissage SIRENE", () => {
  it("affiche les suggestions et remonte l'entreprise choisie à la sélection", async () => {
    mockFetch({
      subdomain: { subdomain: "progiseize", available: true, reason: null },
      companies: [PROGISEIZE],
    });
    const onSelect = jest.fn();
    const user = userEvent.setup();
    render(<Harness onSelect={onSelect} />);

    const input = screen.getByLabelText(/raison sociale/i);
    await user.type(input, "progiseize");

    // La suggestion apparaît (après debounce) puis on la sélectionne.
    const option = await screen.findByText("PROGISEIZE");
    await user.click(option);

    expect(onSelect).toHaveBeenCalledWith(PROGISEIZE);
    // Le nom sélectionné remplace la saisie dans le champ.
    expect(input).toHaveValue("PROGISEIZE");
  });
});