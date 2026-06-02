import Link from "next/link";
import type { ReactNode } from "react";
import Icon from "./Icon";

/** Apparence du bouton (cf. patterns de boutons de DESIGN.md). */
type Variant = "solid" | "soft" | "white";
/** Gabarit (hauteur + paddings) du bouton. */
type Size = "sm" | "md" | "lg";

type ButtonLinkProps = {
  /** Destination du lien (route interne ou ancre). */
  href: string;
  children: ReactNode;
  /** Variante visuelle. `solid` par défaut (aplat accent, texte blanc). */
  variant?: Variant;
  /** Gabarit. `md` par défaut. */
  size?: Size;
  /** Ajoute une flèche qui glisse vers la droite au survol. */
  withArrow?: boolean;
  /** Classes supplémentaires (ex. `w-full`). */
  className?: string;
};

/**
 * Lien stylé en bouton, partagé par toutes les sections de la vitrine.
 *
 * Centralise les trois variantes de la charte Kaleïdo afin d'éviter la
 * duplication de longues listes de classes. Les aplats pleins utilisent
 * `accent-dark` (#5348d5) pour garantir un contraste AA du texte blanc.
 */
export default function ButtonLink({
  href,
  children,
  variant = "solid",
  size = "md",
  withArrow = false,
  className = "",
}: ButtonLinkProps) {
  const sizeClasses: Record<Size, string> = {
    sm: "h-[38px] px-5 text-[13px]",
    md: "h-[44px] px-6 text-[14px]",
    lg: "h-[48px] px-8 text-[15px]",
  };

  const variantClasses: Record<Variant, string> = {
    solid:
      "bg-accent-dark text-white shadow-card hover:-translate-y-px hover:shadow-lift",
    soft: "bg-content text-accent-dark hover:bg-accent-light",
    white:
      "bg-white text-accent-dark shadow-card hover:-translate-y-px hover:shadow-lift",
  };

  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center rounded-lg font-medium transition-all ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
      {withArrow && (
        <Icon
          name="arrow-right"
          size={18}
          className="ml-2 transition-transform group-hover:translate-x-1"
        />
      )}
    </Link>
  );
}
