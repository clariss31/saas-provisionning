import type { ReactNode } from "react";

/**
 * Style « Modern » des contrôles de formulaire (cf. DESIGN.md — formulaire hero,
 * et maquette `docs/screen.png`) : hauteur 56px, bordure 1.5px, coins arrondis,
 * label violet en capitales posé sur la bordure supérieure.
 *
 * La couleur de bordure n'est pas incluse ici : chaque contrôle ajoute
 * `border-border focus:border-accent` (ou `border-danger` si invalide), pour
 * pouvoir refléter un état d'erreur.
 */
export const MODERN_CONTROL =
  "h-14 w-full rounded-xl border-[1.5px] bg-surface px-4 text-[15px] text-text placeholder:text-muted transition-all focus:outline-none focus:ring-2 focus:ring-accent-light";

type Props = {
  /** id du contrôle (lie le label au champ). */
  id: string;
  /** Libellé affiché en capitales sur la bordure. */
  label: string;
  /** `true` → label en rouge (champ invalide). */
  invalid?: boolean;
  /** Le contrôle (input / select) déjà stylé avec {@link MODERN_CONTROL}. */
  children: ReactNode;
};

/**
 * Enveloppe un contrôle « Modern » avec son label flottant, toujours posé sur la
 * bordure supérieure. Un fond `surface` derrière le label « coupe » la bordure
 * (effet champ outline du design system).
 */
export default function ModernField({ id, label, invalid, children }: Props) {
  return (
    <div className="relative">
      <label
        htmlFor={id}
        className={`absolute -top-2 left-3 z-10 bg-surface px-1.5 text-[11px] font-semibold uppercase tracking-wide ${
          invalid ? "text-danger" : "text-accent-dark"
        }`}
      >
        {label}
      </label>
      {children}
    </div>
  );
}