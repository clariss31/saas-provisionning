"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { slugify } from "@/lib/instances/subdomain";
import type { SubdomainCheckResponse } from "@/app/api/subdomain/check/route";
import ModernField, { MODERN_CONTROL } from "./ModernField";

/** États possibles de la vérification du sous-domaine. */
export type SubdomainStatus = "idle" | "checking" | "available" | "unavailable";

type Props = {
  /** Valeur contrôlée de la raison sociale. */
  value: string;
  /** Remonte la raison sociale saisie au parent. */
  onValueChange: (companyName: string) => void;
  /** Remonte le statut + le sous-domaine dérivé (pour conditionner l'étape). */
  onResult: (status: SubdomainStatus, subdomain: string) => void;
  /** Domaine racine affiché (ex. « pichinov.fr »), fourni par le serveur. */
  domain: string;
};

/** Délai d'attente avant l'appel API, le temps que la saisie se stabilise. */
const DEBOUNCE_MS = 400;

/** Dernier résultat résolu par l'API (rattaché au sous-domaine concerné). */
type CheckResult = { subdomain: string; available: boolean; reason: string | null };

/**
 * Champ « Raison sociale » avec vérification en temps réel de la disponibilité
 * du sous-domaine dérivé (US 5.2).
 *
 * - L'appel API est **débattu** (debounce) et les réponses obsolètes annulées
 *   (`AbortController`).
 * - Le statut est **dérivé** de la saisie et du dernier résultat résolu (aucun
 *   `setState` synchrone dans l'effet) : tant que le résultat ne correspond pas
 *   au sous-domaine courant, on est en « vérification ».
 * - Une **pastille** verte/rouge accessible (`aria-live`) reflète l'état, sans
 *   bloquer l'interface ; le parent utilise le statut remonté pour autoriser ou
 *   non le passage à l'étape suivante.
 */
export default function SubdomainField({
  value,
  onValueChange,
  onResult,
  domain,
}: Props) {
  // Aperçu live du sous-domaine (même `slugify` que le serveur → cohérent).
  const subdomain = slugify(value);

  // Seul état stocké : le dernier résultat résolu par l'API.
  const [result, setResult] = useState<CheckResult | null>(null);

  // Statut dérivé (pas de setState synchrone dans l'effet).
  let status: SubdomainStatus = "checking";
  let reason: string | null = null;
  if (subdomain.length === 0) {
    status = "idle";
  } else if (result && result.subdomain === subdomain) {
    status = result.available ? "available" : "unavailable";
    reason = result.reason;
  }

  // Débounce + appel API (setResult uniquement dans le callback async).
  useEffect(() => {
    if (subdomain.length === 0) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/subdomain/check?name=${encodeURIComponent(value)}`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as SubdomainCheckResponse;
        setResult({
          subdomain: data.subdomain,
          available: data.available,
          reason: data.reason,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResult({
          subdomain,
          available: false,
          reason: "Vérification impossible, réessayez.",
        });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, subdomain]);

  // Remonte le statut au parent (appel de prop, pas de setState local). La ref
  // évite de remettre `onResult` dans les dépendances.
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  });
  useEffect(() => {
    onResultRef.current(status, subdomain);
  }, [status, subdomain]);

  const borderClass =
    status === "unavailable"
      ? "border-danger focus:border-danger"
      : "border-border focus:border-accent";

  return (
    <div>
      <ModernField id="companyName" label="Raison sociale" invalid={status === "unavailable"}>
        <input
          id="companyName"
          name="companyName"
          type="text"
          required
          autoComplete="organization"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Nom de votre entreprise"
          aria-invalid={status === "unavailable" ? true : undefined}
          aria-describedby="subdomain-status"
          className={`${MODERN_CONTROL} ${borderClass}`}
        />
      </ModernField>

      {/* Pastille d'état (URL en vert si disponible, motif en rouge sinon). */}
      <div id="subdomain-status" aria-live="polite" className="mt-3 min-h-[28px]">
        {status === "checking" && (
          <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-content px-3 py-1.5 text-[12px] font-medium text-soft">
            <span
              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border border-t-accent"
              aria-hidden="true"
            />
            <span>
              {subdomain}.{domain}
            </span>
          </span>
        )}

        {status === "available" && (
          <span className="inline-flex items-center gap-2 rounded-lg border border-success/15 bg-success-light px-3 py-1.5 text-[12px] font-medium text-success-dark">
            <Icon name="check-circle" size={16} />
            <span>
              {subdomain}.{domain}
            </span>
            <span className="sr-only">Sous-domaine disponible</span>
          </span>
        )}

        {status === "unavailable" && (
          <span className="inline-flex items-center gap-2 rounded-lg border border-danger/15 bg-danger-light px-3 py-1.5 text-[12px] font-medium text-danger">
            <Icon name="x" size={16} />
            <span>{reason ?? "Sous-domaine indisponible"}</span>
          </span>
        )}
      </div>
    </div>
  );
}