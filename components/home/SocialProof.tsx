/** Noms (fictifs) des clients mis en avant comme preuve sociale. */
const BRANDS = [
  "ArtisansCo",
  "FreePro",
  "BatiGest",
  "ComptaZen",
  "Studio42",
  "GaraTech",
];

/**
 * Bandeau de preuve sociale : logotypes textuels des clients.
 *
 * Rendu côté serveur (contenu statique). Les libellés passent en couleur au
 * survol du groupe pour un effet vivant, sans nuire à la lisibilité de base
 * (couleur `soft`, contraste AA).
 */
export default function SocialProof() {
  return (
    <section
      aria-label="Ils nous font confiance"
      className="border-b border-border-light bg-surface px-6 py-14 sm:px-10 md:px-16"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center">
        <p className="mb-8 text-center text-[11px] font-bold tracking-[0.6px] text-soft uppercase">
          Ils nous font confiance
        </p>
        <ul className="group flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {BRANDS.map((brand) => (
            <li
              key={brand}
              className="text-[22px] font-bold text-soft opacity-70 transition-all duration-500 group-hover:opacity-100"
            >
              {brand}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
