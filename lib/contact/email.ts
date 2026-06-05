import Mailjet from "node-mailjet";
import { CONTACT_SUBJECTS, type ContactData } from "./validation";

/**
 * Transport e-mail du formulaire de contact (US 7.1).
 *
 * ⚠️ Module strictement serveur : il n'est importé que par la Server Action
 * (`app/(public)/contact/actions.ts`). Ni le destinataire réel ni les clés
 * MailJet ne sont donc exposés au client.
 *
 * Envoi via **MailJet** (Send API v3.1) dès que les clés sont configurées
 * (`MJ_APIKEY_PUBLIC` / `MJ_APIKEY_PRIVATE`). À défaut, repli sur une simple
 * journalisation côté serveur — pratique en développement, sans bloquer l'envoi.
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
 * Adresse expéditrice des e-mails sortants. Doit être un expéditeur **validé**
 * dans MailJet, sinon l'API rejette l'envoi.
 */
const MAIL_FROM = process.env.MAIL_FROM ?? "contact@pichinov.com";

/** Message e-mail prêt à être remis à un transport (API MailJet, log…). */
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
 * Envoie l'e-mail via l'API MailJet (Send API v3.1).
 *
 * @throws Error si MailJet répond en échec. Le détail technique est journalisé
 *   côté serveur mais n'est pas propagé à l'UI (message générique côté client).
 */
async function sendViaMailjet(
  email: OutgoingEmail,
  apiKey: string,
  apiSecret: string,
): Promise<void> {
  const mailjet = Mailjet.apiConnect(apiKey, apiSecret);

  try {
    await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: { Email: MAIL_FROM, Name: "Provi" },
          To: [{ Email: email.to }],
          // Répondre au message renvoie directement vers le prospect.
          ReplyTo: { Email: email.replyTo },
          Subject: email.subject,
          TextPart: email.text,
        },
      ],
    });
  } catch (error) {
    console.error("[contact] échec de l'envoi MailJet :", error);
    throw new Error("Échec de l'envoi du message via MailJet.");
  }
}

/**
 * Remet le message au support (`support@pichinov.com`).
 *
 *  - si les clés MailJet sont présentes, l'e-mail est envoyé via MailJet ;
 *  - sinon, il est journalisé côté serveur (repli de développement).
 *
 * @throws Error si MailJet est configuré mais répond en échec.
 */
export async function sendContactEmail(data: ContactData): Promise<void> {
  const email = buildEmail(data);
  const apiKey = process.env.MJ_APIKEY_PUBLIC;
  const apiSecret = process.env.MJ_APIKEY_PRIVATE;

  if (apiKey && apiSecret) {
    await sendViaMailjet(email, apiKey, apiSecret);
    return;
  }

  // Pas de clés configurées : on trace le message côté serveur pour ne pas le
  // perdre en développement. À remplacer par MailJet en production.
  console.info(
    `[contact] (repli dev — MailJet non configuré) message destiné à ${email.to} ` +
      `(répondre à ${email.replyTo}) — sujet « ${email.subject} »`,
  );
}