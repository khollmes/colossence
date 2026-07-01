import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";

// Résiliation en fin de période (cancel_at_period_end) et reprise (undo).
// L'abonnement n'est PAS coupé immédiatement : le client garde l'accès
// jusqu'à currentPeriodEnd, puis Stripe émet customer.subscription.deleted.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = (body.action as string) ?? "cancel";

    if (action !== "cancel" && action !== "reactivate") {
      return NextResponse.json(
        { error: 'Action invalide. Utilisez "cancel" ou "reactivate".' },
        { status: 400 }
      );
    }

    const userId = (session.user as { id: string }).id;

    const subscription = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { id: "desc" },
    });

    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "Aucun abonnement actif." },
        { status: 400 }
      );
    }

    const cancelAtPeriodEnd = action === "cancel";
    console.log(
      `[Subscription/cancel] userId=${userId} action=${action} → cancel_at_period_end=${cancelAtPeriodEnd}`
    );

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });

    // Mise à jour locale immédiate (le webhook confirmera).
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd },
    });

    return NextResponse.json({ success: true, cancelAtPeriodEnd });
  } catch (error) {
    console.error("[Subscription/cancel] Erreur :", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
