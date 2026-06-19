import type { Metadata } from "next";
import LegalLayout, { Placeholder } from "@/components/legal/LegalLayout";

/**
 * Métadonnées SEO de la page « Mentions légales ».
 */
export const metadata: Metadata = {
  title: "Provi — Mentions légales",
  description:
    "Mentions légales de Provi : identité de l'éditeur, hébergement et conditions d'utilisation du site.",
};

/** Date de dernière mise à jour (statique, à actualiser à chaque révision). */
const LAST_UPDATED = "19 juin 2026";

/**
 * Page « Mentions légales » (obligatoire — article 6 III de la loi n° 2004-575
 * du 21 juin 2004 pour la confiance dans l'économie numérique, dite « LCEN »).
 *
 * Server Component statique. Les informations propres à la société (capital,
 * RCS, SIRET, n° de TVA, directeur de la publication) ainsi que les coordonnées
 * de l'hébergeur sont laissées en {@link Placeholder} : elles doivent être
 * renseignées avant mise en ligne.
 */
export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales" lastUpdated={LAST_UPDATED}>
      <p>
        Conformément à l&apos;article 6, III, de la loi n° 2004-575 du 21 juin
        2004 pour la confiance dans l&apos;économie numérique (LCEN), il est
        précisé aux utilisateurs du site l&apos;identité des différents
        intervenants dans le cadre de sa réalisation et de son suivi.
      </p>

      <h2>1. Éditeur du site</h2>
      <p>Le présent site est édité par :</p>
      <ul>
        <li>
          <strong>Raison sociale :</strong> Provi SAS
        </li>
        <li>
          <strong>Forme juridique :</strong> société par actions simplifiée
          (SAS)
        </li>
        <li>
          <strong>Capital social :</strong>{" "}
          <Placeholder>montant du capital social en euros</Placeholder>
        </li>
        <li>
          <strong>Siège social :</strong> 25 route de la Gleyzette,{" "}
          <Placeholder>code postal</Placeholder> Lacroix-Falgarde, France
        </li>
        <li>
          <strong>RCS :</strong>{" "}
          <Placeholder>ville et numéro d&apos;immatriculation (RCS)</Placeholder>
        </li>
        <li>
          <strong>Numéro SIRET :</strong> <Placeholder>numéro SIRET</Placeholder>
        </li>
        <li>
          <strong>N° de TVA intracommunautaire :</strong>{" "}
          <Placeholder>numéro de TVA intracommunautaire</Placeholder>
        </li>
        <li>
          <strong>Adresse e-mail :</strong>{" "}
          <a href="mailto:contact@provi.com">contact@provi.com</a>
        </li>
        <li>
          <strong>Téléphone :</strong> +33 1 23 45 67 89
        </li>
      </ul>

      <h2>2. Directeur de la publication</h2>
      <p>
        Le directeur de la publication est{" "}
        <Placeholder>
          nom et qualité du représentant légal (ex. président de Provi SAS)
        </Placeholder>
        .
      </p>

      <h2>3. Hébergement du site</h2>
      <p>Le site est hébergé par :</p>
      <ul>
        <li>
          <strong>Hébergeur :</strong>{" "}
          <Placeholder>raison sociale de l&apos;hébergeur</Placeholder>
        </li>
        <li>
          <strong>Adresse :</strong>{" "}
          <Placeholder>adresse postale de l&apos;hébergeur</Placeholder>
        </li>
        <li>
          <strong>Téléphone :</strong>{" "}
          <Placeholder>téléphone de l&apos;hébergeur</Placeholder>
        </li>
      </ul>

      <h2>4. Hébergement des instances clients</h2>
      <p>
        Le service Provi met à disposition de chaque client une instance ERP/CRM
        dédiée, accessible via un sous-domaine (par exemple{" "}
        <code>votre-entreprise.pichinov.fr</code>). Les instances et les données
        qu&apos;elles contiennent sont hébergées par{" "}
        <Placeholder>
          raison sociale, adresse et pays de l&apos;hébergeur des instances
        </Placeholder>
        . La localisation des données est précisée dans notre{" "}
        <a href="/politique-de-confidentialite">
          politique de confidentialité
        </a>
        .
      </p>

      <h2>5. Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments composant le site (structure, textes,
        logos, marques, graphismes, illustrations, code source) est la propriété
        exclusive de Provi SAS ou de ses partenaires, et est protégé par le droit
        de la propriété intellectuelle. Toute reproduction, représentation,
        modification ou exploitation, totale ou partielle, sans autorisation
        écrite préalable de Provi SAS est interdite et constitue une contrefaçon.
      </p>
      <p>
        La solution est notamment bâtie sur des logiciels libres (dont le
        progiciel de gestion Dolibarr ERP/CRM), distribués sous leurs licences
        respectives, dont les droits demeurent ceux de leurs auteurs.
      </p>

      <h2>6. Responsabilité et liens hypertextes</h2>
      <p>
        Provi SAS s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à
        jour des informations diffusées sur le site, sans pouvoir en garantir
        l&apos;exhaustivité. Le site peut contenir des liens vers des sites
        tiers : Provi SAS n&apos;exerce aucun contrôle sur ces ressources et
        décline toute responsabilité quant à leur contenu.
      </p>

      <h2>7. Contact</h2>
      <p>
        Pour toute question relative au site ou aux présentes mentions légales,
        vous pouvez nous écrire à{" "}
        <a href="mailto:contact@provi.com">contact@provi.com</a> ou via notre{" "}
        <a href="/contact">page Contact</a>.
      </p>
    </LegalLayout>
  );
}
