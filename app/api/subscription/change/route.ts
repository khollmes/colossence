import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { isValidPlan, type PlanEnum } from "@/lib/plans";

// Mapping enum → Stripe Price ID (serveur uniquement).
const PLAN_PRICE_IDS: Record<PlanEnum, string> = {
  STANDARD_MENSUEL: process.env.STRIPE_PRICE_STANDARD_MENSUEL!,
  STANDARD_ANNUEL: process.env.STRIPE_PRICE_STANDARD_ANNUEL!,
  FULLIA_MENSUEL: process.env.STRIPE_PRICE_FULLIA_MENSUEL!,
  FULLIA_ANNUEL: process.env.STRIPE_PRICE_FULLIA_ANNUEL!,
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const newPlan = body.plan as string;

    console.log(`[Subscription/change] Nouveau plan demandé : ${newPlan}`);

    if (!newPlan || !isValidPlan(newPlan)) {
      return NextResponse.json({ error: `Plan invalide : "${newPlan}"` }, { status: 400 });
    }

    const userId = (session.user as { id: string }).id;

    const subscription = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { id: "desc" },
    });

    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "Aucun abonnement actif à modifier." },
        { status: 400 }
      );
    }

    if (subscription.plan === newPlan) {
      return NextResponse.json(
        { error: "C'est déjà votre offre actuelle." },
        { status: 400 }
      );
    }

    // Récupérer l'item d'abonnement récurrent (le seul item récurrent :
    // les frais d'installation sont un one-time, pas un item d'abonnement).
    const stripeSub = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );
    const itemId = stripeSub.items.data[0]?.id;

    if (!itemId) {
      return NextResponse.json(
        { error: "Impossible de retrouver la ligne d'abonnement Stripe." },
        { status: 500 }
      );
    }

    // Bascule vers le nouveau price avec proration automatique (crédit/débit
    // du temps restant). metadata mis à jour pour que le webhook reste cohérent.
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{ id: itemId, price: PLAN_PRICE_IDS[newPlan] }],
      proration_behavior: "create_prorations",
      metadata: { userId, plan: newPlan },
    });

    // Mise à jour locale immédiate (le webhook confirmera de toute façon).
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { plan: newPlan },
    });

    return NextResponse.json({ success: true, plan: newPlan });
  } catch (error) {
    console.error("[Subscription/change] Erreur :", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
