import Icon from "@/components/ui/Icon";

/** Une question / réponse de la FAQ tarifs. */
type FaqItem = { question: string; answer: string };

/**
 * Questions fréquentes sur la facturation et l'engagement (cf. maquette).
 * La première est ouverte par défaut.
 */
const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Puis-je changer d'abonnement plus tard ?",
    answer:
      "Oui, tout à fait. Vous pouvez passer du plan Starter au plan Pro ou Premium à tout moment depuis les paramètres de votre compte. La différence sera calculée au prorata de votre utilisation actuelle.",
  },
  {
    question: "Quels sont les moyens de paiement acceptés ?",
    answer:
      "Nous acceptons toutes les principales cartes bancaires (Visa, Mastercard, American Express) ainsi que les prélèvements SEPA pour les abonnements annuels. Les paiements sont sécurisés par Stripe.",
  },
  {
    question: "Y a-t-il des frais cachés pour la facturation ?",
    answer:
      "Non, notre tarification est 100 % transparente. Vous ne payez que le montant de l'abonnement affiché. L'envoi de factures et les relances automatisées sont inclus dans votre forfait sans coût supplémentaire.",
  },
  {
    question: "Comment fonctionne l'engagement ?",
    answer:
      "Les abonnements mensuels sont sans engagement : vous pouvez annuler à tout moment pour le mois suivant. Les abonnements annuels vous engagent sur 12 mois en échange d'une réduction substantielle sur le tarif mensuel.",
  },
];

/**
 * Section FAQ de la page Tarifs.
 *
 * Rendue côté serveur : l'accordéon repose sur les balises natives
 * `<details>` / `<summary>`, accessibles au clavier et aux lecteurs d'écran
 * sans aucun JavaScript (meilleure performance, état d'ouverture géré par le
 * navigateur). Le chevron pivote via le sélecteur `[open]`.
 */
export default function PricingFaq() {
  return (
    <section
      aria-labelledby="faq-titre"
      className="bg-surface px-6 py-20 sm:px-10 md:px-16"
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="faq-titre"
          className="mb-8 text-center text-[24px] font-bold text-text"
        >
          Questions fréquentes
        </h2>

        <ul className="flex flex-col gap-4">
          {FAQ_ITEMS.map((item, index) => (
            <li key={item.question}>
              <details
                open={index === 0}
                className="group overflow-hidden rounded-2xl border border-border-light bg-surface shadow-card"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 text-left font-semibold text-text transition-colors hover:bg-content [&::-webkit-details-marker]:hidden">
                  <span className="text-[14.5px]">{item.question}</span>
                  <Icon
                    name="chevron-down"
                    size={20}
                    className="shrink-0 text-soft transition-transform duration-300 group-open:rotate-180"
                  />
                </summary>
                <p className="px-6 pb-4 text-[13px] leading-relaxed text-soft">
                  {item.answer}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
