import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rateLimit";

type PlanEnum =
  | "STANDARD_MENSUEL"
  | "STANDARD_ANNUEL"
  | "FULLIA_MENSUEL"
  | "FULLIA_ANNUEL";

// Mapping enum → Stripe Price ID
const PLAN_PRICE_IDS: Record<PlanEnum, string> = {
  STANDARD_MENSUEL: process.env.STRIPE_PRICE_STANDARD_MENSUEL!,
  STANDARD_ANNUEL:  process.env.STRIPE_PRICE_STANDARD_ANNUEL!,
  FULLIA_MENSUEL:   process.env.STRIPE_PRICE_FULLIA_MENSUEL!,
  FULLIA_ANNUEL:    process.env.STRIPE_PRICE_FULLIA_ANNUEL!,
};

const MONTHLY_PLANS = new Set<PlanEnum>(["STANDARD_MENSUEL", "FULLIA_MENSUEL"]);

function isValidPlan(plan: string): plan is PlanEnum {
  return plan in PLAN_PRICE_IDS;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = checkRateLimit(`checkout:${ip}`);
  if (!success) return rateLimitResponse();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const plan = body.plan as string;

    console.log(`[Checkout] Plan reçu : ${plan}`);

    if (!plan || !isValidPlan(plan)) {
      return NextResponse.json(
        {
          error: `Plan invalide : "${plan}". Valeurs acceptées : ${Object.keys(PLAN_PRICE_IDS).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const userId = (session.user as { id: string }).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { businessProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Récupère le stripeCustomerId depuis un abonnement précédent si disponible
    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { id: "desc" },
    });

    let stripeCustomerId = existingSubscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      // Préférer l'email de contact de l'entreprise si renseigné
      const email = user.businessProfile?.contactEmail ?? user.email;
      const customer = await stripe.customers.create({
        email,
        name: `${user.prenom} ${user.nom}`,
        metadata: { userId },
      });
      stripeCustomerId = customer.id;
    }

    const isMonthly = MONTHLY_PLANS.has(plan);
    const baseUrl = process.env.NEXTAUTH_URL!;

    // line_items : abonnement + frais d'installation 50€ sur les offres mensuelles uniquement
    const lineItems: import("stripe").Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: PLAN_PRICE_IDS[plan], quantity: 1 },
    ];

    if (isMonthly) {
      lineItems.push({ price: process.env.STRIPE_PRICE_SETUP_FEE!, quantity: 1 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: lineItems,

      // Champ texte optionnel rempli par le client sur la page Stripe.
      // Récupéré dans le webhook via session.custom_fields[0].text?.value
      // (impossible de le pré-remplir ici — le client ne l'a pas encore fourni).
      custom_fields: [
        {
          key: "rio",
          label: {
            type: "custom",
            custom: "Code RIO (si vous conservez votre numéro)",
          },
          type: "text",
          optional: true,
        },
      ],

      subscription_data: {
        // Trial 30 jours uniquement sur les offres mensuelles
        ...(isMonthly ? { trial_period_days: 30 } : {}),
        // rio absent ici : il sera lu depuis session.custom_fields dans le webhook
        metadata: { userId, plan },
      },

      metadata: { userId, plan },

      success_url: `${baseUrl}/dashboard/subscription?success=1`,
      cancel_url: `${baseUrl}/dashboard/subscription?canceled=1`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[Checkout] Erreur lors de la création de la session :", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
