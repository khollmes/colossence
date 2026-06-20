import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rateLimit";

const PRICES: Record<string, { priceId: string }> = {
  MENSUEL: { priceId: process.env.STRIPE_PRICE_MENSUEL! },
  ANNUEL: { priceId: process.env.STRIPE_PRICE_ANNUEL! },
};

export async function POST(req: NextRequest) {
  // Rate limiting: 10 requêtes par minute par IP
  const ip = getClientIp(req);
  const { success } = checkRateLimit(`checkout:${ip}`);
  if (!success) {
    return rateLimitResponse();
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const plan = body.plan as string;

    if (!plan || !PRICES[plan]) {
      return NextResponse.json(
        { error: "Plan invalide. Choisissez MENSUEL ou ANNUEL." },
        { status: 400 }
      );
    }

    const userId = (session.user as { id: string }).id;

    // Récupérer ou créer le client Stripe
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Vérifier s'il existe déjà un stripeCustomerId
    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { id: "desc" },
    });

    let stripeCustomerId = existingSubscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.prenom} ${user.nom}`,
        metadata: { userId },
      });
      stripeCustomerId = customer.id;
    }

    // Créer la session Stripe Checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        // Abonnement avec période d'essai
        {
          price: PRICES[plan].priceId,
          quantity: 1,
        },
        // Frais de mise en ligne uniques (50€)
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Frais de mise en ligne",
              description: "Frais uniques de mise en ligne de votre secrétariat IA",
            },
            unit_amount: 5000, // 50€ en centimes
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 30,
        metadata: { userId, plan },
      },
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?checkout=cancelled`,
      metadata: { userId, plan },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Erreur lors de la création de la session checkout:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
