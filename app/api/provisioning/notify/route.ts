import { type NextRequest, NextResponse } from "next/server";
import { claimReadyNotification } from "@/lib/dolibarr/instances";
import { sendInstanceReadyEmail } from "@/lib/instances/ready-email";

/**
 * `POST /api/provisioning/notify` — envoie l'e-mail « Votre ERP est prêt » à la
 * **fin** du provisioning. Appelé par le tableau de bord quand le déploiement
 * est terminé.
 *
 * Le destinataire est retrouvé **côté serveur** à partir de la réf (jamais
 * fourni par le client → pas de relais ouvert), et l'envoi est **idempotent**
 * (`claimReadyNotification` ne renvoie les coordonnées qu'une seule fois).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let ref = "";
  try {
    const body = (await request.json()) as { ref?: unknown };
    ref = typeof body.ref === "string" ? body.ref : "";
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (!ref) {
    return NextResponse.json({ error: "Référence manquante." }, { status: 400 });
  }

  const notification = await claimReadyNotification(ref);
  if (!notification) {
    // Déjà notifié, instance inconnue, ou pas encore déployée : rien à faire.
    return NextResponse.json({ sent: false });
  }

  try {
    await sendInstanceReadyEmail({
      to: notification.to,
      companyName: notification.companyName,
      // Lien d'accès cohérent avec le bouton du tableau de bord.
      url: process.env.MASTER_INSTANCE_URL ?? notification.url,
    });
  } catch (error) {
    console.error("[provisioning] échec de l'e-mail « prêt » :", error);
    return NextResponse.json({ sent: false, error: "Échec de l'envoi." }, { status: 502 });
  }

  return NextResponse.json({ sent: true });
}