import Image, { type StaticImageData } from "next/image";
import Icon, { type IconName } from "@/components/ui/Icon";
import gestionProjets from "./images/gestion-projets.png";
import tableauCommercial from "./images/tableau-commercial.png";

/** Une rangée de démonstration (texte + visuel inclinable). */
type ShowcaseRow = {
  icon: IconName;
  title: string;
  description: string;
  /** Points clés cochés sous le paragraphe. */
  bullets: string[];
  image: StaticImageData;
  /** Texte alternatif de la capture (porteur de sens, pas décoratif). */
  imageAlt: string;
  /** Inverse l'ordre (visuel à gauche) sur grand écran. */
  reversed?: boolean;
};

/** Les deux rangées présentant les fonctionnalités phares de la plateforme. */
const ROWS: ShowcaseRow[] = [
  {
    icon: "rocket",
    title: "Gérez vos missions comme un pro",
    description:
      "Notre interface Kanban moderne vous permet de suivre l'avancement de chaque chantier d'un simple glisser-déposer. Ajoutez des notes, des photos et communiquez avec vos clients directement depuis la carte de mission.",
    bullets: ["Glisser-déposer intuitif", "Notifications en temps réel"],
    image: gestionProjets,
    imageAlt:
      "Écran de gestion des projets Provi : liste des affaires avec budget, responsables et état d'avancement.",
  },
  {
    icon: "banknote",
    title: "La fin des maux de tête comptables",
    description:
      "Créez des devis professionnels à votre image et transformez-les en factures en un clic. Notre système suit automatiquement les règlements et vous alerte en cas de retard.",
    bullets: ["Modèles personnalisables", "Relances automatiques"],
    image: tableauCommercial,
    imageAlt:
      "Tableau de bord commercial Provi : suivi des devis, du chiffre d'affaires et du pipeline de ventes.",
    reversed: true,
  },
];

/** Section vitrine : rangées texte / visuel alternées, sur fond blanc. */
export default function Showcase() {
  return (
    <section className="bg-surface px-6 py-24 sm:px-10 md:px-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-24 lg:gap-32">
        {ROWS.map((row) => (
          <div
            key={row.title}
            className={`flex flex-col items-center gap-12 lg:gap-16 ${
              row.reversed ? "lg:flex-row-reverse" : "lg:flex-row"
            }`}
          >
            {/* Discours */}
            <div className="flex flex-col items-start lg:w-1/2">
              <span className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light text-accent-dark shadow-sm">
                <Icon name={row.icon} size={24} />
              </span>
              <h2 className="mb-4 text-[24px] font-bold text-text">
                {row.title}
              </h2>
              <p className="mb-8 text-[16px] leading-relaxed text-soft">
                {row.description}
              </p>
              <ul className="flex flex-col gap-4">
                {row.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-center gap-3 text-[14.5px] text-text"
                  >
                    <Icon
                      name="check-circle"
                      size={22}
                      className="shrink-0 text-accent-dark"
                    />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            {/* Visuel incliné. Le tilt 3D n'est appliqué qu'à partir de `lg`
                pour éviter tout rognage sur mobile ; il se redresse au survol. */}
            <div className="relative w-full lg:w-1/2 lg:[perspective:1000px]">
              <div
                aria-hidden="true"
                className={`absolute inset-0 -z-10 translate-y-4 rounded-3xl bg-accent/10 ${
                  row.reversed ? "-translate-x-4" : "translate-x-4"
                }`}
              />
              <div
                className={`overflow-hidden rounded-2xl border border-border-light shadow-dropdown transition-transform duration-500 ease-out lg:hover:[transform:rotateY(0deg)_rotateX(0deg)] ${
                  row.reversed
                    ? "lg:[transform:rotateY(5deg)_rotateX(2deg)]"
                    : "lg:[transform:rotateY(-5deg)_rotateX(2deg)]"
                }`}
              >
                <Image
                  src={row.image}
                  alt={row.imageAlt}
                  placeholder="blur"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="h-auto w-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
