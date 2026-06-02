import { CONTACT_SUBJECTS, type ContactData } from "./validation";

/**
 * Transport e-mail du formulaire de contact.
 *
 * ⚠️ Module strictement serveur : il n'est importé que par la Server Action
 * (`app/(public)/contact/actions.ts`). Le destinataire réel n'est donc jamais
 * exposé au client.
 */

/**
 * Destinataire réel des messages de contact (équipe support de l'agence).
 *
 * NB : c'est volontairement différent de l'adresse affichée en façade
 * (`contact@provi.com`), qui n'est qu'un libellé public. On ne fait jamais
 * confiance à un éventuel destinataire transmis par le client.
 */
const CONTACT_RECIPIENT = "support@pichinov.com";

/** Message e-mail prêt à être remis à un transport (SMTP, API, …). */
type OutgoingEmail = {
  to: string;
  /** Permet de répondre directement à l'expéditeur (adresse validée). */
  replyTo: string;
  subject: string;
  text: string;
};

/**
 * Construit l'e-mail en **texte brut** à partir des données déjà validées et
 * assainies. Le texte brut élimine tout risque d'injection HTML/script dans le
 * client de messagerie ; l'adresse (sans CR/LF, cf. validation) est sûre en
 * en-tête `Reply-To`.
 */
function buildEmail(data: ContactData): OutgoingEmail {
  const subjectLabel = CONTACT_SUBJECTS[data.subject];

  return {
    to: CONTACT_RECIPIENT,
    replyTo: data.email,
    subject: `[Contact Provi] ${subjectLabel}`,
    text: [
      `Nom    : ${data.name}`,
      `E-mail : ${data.email}`,
      `Sujet  : ${subjectLabel}`,
      "",
      "Message :",
      data.message,
    ].join("\n"),
  };
}

/**
 * Remet le message au support (`support@pichinov.com`).
 *
 * Implémentation actuelle volontairement minimale et sans dépendance :
 *  - si la variable d'environnement `CONTACT_FORWARD_URL` est définie, le
 *    message est transmis en `POST` JSON à ce point d'intégration (relais
 *    SMTP, webhook, API du Dolibarr Maître…) — c'est l'emplacement à câbler
 *    en production ;
 *  - sinon, il est journalisé côté serveur (utile en développement).
 *
 * @throws Error si un point d'intégration est configuré mais répond en échec.
 */
export async function sendContactEmail(data: ContactData): Promise<void> {
  const email = buildEmail(data);
  const forwardUrl = process.env.CONTACT_FORWARD_URL;

  if (forwardUrl) {
    const res = await fetch(forwardUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(email),
    });
    if (!res.ok) {
      throw new Error(`Échec de l'envoi du message (HTTP ${res.status}).`);
    }
    return;
  }

  // Pas de transport configuré : on trace côté serveur pour ne pas perdre le
  // message en développement. À remplacer par un envoi réel en production.
  console.info(
    `[contact] message destiné à ${email.to} (répondre à ${email.replyTo}) — sujet « ${email.subject} »`,
  );
}
