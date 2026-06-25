import { type NextRequest, NextResponse } from "next/server";
import { getInstanceStatus } from "@/lib/dolibarr/instances";

/**
 * `GET /api/provisioning/[ref]` — état d'avancement du déploiement, interrogé en
 * **polling** par le tableau de bord (Lot 5).
 *
 * Le statut est lu sur le contrat du Dolibarr Maître (cf. `getInstanceStatus`) :
 * `state` passe de `deploying` à `deployed`, et `step` de 1 à 4.
 *
 * Toujours dynamique (statut frais à chaque appel) : jamais mis en cache.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ref: string }> },
): Promise<NextResponse> {
  const { ref } = await params;
  const status = await getInstanceStatus(ref);

  if (!status) {
    return NextResponse.json({ error: "Instance inconnue." }, { status: 404 });
  }
  return NextResponse.json(status);
}