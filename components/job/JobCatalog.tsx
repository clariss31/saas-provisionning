import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import freelanceImg from "@/components/home/images/job-freelance.png";
import fleuristeImg from "@/components/home/images/job-fleuriste.png";
import garagisteImg from "@/components/home/images/job-garagiste.png";
import artisanImg from "@/components/home/images/job-artisan.png";

/** Une déclinaison métier proposée au catalogue (cf. SPEC §1.3). */
type Job = {
  /** Identifiant transmis au tunnel d'inscription (cf. SPEC `?job=`). */
  slug: string;
  title: string;
  description: string;
  /** Modules phares pré-activés pour ce métier (libellés courts). */
  modules: string[];
  image: StaticImageData;
};

/**
 * Les 4 profils types et leurs modules clés. Le `slug` est repris du paramètre
 * `?job=` attendu par le tunnel d'inscription, afin de pré-sélectionner le
 * template choisi.
 */
const JOBS: Job[] = [
  {
    slug: "freelance",
    title: "Freelance",
    description: "Pour les consultants, designers et développeurs.",
    modules: ["Devis", "Factures", "Temps"],
    image: freelanceImg,
  },
  {
    slug: "fleuriste",
    title: "Fleuriste",
    description: "Gestion de boutique et commandes spéciales.",
    modules: ["Stock", "Caisse", "Agenda"],
    image: fleuristeImg,
  },
  {
    slug: "garagiste",
    title: "Garagiste",
    description: "Ateliers de réparation et entretien auto.",
    modules: ["Rdv", "Pièces", "Agenda"],
    image: garagisteImg,
  },
  {
    slug: "artisan",
    title: "Artisan BTP",
    description: "Plombiers, électriciens, menuisiers…",
    modules: ["Chantiers", "Devis", "Acomptes"],
    image: artisanImg,
  },
];

/**
 * Grille du catalogue métiers.
 *
 * Rendue côté serveur (contenu statique). Choix d'accessibilité : la carte
 * entière n'est pas cliquable — seul le bouton « Sélectionner » est interactif
 * (un unique élément actionnable par carte, sans imbrication de liens). Le
 * survol de la carte (`group`) remplit le bouton, effet purement décoratif.
 * Le libellé du bouton est complété d'un suffixe lisible aux lecteurs d'écran
 * pour distinguer les quatre actions identiques.
 */
export default function JobCatalog() {
  return (
    <section aria-label="Catalogue des métiers">
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {JOBS.map((job) => (
          <li
            key={job.slug}
            className="group flex flex-col gap-6 rounded-2xl border border-border-light bg-surface p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
          >
            {/* Illustration décorative (le sens est porté par le titre). */}
            <div className="relative aspect-square w-full overflow-hidden rounded-[20px] bg-content">
              <Image
                src={job.image}
                alt=""
                placeholder="blur"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                fill
              />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-[15px] font-semibold text-text">
                {job.title}
              </h2>
              <p className="text-[13.5px] text-soft">{job.description}</p>
            </div>

            {/* Modules pré-activés. `mt-auto` aligne les listes de tags et les
                boutons sur une même ligne malgré des descriptions de longueurs
                variables. */}
            <ul className="mt-auto flex flex-wrap gap-2">
              {job.modules.map((module) => (
                <li
                  key={module}
                  className="rounded-md bg-accent-light px-2.5 py-1 text-[11.5px] font-medium text-accent-dark"
                >
                  {module}
                </li>
              ))}
            </ul>

            <Link
              href={`/inscription?job=${job.slug}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-accent-light text-[12.5px] font-medium text-accent-dark transition-colors group-hover:bg-accent group-hover:text-white"
            >
              Sélectionner
              <span className="sr-only"> le métier {job.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
