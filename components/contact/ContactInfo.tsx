import Icon, { type IconName } from "@/components/ui/Icon";

/** Un canal de contact (pictogramme + intitulé + valeur). */
type Channel = {
  icon: IconName;
  label: string;
  value: string;
  /** Lien optionnel (mailto, tel, URL). Absent → simple texte. */
  href?: string;
  /** Lien externe (ouvre un nouvel onglet). */
  external?: boolean;
  iconColor: string;
  iconBg: string;
};

/**
 * Coordonnées publiques de l'agence (cf. maquette).
 *
 * NB : l'adresse e-mail affichée (`contact@provi.com`) est une façade publique
 * et reste volontairement distincte du destinataire réel du formulaire
 * (géré côté serveur).
 */
const CHANNELS: Channel[] = [
  {
    icon: "mail",
    label: "Par email",
    value: "contact@provi.com",
    href: "mailto:contact@provi.com",
    iconColor: "text-accent-dark",
    iconBg: "bg-accent-light",
  },
  {
    icon: "phone",
    label: "Par téléphone",
    value: "+33 1 23 45 67 89",
    href: "tel:+33123456789",
    iconColor: "text-success",
    iconBg: "bg-success-light",
  },
  {
    icon: "map-pin",
    label: "Nos bureaux",
    value: "25 route de la gleyzette, Lacroix-Falgarde, France",
    iconColor: "text-pink",
    iconBg: "bg-pink-light",
  },
  {
    icon: "globe",
    label: "LinkedIn",
    value: "Suivez-nous sur LinkedIn",
    href: "https://www.linkedin.com",
    external: true,
    iconColor: "text-accent-dark",
    iconBg: "bg-accent-light",
  },
];

/**
 * Colonne de gauche de la page Contact : titre, accroche et canaux de contact.
 * Rendue côté serveur (contenu statique).
 */
export default function ContactInfo() {
  return (
    <div className="flex flex-col gap-10 lg:w-[40%]">
      <div>
        <h1 className="mb-4 text-[32px] leading-[40px] font-bold tracking-tight text-text">
          Une question ? On vous répond.
        </h1>
        <p className="max-w-md text-[14px] leading-relaxed text-soft">
          Notre équipe est disponible pour vous accompagner dans vos projets.
          Choisissez le canal qui vous convient le mieux.
        </p>
      </div>

      <ul className="flex flex-col gap-5">
        {CHANNELS.map((channel) => {
          const content = (
            <>
              <span
                aria-hidden="true"
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${channel.iconBg} ${channel.iconColor}`}
              >
                <Icon name={channel.icon} size={22} />
              </span>
              <span className="flex flex-col">
                <span className="text-[14.5px] font-semibold text-text">
                  {channel.label}
                </span>
                <span className="text-[13px] text-soft">{channel.value}</span>
              </span>
            </>
          );

          return (
            <li key={channel.label}>
              {channel.href ? (
                <a
                  href={channel.href}
                  {...(channel.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="flex items-center gap-5 rounded-xl border border-border-light bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-card"
                >
                  {content}
                </a>
              ) : (
                <div className="flex items-center gap-5 rounded-xl border border-border-light bg-surface p-5">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
