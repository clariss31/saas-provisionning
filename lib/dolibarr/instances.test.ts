import {
  serviceForJob,
  JOB_TO_SERVICE,
  DEFAULT_SERVICE_REF,
} from "./instances";

/**
 * Tests du mapping **métier (slug front `?job=`) → Service Sell Your SaaS** (Lot 8).
 * C'est ce mapping qui fait que la bonne config Dolibarr (le bon package = les bons
 * modules) est déployée selon le métier choisi dans le tunnel.
 */
describe("serviceForJob", () => {
  it("mappe chaque métier vers son service", () => {
    expect(serviceForJob("fleuriste")).toBe("Fleuriste");
    expect(serviceForJob("freelance")).toBe("Freelance");
    expect(serviceForJob("garagiste")).toBe("Garagiste");
    // ⚠️ Le slug front « artisan » correspond au service « ArtisanBTP ».
    expect(serviceForJob("artisan")).toBe("ArtisanBTP");
  });

  it("retombe sur le service par défaut si le métier est absent ou inconnu", () => {
    expect(serviceForJob(undefined)).toBe(DEFAULT_SERVICE_REF);
    expect(serviceForJob("")).toBe(DEFAULT_SERVICE_REF);
    expect(serviceForJob("inconnu")).toBe(DEFAULT_SERVICE_REF);
  });

  it("couvre exactement les 4 métiers du SPEC §1.3", () => {
    expect(Object.keys(JOB_TO_SERVICE).sort()).toEqual([
      "artisan",
      "fleuriste",
      "freelance",
      "garagiste",
    ]);
  });
});
