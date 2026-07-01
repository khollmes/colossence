import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import PricingPlans from "@/components/PricingPlans";
import ManageSubscription from "./manage-subscription";
import type { PlanEnum } from "@/lib/plans";

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;

  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { currentPeriodEnd: "desc" },
  });

  const statusLabels: Record<string, { label: string; color: string }> = {
    INCOMPLETE: { label: "Paiement en attente", color: "bg-yellow-100 text-yellow-800" },
    TRIALING: { label: "Période d'essai", color: "bg-blue-100 text-blue-800" },
    ACTIVE: { label: "Actif", color: "bg-green-100 text-green-800" },
    PAST_DUE: { label: "Paiement en retard", color: "bg-red-100 text-red-800" },
    CANCELED: { label: "Annulé", color: "bg-gray-100 text-gray-800" },
  };

  const planLabels: Record<string, string> = {
    STANDARD_MENSUEL: "Standard — 70 €/mois",
    STANDARD_ANNUEL: "Standard — 700 €/an",
    FULLIA_MENSUEL: "Full IA — 250 €/mois",
    FULLIA_ANNUEL: "Full IA — 2 000 €/an",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Abonnement</h1>

      {subscription ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Plan actuel</p>
              <p className="text-lg font-semibold text-gray-900">
                {planLabels[subscription.plan] ?? subscription.plan}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusLabels[subscription.status]?.color || "bg-gray-100 text-gray-800"
              }`}
            >
              {statusLabels[subscription.status]?.label || subscription.status}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {subscription.trialEndsAt && (
              <div>
                <p className="text-sm text-gray-500">Fin de l&apos;essai</p>
                <p className="font-medium text-gray-900">
                  {new Date(subscription.trialEndsAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Prochaine facturation</p>
              <p className="font-medium text-gray-900">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Frais de mise en ligne</p>
              <p className="font-medium text-gray-900">
                {subscription.setupFeePaid ? "✅ Payés" : "En attente"}
              </p>
            </div>
          </div>

        </div>
      ) : null}

      {subscription && (
        <ManageSubscription
          currentPlan={subscription.plan as PlanEnum}
          currentPeriodEnd={subscription.currentPeriodEnd.toISOString()}
          cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
        />
      )}

      {!subscription && (
        <div>
          <p className="text-gray-500 mb-8">
            Aucun abonnement actif. Choisissez une offre pour démarrer.
          </p>
          <PricingPlans />
        </div>
      )}
    </div>
  );
}
