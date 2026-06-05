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
        <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
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
      </div>
    </section>
  );
}