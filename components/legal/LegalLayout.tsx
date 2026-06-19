import type { ReactNode } from "react";

/**
 * Marqueur visuel d'un élément à compléter par l'éditeur (mention légale
 * obligatoire dont la valeur réelle n'est pas encore connue : capital social,
 * RCS, SIRET, coordonnées de l'hébergeur, DPO…).
 *
 * Rendu en texte sombre souligné en pointillés : bien repérable tout en
 * restant conforme au contraste (WCAG AA). À chercher via « À compléter ».
 */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <strong className="font-semibold text-text underline decoration-dotted underline-offset-2">
      [À compléter : {children}]
    </strong>
  );
}

type Props = {
  /** Titre principal de la page (rendu en `<h1>`). */
  title: string;
  /** Date de dernière mise à jour, déjà formatée (ex. « 19 juin 2026 »). */
  lastUpdated: string;
  /** Contenu en HTML sémantique (`h2`, `h3`, `p`, `ul`…). */
  children: ReactNode;
};

/**
 * Gabarit commun aux pages légales (mentions légales, politique de
 * confidentialité).
 *
 * Il fournit le cadre lavande, une carte blanche lisible et une typographie
 * « prose » homogène appliquée aux balises sémantiques enfants via des
 * variantes Tailwind (`[&_h2]:…`). Le contenu des pages reste ainsi du HTML
 * simple, sans classes répétées sur chaque balise.
 *
 * Server Component : 100 % statique (rendu côté serveur), conforme aux
 * exigences de performance (peu de JS) et d'accessibilité (hiérarchie de
 * titres correcte, contrastes validés).
 */
export default function LegalLayout({ title, lastUpdated, children }: Props) {
  return (
    <div className="min-h-full bg-content">
      <div className="mx-auto w-full max-w-[820px] px-6 py-16 sm:px-10">
        <header className="mb-8">
          <h1 className="text-[32px] font-bold tracking-tight text-text sm:text-[38px]">
            {title}
          </h1>
          <p className="mt-3 text-[13px] text-soft">
            Dernière mise à jour : {lastUpdated}
          </p>
        </header>

        {/* La typographie est portée par des variantes ciblant les balises
            enfants : titres en `text-text`, corps en `text-soft` (≥ 4.5:1 sur
            blanc), liens en `accent-dark`. Le premier élément voit sa marge
            haute neutralisée pour coller au padding de la carte. */}
        <article
          className="rounded-3xl border border-border-light bg-surface p-8 text-[14px] leading-relaxed text-soft shadow-card sm:p-10 [&>*:first-child]:mt-0 [&_a:hover]:text-accent [&_a]:font-medium [&_a]:text-accent-dark [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-content [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:text-text [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-[19px] [&_h2]:font-bold [&_h2]:text-text [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-text [&_li]:mb-1.5 [&_p]:mb-4 [&_strong]:font-semibold [&_strong]:text-text [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5"
        >
          {children}
        </article>
      </div>
    </div>
  );
}
