import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    // Récupérer le stripeCustomerId de l'utilisateur
    const subscription = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { id: "desc" },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "Aucun compte Stripe trouvé. Veuillez d'abord souscrire à un plan." },
        { status: 400 }
      );
    }

    // Créer une session Customer Portal
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Erreur lors de la création du portail client:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
