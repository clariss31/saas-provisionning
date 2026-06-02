import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pricing from "./Pricing";

/**
 * Test unitaire du sélecteur de périodicité (US 4.2).
 *
 * Vérifie le critère d'acceptation imposé par CLAUDE.md : « un test unitaire
 * (Jest + React Testing Library) valide le changement d'état du bouton
 * Toggle ». On contrôle la réactivité des prix (mensuel ↔ annuel, remise de
 * 20 %) et l'état ARIA `aria-pressed`, sans aucun rechargement.
 */
describe("Pricing — bascule Mensuel / Annuel (US 4.2)", () => {
  it("affiche les tarifs mensuels par défaut, le toggle « Mensuel » étant actif", () => {
    render(<Pricing />);

    expect(screen.getByText("10€")).toBeInTheDocument();
    expect(screen.getByText("50€")).toBeInTheDocument();
    expect(screen.getByText("100€")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Mensuel" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Annuel" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("applique la remise de 20 % et bascule l'état ARIA au clic sur « Annuel »", async () => {
    const user = userEvent.setup();
    render(<Pricing />);

    await user.click(screen.getByRole("button", { name: "Annuel" }));

    // 10 → 8, 50 → 40, 100 → 80 (−20 %, arrondi à l'euro).
    expect(screen.getByText("8€")).toBeInTheDocument();
    expect(screen.getByText("40€")).toBeInTheDocument();
    expect(screen.getByText("80€")).toBeInTheDocument();

    // Les tarifs mensuels ne sont plus affichés.
    expect(screen.queryByText("10€")).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Annuel" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Mensuel" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("revient aux tarifs mensuels au clic sur « Mensuel »", async () => {
    const user = userEvent.setup();
    render(<Pricing />);

    await user.click(screen.getByRole("button", { name: "Annuel" }));
    await user.click(screen.getByRole("button", { name: "Mensuel" }));

    expect(screen.getByText("10€")).toBeInTheDocument();
    expect(screen.getByText("50€")).toBeInTheDocument();
    expect(screen.getByText("100€")).toBeInTheDocument();
    expect(screen.queryByText("8€")).not.toBeInTheDocument();
  });
});
