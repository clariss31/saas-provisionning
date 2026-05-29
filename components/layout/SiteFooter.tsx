import Link from "next/link";
import Logo from "./Logo";

type FooterColumn = {
  title: string;
  links: { label: string; href: string }[];
};

const COLUMNS: FooterColumn[] = [
  {
    title: "Produit",
    links: [
      { label: "Tarifs", href: "/tarifs" },
      { label: "Fonctionnalités", href: "/fonctionnalites" },
      { label: "Sécurité", href: "/fonctionnalites#securite" },
    ],
  },
  {
    title: "Légal & Contact",
    links: [
      { label: "CGU", href: "#" },
      { label: "Confidentialité", href: "#" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

/** Pied de page des pages vitrines : marque + colonnes de liens. */
export default function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-border-light bg-surface px-16 py-12">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-3">
        {/* Colonne marque */}
        <div className="flex flex-col items-start space-y-4">
          <Logo size={24} wordmarkClassName="text-[18px]" />
          <p className="max-w-xs text-[11.5px] leading-4 text-soft">
            © 2026 Provi SAS. Fabriqué avec passion pour les artisans et
            indépendants.
          </p>
        </div>

        {/* Colonnes de liens */}
        {COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-col space-y-3">
            <span className="mb-1 text-[12.5px] font-medium text-text">
              {column.title}
            </span>
            {column.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[11.5px] text-soft transition-colors hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
