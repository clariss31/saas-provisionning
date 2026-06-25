"use client";

import { useEffect, useState } from "react";
import { slugify } from "@/lib/instances/subdomain";
import type { SubdomainCheckResponse } from "@/app/api/subdomain/check/route";

/** États possibles de la vérification du sous-domaine. */
export type SubdomainStatus = "idle" | "checking" | "available" | "unavailable";

/** Délai d'attente avant l'appel API, le temps que la saisie se stabilise. */
const DEBOUNCE_MS = 400;

/** Dernier résultat résolu par l'API (rattaché au sous-domaine concerné). */
type CheckResult = { subdomain: string; available: boolean; reason: string | null };

/** Valeur de retour du hook : statut dérivé + sous-domaine + motif éventuel. */
export type UseSubdomainCheck = {
  status: SubdomainStatus;
  subdomain: string;
  reason: string | null;
};

/**
 * Vérifie en temps réel la disponibilité du sous-domaine dérivé d'une raison
 * sociale (US 5.2). Logique extraite de l'ancien `SubdomainField` pour être
 * réutilisée par le champ de recherche d'entreprise.
 *
 * - L'appel API est **débattu** (debounce) et les réponses obsolètes annulées
 *   (`AbortController`).
 * - Le statut est **dérivé** de la saisie et du dernier résultat résolu (aucun
 *   `setState` synchrone) : tant que le résultat ne correspond pas au
 *   sous-domaine courant, on reste en « vérification ».
 *
 * @param companyName Raison sociale brute saisie (slugifiée en interne).
 */
export function useSubdomainCheck(companyName: string): UseSubdomainCheck {
  // Aperçu live du sous-domaine (même `slugify` que le serveur → cohérent).
  const subdomain = slugify(companyName);

  // Seul état stocké : le dernier résultat résolu par l'API.
  const [result, setResult] = useState<CheckResult | null>(null);

  // Statut dérivé (pas de setState synchrone).
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
          `/api/subdomain/check?name=${encodeURIComponent(companyName)}`,
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
  }, [companyName, subdomain]);

  return { status, subdomain, reason };
}