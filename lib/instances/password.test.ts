import { scorePassword, PASSWORD_MIN_LENGTH } from "./password";

/** Tests unitaires de la jauge de robustesse du mot de passe. */
describe("scorePassword", () => {
  it("juge un mot de passe vide non acceptable", () => {
    const r = scorePassword("");
    expect(r.score).toBe(0);
    expect(r.acceptable).toBe(false);
  });

  it("refuse un mot de passe trop court même varié", () => {
    expect(scorePassword("Aa1!").acceptable).toBe(false);
  });

  it("accepte un mot de passe d'au moins 8 caractères avec un chiffre", () => {
    const r = scorePassword("motdepasse1");
    expect(r.acceptable).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(2);
  });

  it("attribue le score maximal à un mot de passe long et varié", () => {
    const r = scorePassword("Sup3r-MotDePasse!");
    expect(r.score).toBe(4);
    expect(r.label).toBe("Excellent");
  });

  it("expose une longueur minimale cohérente", () => {
    expect(scorePassword("a".repeat(PASSWORD_MIN_LENGTH - 1)).acceptable).toBe(false);
  });
});