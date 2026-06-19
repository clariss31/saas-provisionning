import Image, { type StaticImageData } from "next/image";
import pichinov from "./images/pichinov.png";
import pichisoft from "./images/pichisoft.png";
import progiseize from "./images/projiseize.png";
import ridinFamily from "./images/ridin-family.png";
import crewkerz from "./images/crewkerz.png";
import seriousConnection from "./images/serious-connection.png";

/** Logo client mis en avant comme preuve sociale. */
type Brand = {
  /** Nom de la marque (sert d'alternative textuelle). */
  name: string;
  logo: StaticImageData;
  /**
   * Hauteur d'affichage. On normalise par la hauteur, mais les logos n'ayant
   * pas le même ratio/densité, on ajuste au cas par cas (un badge compact comme
   * « Serious » a besoin de plus de hauteur qu'un wordmark large).
   */
  heightClass: string;
};

const BRANDS: Brand[] = [
  { name: "Pichinov", logo: pichinov, heightClass: "h-11" },
  { name: "Pichisoft", logo: pichisoft, heightClass: "h-11" },
  { name: "Progiseize", logo: progiseize, heightClass: "h-10" },
  { name: "Ridin' Family", logo: ridinFamily, heightClass: "h-11" },
  { name: "Crewkerz", logo: crewkerz, heightClass: "h-11" },
  { name: "Serious Connection", logo: seriousConnection, heightClass: "h-14" },
];

/**
 * Bandeau de preuve sociale : logos clients.
 *
 * Rendu côté serveur (statique). Les logos sont affichés **en couleur et pleine
 * opacité** (pas d'effet niveaux-de-gris/survol : on évite tout signal porté
 * uniquement par la couleur ou le survol, et on préserve la lisibilité). Chaque
 * logo porte un `alt` (nom de la marque) et est servi optimisé via `next/image`.
 *
 * Deux mises en page selon la largeur :
 *  - **≥ sm** : grille centrée qui se replie sur plusieurs lignes (statique) ;
 *  - **mobile** : bande à défilement horizontal automatique (marquee CSS), pour
 *    éviter une longue pile verticale. La piste est dupliquée pour une boucle
 *    continue ; le second jeu est masqué aux lecteurs d'écran (`aria-hidden`).
 */
export default function SocialProof() {
  return (
    <section
      aria-label="Ils nous font confiance"
      className="border-b border-border-light bg-surface px-6 py-14 sm:px-10 md:px-16"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center">
        <p className="mb-10 text-center text-[11px] font-bold tracking-[0.6px] text-soft uppercase">
          Ils nous font confiance
        </p>

        {/* ≥ sm : grille centrée statique */}
        <ul className="hidden flex-wrap items-center justify-center gap-x-12 gap-y-8 sm:flex">
          {BRANDS.map((brand) => (
            <li key={brand.name} className="flex items-center">
              <Image
                src={brand.logo}
                alt={brand.name}
                className={`${brand.heightClass} w-auto`}
              />
            </li>
          ))}
        </ul>

        {/* Mobile : défilement horizontal automatique */}
        <div className="social-marquee-viewport w-full overflow-hidden sm:hidden">
          <ul className="social-marquee-track flex w-max items-center">
            {/* Premier jeu : logos réels (lus par les lecteurs d'écran). */}
            {BRANDS.map((brand) => (
              <li key={brand.name} className="mr-12 flex shrink-0 items-center">
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  className={`${brand.heightClass} w-auto`}
                />
              </li>
            ))}
            {/* Second jeu : copie décorative pour une boucle continue. */}
            {BRANDS.map((brand) => (
              <li
                key={`dup-${brand.name}`}
                aria-hidden="true"
                className="mr-12 flex shrink-0 items-center"
              >
                <Image src={brand.logo} alt="" className={`${brand.heightClass} w-auto`} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}