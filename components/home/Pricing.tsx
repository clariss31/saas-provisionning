"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/ui/Icon";

/** Une ligne de caractéristique d'une offre. */
type PlanFeature = { label: string; included: boolean };

/** Une offre tarifaire. */
type Plan = {
  name: string;
  tagline: string;
  /** Prix mensuel de référence en euros (l'annuel applique −20%). */
  monthlyPrice: number;
  features: PlanFeature[];
  /** Libellé du bouton d'action. */
  cta: string;
  /** Destination du bouton (le métier sera choisi au catalogue). */
  href: string;
  /** Offre mise en avant visuellement. */
  highlighted?: boolean;
};

/**
 * Grille tarifaire unifiée (cf. SPEC §1.4 : 10 / 50 / 100 € par mois).
 * L'engagement annuel applique une remise de 20%.
 */
const PLANS: Plan[] = [
  {
    name: "Starter",
    tagline: "Pour les indépendants qui débutent.",
    monthlyPrice: 10,
    cta: "Démarrer l'essai gratuit",
    href: "/metiers",
    features: [
      { label: "1 utilisateur inclus", included: true },
      { label: "Facturation standard", included: true },
      { label: "Hébergement sécurisé", included: true },
      { label: "Multi-devises", included: false },
    ],
  },
  {
    name: "Professionnel",
    tagline: "L'équilibre parfait pour la croissance.",
    monthlyPrice: 50,
    cta: "Démarrer l'essai gratuit",
    href: "/metiers",
    highlighted: true,
    features: [
      { label: "Jusqu'à 5 utilisateurs", included: true },
      { label: "Gestion de stock avancée", included: true },
      { label: "Relances automatiques", included: true },
      { label: "Support prioritaire", included: true },
    ],
  },
  {
    name: "Premium",
    tagline: "Pour les entreprises établies.",
    monthlyPrice: 100,
    cta: "Démarrer l'essai gratuit",
    href: "/metiers",
    features: [
      { label: "Utilisateurs illimités", included: true },
      { label: "Tous les modules inclus", included: true },
      { label: "Onboarding personnalisé", included: true },
      { label: "Account Manager dédié", included: true },
    ],
  },
];

/** Taux de remise appliqué sur l'engagement annuel. */
const YEARLY_DISCOUNT = 0.2;

/** Props du bloc tarifs (toutes optionnelles : valeurs par défaut = accueil). */
type PricingProps = {
  /** Titre de la section. */
  title?: string;
  /** Sous-titre sous le titre. */
  subtitle?: string;
  /**
   * Niveau du titre : `h2` quand le bloc est une section parmi d'autres
   * (accueil), `h1` quand il est le titre principal de la page dédiée
   * (/tarifs). Préserve une hiérarchie de titres correcte (WCAG 2.4.6).
   */
  headingLevel?: "h1" | "h2";
};

/**
 * Section « Tarifs » avec bascule Mensuel / Annuel.
 *
 * Bloc réutilisé tel quel par la page d'accueil et la page dédiée /tarifs ;
 * seuls le libellé et le niveau du titre s'adaptent via les props.
 *
 * Client Component : l'état `yearly` recalcule les prix à la volée, sans
 * rechargement (US 4.2). Le sélecteur est :
 *  - utilisable au clavier (deux `<button>` natifs dans un `role="group"`) ;
 *  - annoncé aux lecteurs d'écran via `aria-pressed` et une zone `role="status"`
 *    qui verbalise la périodicité active.
 */
export default function Pricing({
  title = "Une tarification simple et transparente",
  subtitle = "Choisissez le plan qui correspond à la taille de votre entreprise.",
  headingLevel = "h2",
}: PricingProps = {}) {
  const [yearly, setYearly] = useState(false);
  // Balise de titre dynamique (h1 ou h2 selon le contexte d'utilisation).
  const Heading = headingLevel;

  /**
   * Calcule le prix mensuel affiché pour une offre selon la périodicité.
   * En annuel, on applique la remise puis on arrondit à l'euro.
   */
  const displayedPrice = (monthlyPrice: number) =>
    yearly ? Math.round(monthlyPrice * (1 - YEARLY_DISCOUNT)) : monthlyPrice;

  return (
    <section
      id="tarifs"
      aria-labelledby="tarifs-titre"
      className="scroll-mt-24 bg-content px-6 py-24 sm:px-10 md:px-16"
    >
      <div className="mx-auto max-w-7xl text-center">
        <div className="mx-auto mb-8 max-w-2xl">
          <Heading
            id="tarifs-titre"
            className={`mb-4 font-bold text-text ${
              headingLevel === "h1"
                ? "text-[32px] sm:text-[44px]"
                : "text-[28px] sm:text-[32px]"
            }`}
          >
            {title}
          </Heading>
          <p className="text-[15px] text-soft">{subtitle}</p>
        </div>

        {/* Sélecteur de périodicité */}
        <div className="mb-16 flex items-center justify-center gap-4">
          <div
            role="group"
            aria-label="Choisir la périodicité de facturation"
            className="inline-flex rounded-full bg-surface p-1 shadow-card"
          >
            <button
              type="button"
              onClick={() => setYearly(false)}
              aria-pressed={!yearly}
              className={`rounded-full px-6 py-2 text-[14px] font-semibold transition-colors ${
                yearly
                  ? "text-soft hover:text-text"
                  : "bg-accent-dark text-white"
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              aria-pressed={yearly}
              className={`rounded-full px-6 py-2 text-[14px] font-semibold transition-colors ${
                yearly
                  ? "bg-accent-dark text-white"
                  : "text-soft hover:text-text"
              }`}
            >
              Annuel
            </button>
          </div>
          <span className="rounded-full bg-pink-light px-2 py-0.5 text-[11px] font-bold tracking-tight text-pink uppercase">
            −20%
          </span>
        </div>

        {/* Zone vocalisée pour lecteurs d'écran (changement de périodicité). */}
        <p role="status" aria-live="polite" className="sr-only">
          {yearly
            ? "Tarifs annuels affichés, remise de 20% appliquée."
            : "Tarifs mensuels affichés."}
        </p>

        <ul className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-8 md:grid-cols-3">
          {PLANS.map((plan) => (
            <li
              key={plan.name}
              className={`relative flex h-full flex-col overflow-hidden rounded-2xl bg-surface p-8 text-left ${
                plan.highlighted
                  ? "border-2 border-accent shadow-lift md:scale-105"
                  : "border border-border-light shadow-card"
              }`}
            >
              {plan.highlighted && (
                // Ruban « Populaire » en coin (clippé par overflow-hidden).
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 right-0 h-28 w-28 overflow-hidden"
                >
                  <span className="absolute top-5 -right-9 w-[140px] rotate-45 bg-accent-dark py-1.5 text-center text-[10px] font-bold tracking-widest text-white uppercase">
                    Populaire
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={`mb-2 text-[11px] font-bold tracking-[0.6px] uppercase ${
                    plan.highlighted ? "text-accent-dark" : "text-soft"
                  }`}
                >
                  {plan.name}
                </h3>
                <p className="mb-4 text-[11.5px] text-soft">{plan.tagline}</p>
                <p className="flex items-baseline">
                  <span className="text-[48px] font-bold tracking-tight text-accent-dark">
                    {displayedPrice(plan.monthlyPrice)}€
                  </span>
                  <span className="ml-1 text-soft">/mois</span>
                </p>
              </div>

              <Link
                href={plan.href}
                className={`mb-8 flex h-11 w-full items-center justify-center rounded-lg px-4 text-center text-[13px] font-medium transition-all ${
                  plan.highlighted
                    ? "bg-accent-dark text-white shadow-card hover:-translate-y-px hover:shadow-lift"
                    : "border border-border text-text hover:bg-content"
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="flex flex-grow flex-col gap-4">
                {plan.features.map((feature) => (
                  <li key={feature.label} className="flex items-start gap-3">
                    <Icon
                      name={feature.included ? "check-circle" : "x"}
                      size={18}
                      className={`mt-0.5 shrink-0 ${
                        feature.included ? "text-accent-dark" : "text-muted"
                      }`}
                    />
                    <span
                      className={`text-[13px] text-soft ${
                        feature.included ? "" : "line-through"
                      }`}
                    >
                      {feature.label}
                      {!feature.included && (
                        <span className="sr-only"> (non inclus)</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
