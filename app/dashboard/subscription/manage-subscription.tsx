"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PortalButton from "./portal-button";
import {
  PLAN_META,
  formatPlanLabel,
  type PlanEnum,
} from "@/lib/plans";

interface Props {
  currentPlan: PlanEnum;
  currentPeriodEnd: string; // ISO
  cancelAtPeriodEnd: boolean;
}

const ALL_PLANS = Object.keys(PLAN_META) as PlanEnum[];

export default function ManageSubscription({
  currentPlan,
  currentPeriodEnd,
  cancelAtPeriodEnd,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [showPlans, setShowPlans] = useState(false);

  const periodEndLabel = new Date(currentPeriodEnd).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const otherPlans = ALL_PLANS.filter((p) => p !== currentPlan);

  const handleChange = async (plan: PlanEnum) => {
    if (
      !confirm(
        `Passer à l'offre « ${formatPlanLabel(plan)} » ? Le montant sera ajusté au prorata de votre période en cours.`
      )
    )
      return;

    setBusy(`change:${plan}`);
    try {
      const res = await fetch("/api/subscription/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPlans(false);
        router.refresh();
      } else {
        alert(data.error ?? "Une erreur est survenue.");
      }
    } catch {
      alert("Une erreur est survenue.");
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = async (action: "cancel" | "reactivate") => {
    if (
      action === "cancel" &&
      !confirm(
        `Résilier votre abonnement ? Vous conserverez l'accès jusqu'au ${periodEndLabel}, puis il prendra fin.`
      )
    )
      return;

    setBusy(action);
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert(data.error ?? "Une erreur est survenue.");
      }
    } catch {
      alert("Une erreur est survenue.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Gérer mon abonnement</h2>

      {/* Bandeau résiliation programmée */}
      {cancelAtPeriodEnd ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-amber-800">
            Votre abonnement se terminera le{" "}
            <span className="font-semibold">{periodEndLabel}</span>.
          </p>
          <button
            onClick={() => handleCancel("reactivate")}
            disabled={busy !== null}
            className="shrink-0 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {busy === "reactivate" ? "..." : "Reprendre mon abonnement"}
          </button>
        </div>
      ) : (
        <>
          {/* Changer d'offre */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Changer d&apos;offre</p>
                <p className="text-sm text-gray-500">
                  Offre actuelle : {formatPlanLabel(currentPlan)}
                </p>
              </div>
              <button
                onClick={() => setShowPlans((v) => !v)}
                disabled={busy !== null}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {showPlans ? "Fermer" : "Changer d'offre"}
              </button>
            </div>

            {showPlans && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {otherPlans.map((plan) => (
                  <div
                    key={plan}
                    className="flex items-center justify-between border border-gray-200 rounded-lg p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {PLAN_META[plan].label}
                      </p>
                      <p className="text-sm text-gray-500">
                        {PLAN_META[plan].price.toLocaleString("fr-FR")} €/
                        {PLAN_META[plan].interval}
                      </p>
                    </div>
                    <button
                      onClick={() => handleChange(plan)}
                      disabled={busy !== null}
                      className="shrink-0 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {busy === `change:${plan}` ? "..." : "Choisir"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Résiliation */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Résilier</p>
              <p className="text-sm text-gray-500">
                Accès conservé jusqu&apos;à la fin de la période en cours.
              </p>
            </div>
            <button
              onClick={() => handleCancel("cancel")}
              disabled={busy !== null}
              className="px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {busy === "cancel" ? "..." : "Résilier mon abonnement"}
            </button>
          </div>
        </>
      )}

      {/* Portail Stripe : moyens de paiement, factures */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500 mb-3">
          Moyens de paiement, factures et historique :
        </p>
        <PortalButton />
      </div>
    </div>
  );
}
