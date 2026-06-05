import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SubdomainField from "./SubdomainField";

/**
 * Test unitaire de la vérification du sous-domaine (US 5.2).
 *
 * Critère d'acceptation (CLAUDE.md) : « un test unitaire (Jest + RTL) valide le
 * comportement de la vérification de sous-domaine ». On simule la réponse de
 * l'API (`fetch` mocké) et on vérifie l'indicateur visuel disponible / indisponible.
 */

/** Petit composant hôte qui gère l'état contrôlé du champ. */
function Harness() {
  const [value, setValue] = useState("");
  return (
    <SubdomainField
      value={value}
      onValueChange={setValue}
      onResult={() => {}}
      domain="pichinov.fr"
    />
  );
}

/** Remplace `fetch` par une réponse simulée fixe. */
function mockFetch(response: {
  subdomain: string;
  available: boolean;
  reason: string | null;
}) {
  global.fetch = jest.fn().mockResolvedValue({
    json: async () => response,
  }) as unknown as typeof fetch;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("SubdomainField — vérification du sous-domaine (US 5.2)", () => {
  it("affiche l'aperçu de l'URL en slugifiant la raison sociale", async () => {
    mockFetch({ subdomain: "ma-boite", available: true, reason: null });
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText(/raison sociale/i), "Ma Boîte");

    expect(screen.getByText("ma-boite.pichinov.fr")).toBeInTheDocument();
  });

  it("indique « disponible » lorsque l'API renvoie available=true", async () => {
    mockFetch({ subdomain: "ma-boite", available: true, reason: null });
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText(/raison sociale/i), "Ma Boîte");

    // Indicateur vert (le debounce + la réponse simulée se résolvent < 1 s).
    expect(await screen.findByText("Sous-domaine disponible")).toBeInTheDocument();
  });

  it("indique l'indisponibilité (rouge) lorsque l'API renvoie available=false", async () => {
    mockFetch({
      subdomain: "demo",
      available: false,
      reason: "Ce sous-domaine est déjà pris.",
    });
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText(/raison sociale/i), "Demo");

    expect(await screen.findByText(/déjà pris/i)).toBeInTheDocument();
  });

  it("ne lance aucune requête tant que le champ est vide", () => {
    mockFetch({ subdomain: "", available: false, reason: null });
    render(<Harness />);

    expect(global.fetch).not.toHaveBeenCalled();
  });
});