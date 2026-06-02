import type { Metadata } from "next";
import ContactInfo from "@/components/contact/ContactInfo";
import ContactForm from "@/components/contact/ContactForm";

/**
 * Métadonnées propres à la page « Contact » (SEO). Définies au niveau de la
 * page (Server Component) : elles sont injectées dans le HTML pré-rendu.
 */
export const metadata: Metadata = {
  title: "Provi — Contact",
  description:
    "Une question ? Contactez l'équipe Provi par email, téléphone ou via le formulaire. Nous vous répondons dans les plus brefs délais.",
};

/**
 * Page « Contact » (SPEC page 7, US 7.1).
 *
 * La colonne de gauche (coordonnées) est statique et rendue côté serveur ;
 * seul le formulaire embarque du JavaScript (validation + envoi via Server
 * Action). Le destinataire réel des messages est fixé côté serveur.
 */
export default function ContactPage() {
  return (
    // Fond violet clair (lavande) pleine largeur, sur toute la hauteur utile.
    <div className="min-h-full bg-content">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-12 sm:px-10 md:px-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          <ContactInfo />
          <div className="lg:w-[60%]">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
