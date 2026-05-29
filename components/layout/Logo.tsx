import Link from "next/link";

type LogoProps = {
  /** Taille de l'icône en px (le wordmark s'adapte autour). */
  size?: number;
  /** Classe utilitaire pour la taille du wordmark « Provi ». */
  wordmarkClassName?: string;
};

/**
 * Marque Provi : icône « widgets » (grille 2×2, façon Material Symbols)
 * + wordmark, le tout teinté `accent`. Lien vers l'accueil.
 */
export default function Logo({
  size = 28,
  wordmarkClassName = "text-[20px]",
}: LogoProps) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 text-accent transition-opacity hover:opacity-80"
      aria-label="Provi — Accueil"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="shrink-0"
      >
        <path d="M13 13v8h8v-8h-8zM3 21h8v-8H3v8zM3 3v8h8V3H3zm13.66-1.31L11 7.34 16.66 13l5.66-5.66-5.66-5.65z" />
      </svg>
      <span className={`font-semibold tracking-tight ${wordmarkClassName}`}>
        Provi
      </span>
    </Link>
  );
}
