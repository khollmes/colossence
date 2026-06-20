import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;

  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { currentPeriodEnd: "desc" },
  });

  const failedPayment = await prisma.failedPayment.findFirst({
    where: { userId, resolved: false },
    orderBy: { createdAt: "desc" },
  });

  const statusLabels: Record<string, string> = {
    TRIALING: "Période d'essai",
    ACTIVE: "Actif",
    PAST_DUE: "Paiement en retard",
    CANCELED: "Annulé",
  };

  const planLabels: Record<string, string> = {
    MENSUEL: "Mensuel (250€/mois)",
    ANNUEL: "Annuel (2000€/an)",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Vue d&apos;ensemble</h1>

      {failedPayment && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-medium">
            ⚠️ Paiement échoué de {failedPayment.montant.toFixed(2)}€ —{" "}
            {failedPayment.relances} tentative(s)
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Statut abonnement */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Statut de l&apos;abonnement</p>
          <p className="text-lg font-semibold text-gray-900">
            {subscription ? statusLabels[subscription.status] || subscription.status : "Aucun abonnement"}
          </p>
          {subscription && (
            <p className="text-sm text-gray-500 mt-2">
              Plan : {planLabels[subscription.plan] || subscription.plan}
            </p>
          )}
        </div>

        {/* Date de fin d'essai */}
        {subscription?.trialEndsAt && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Fin de la période d&apos;essai</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(subscription.trialEndsAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        )}

        {/* Prochaine facturation */}
        {subscription && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Prochaine facturation</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        )}
      </div>

      {!subscription && (
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-600 mb-4">
            Vous n&apos;avez pas encore d&apos;abonnement actif.
          </p>
          <a
            href="/pricing"
            className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Voir les tarifs
          </a>
        </div>
      )}
    </div>
  );
}

