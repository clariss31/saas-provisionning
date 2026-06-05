import { sendMail } from "@/lib/email/mailjet";
import { CONTACT_SUBJECTS, type ContactData } from "./validation";

/**
 * Envoi du formulaire de contact (US 7.1).
 *
 * ⚠️ Module strictement serveur : il n'est importé que par la Server Action
 * (`app/(public)/contact/actions.ts`). Le destinataire réel n'est donc jamais
 * exposé au client. Le transport (MailJet ou repli log) est mutualisé dans
 * `lib/email/mailjet.ts`.
 */

/**
 * Destinataire réel des messages de contact (équipe support de l'agence).
 *
 * NB : c'est volontairement différent de l'adresse affichée en façade
 * (`contact@provi.com`), qui n'est qu'un libellé public. On ne fait jamais
 * confiance à un éventuel destinataire transmis par le client.
 */
const CONTACT_RECIPIENT = "clarisse.ferand@gmail.com";

/**
 * Remet le message de contact au support.
 *
 * Le corps est en **texte brut** (aucun HTML → pas d'injection dans le client
 * mail) ; l'adresse de l'expéditeur (sans CR/LF, cf. validation) est placée en
 * `Reply-To` pour permettre une réponse directe.
 *
 * @throws Error si MailJet est configuré mais répond en échec.
 */
export async function sendContactEmail(data: ContactData): Promise<void> {
  const subjectLabel = CONTACT_SUBJECTS[data.subject];

  await sendMail({
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
  });
}