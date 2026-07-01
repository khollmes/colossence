import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { sendEmail, buildPaymentFailedEmail } from "@/lib/email";
import { syncSubscriptionActivated, syncSubscriptionDeactivated } from "@/lib/syncServer";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature invalide";
    console.error(`[Webhook] Erreur de vérification de signature: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`[Webhook] Événement non géré: ${event.type}`);
    }
  } catch (error) {
    console.error(`[Webhook] Erreur lors du traitement de ${event.type}:`, error);
    return NextResponse.json({ error: "Erreur de traitement" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ─── checkout.session.completed ───────────────────────────────────────────────

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan as
    | "STANDARD_MENSUEL"
    | "STANDARD_ANNUEL"
    | "FULLIA_MENSUEL"
    | "FULLIA_ANNUEL"
    | undefined;

  if (!userId || !plan) {
    console.error("[Webhook] Métadonnées manquantes dans la session checkout");
    return;
  }

  const stripeSubscriptionId = session.subscription as string;
  const stripeCustomerId = session.customer as string;

  // Récupérer les détails de l'abonnement Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  await prisma.subscription.create({
    data: {
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      plan,
      status: "TRIALING",
      setupFeePaid: true,
      trialEndsAt: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    },
  });

  // Enregistrer le paiement des frais de mise en ligne
  await prisma.payment.create({
    data: {
      userId,
      stripePaymentId: (session.payment_intent as string | null) ?? session.id,
      montant: 50,
      type: "SETUP_FEE",
      status: "succeeded",
    },
  });

  await logEvent(userId, "checkout.session.completed", {
    stripeSubscriptionId,
    plan,
    setupFeePaid: true,
  });
}

// ─── customer.subscription.updated ───────────────────────────────────────────

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const stripeSubscriptionId = subscription.id;

  const existing = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (!existing) {
    console.error(`[Webhook] Subscription ${stripeSubscriptionId} introuvable en BDD`);
    return;
  }

  const statusMap: Record<string, "INCOMPLETE" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED"> = {
    incomplete: "INCOMPLETE",
    trialing: "TRIALING",
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
  };

  const newStatus = statusMap[subscription.status] || existing.status;

  await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      status: newStatus,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
    },
  });

  // Synchroniser vers le serveur externe selon le changement de statut
  if (newStatus === "ACTIVE") {
    syncSubscriptionActivated(existing.userId).catch((err) =>
      console.error("[Webhook] Erreur sync activation:", err)
    );
  } else if (newStatus === "PAST_DUE" || newStatus === "CANCELED") {
    syncSubscriptionDeactivated(existing.userId, newStatus.toLowerCase()).catch((err) =>
      console.error("[Webhook] Erreur sync désactivation:", err)
    );
  }

  await logEvent(existing.userId, "customer.subscription.updated", {
    stripeSubscriptionId,
    status: newStatus,
    currentPeriodEnd: subscription.current_period_end,
  });
}

// ─── invoice.payment_succeeded ────────────────────────────────────────────────

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const stripeCustomerId = invoice.customer as string;
  const stripeSubscriptionId = invoice.subscription as string;

  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (!subscription) {
    console.error(`[Webhook] Subscription pour invoice ${invoice.id} introuvable`);
    return;
  }

  // Enregistrer le paiement
  await prisma.payment.create({
    data: {
      userId: subscription.userId,
      stripePaymentId: (invoice.payment_intent as string | null) ?? invoice.id,
      montant: (invoice.amount_paid || 0) / 100,
      type: "SUBSCRIPTION",
      status: "succeeded",
    },
  });

  // Marquer les FailedPayment liés comme resolved
  await prisma.failedPayment.updateMany({
    where: {
      userId: subscription.userId,
      resolved: false,
    },
    data: { resolved: true },
  });

  await logEvent(subscription.userId, "invoice.payment_succeeded", {
    invoiceId: invoice.id,
    montant: (invoice.amount_paid || 0) / 100,
    stripeCustomerId,
  });
}

// ─── invoice.payment_failed ──────────────────────────────────────────────────

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = invoice.subscription as string;

  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
    include: { user: true },
  });

  if (!subscription) {
    console.error(`[Webhook] Subscription pour invoice échouée ${invoice.id} introuvable`);
    return;
  }

  // Créer ou incrémenter le FailedPayment
  const existingFailed = await prisma.failedPayment.findFirst({
    where: {
      stripeInvoiceId: invoice.id,
      resolved: false,
    },
  });

  let relances: number;

  if (existingFailed) {
    relances = existingFailed.relances + 1;
    await prisma.failedPayment.update({
      where: { id: existingFailed.id },
      data: { relances },
    });
  } else {
    relances = 1;
    await prisma.failedPayment.create({
      data: {
        userId: subscription.userId,
        stripeInvoiceId: invoice.id,
        montant: (invoice.amount_due || 0) / 100,
        relances: 1,
      },
    });
  }

  // Passer la subscription en PAST_DUE
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "PAST_DUE" },
  });

  // Synchroniser la désactivation vers le serveur externe
  syncSubscriptionDeactivated(subscription.userId, "past_due").catch((err) =>
    console.error("[Webhook] Erreur sync désactivation:", err)
  );

  // Envoyer un email de notification
  const emailData = buildPaymentFailedEmail(
    subscription.user.prenom,
    (invoice.amount_due || 0) / 100,
    relances
  );
  emailData.to = subscription.user.email;
  await sendEmail(emailData);

  // Après 3 relances, désactiver le secrétariat IA
  if (relances >= 3) {
    const businessProfile = await prisma.businessProfile.findUnique({
      where: { userId: subscription.userId },
    });

    if (businessProfile) {
      await prisma.aISecretaryConfig.updateMany({
        where: { businessProfileId: businessProfile.id },
        data: { isActive: false },
      });
    }
  }

  await logEvent(subscription.userId, "invoice.payment_failed", {
    invoiceId: invoice.id,
    montant: (invoice.amount_due || 0) / 100,
    relances,
    secretariatDesactive: relances >= 3,
  });
}

// ─── customer.subscription.deleted ───────────────────────────────────────────

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const stripeSubscriptionId = subscription.id;

  const existing = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (!existing) {
    console.error(`[Webhook] Subscription ${stripeSubscriptionId} introuvable pour suppression`);
    return;
  }

  // Passer le statut en CANCELED
  await prisma.subscription.update({
    where: { id: existing.id },
    data: { status: "CANCELED" },
  });

  // Synchroniser la désactivation vers le serveur externe
  syncSubscriptionDeactivated(existing.userId, "canceled").catch((err) =>
    console.error("[Webhook] Erreur sync désactivation:", err)
  );

  // Désactiver le secrétariat IA
  const businessProfile = await prisma.businessProfile.findUnique({
    where: { userId: existing.userId },
  });

  if (businessProfile) {
    await prisma.aISecretaryConfig.updateMany({
      where: { businessProfileId: businessProfile.id },
      data: { isActive: false },
    });
  }

  await logEvent(existing.userId, "customer.subscription.deleted", {
    stripeSubscriptionId,
  });
}

// ─── Utilitaire de log ───────────────────────────────────────────────────────

async function logEvent(userId: string, action: string, details: Record<string, unknown>) {
  await prisma.log.create({
    data: {
      userId,
      action,
      details: details as object,
    },
  });
}
