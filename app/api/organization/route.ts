import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireBusinessProfile } from "@/lib/business-access";

// Regex de validation d'email : vérifie la présence d'un "@" et d'un "." après.
// Volontairement simple — une validation parfaite (RFC 5322) est trop complexe
// pour le gain. On bloque les saisies clairement invalides ; un vrai email
// invalide qui passe sera rejeté lors de l'envoi de l'email de toute façon.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GET /api/organization
 * Renvoie les informations de l'entreprise de l'utilisateur connecté.
 *
 * Champs renvoyés :
 *   - nomEntreprise, contactEmail, aiPhoneNumber (depuis BusinessProfile)
 *   - subscriptionPlan, subscriptionStatus, nextBillingDate (depuis Subscription)
 *
 * 🔒 Sécurité : requireBusinessProfile() résout l'entreprise depuis la session
 * serveur — un utilisateur voit uniquement SA propre entreprise.
 */
export async function GET() {
  try {
    const access = await requireBusinessProfile();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    // On récupère le BusinessProfile ET l'abonnement en une seule requête Prisma.
    // La traversée BusinessProfile → user → subscriptions est possible grâce aux
    // relations définies dans le schéma (BusinessProfile.user + User.subscriptions).
    const profile = await prisma.businessProfile.findUnique({
      where: { id: access.businessProfileId },
      select: {
        nomEntreprise: true,
        contactEmail: true,
        aiPhoneNumber: true,
        user: {
          select: {
            subscriptions: {
              // Récupère l'abonnement le plus récent (fin de période la plus éloignée).
              // "orderBy: desc + take: 1" est plus fiable qu'un filtre sur status=ACTIVE
              // car un client peut être PAST_DUE (abonnement toujours actif techniquement).
              orderBy: { currentPeriodEnd: "desc" },
              take: 1,
              select: {
                plan: true,
                status: true,
                currentPeriodEnd: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Entreprise introuvable" }, { status: 404 });
    }

    // Extraire l'abonnement courant (peut être absent si l'utilisateur n'a pas d'abonnement).
    const subscription = profile.user.subscriptions[0] ?? null;

    return NextResponse.json({
      nomEntreprise: profile.nomEntreprise,
      contactEmail: profile.contactEmail,     // null si non renseigné
      aiPhoneNumber: profile.aiPhoneNumber,   // null tant que non provisionné
      // Champs d'abonnement — null si aucun abonnement enregistré.
      subscriptionPlan: subscription?.plan ?? null,
      subscriptionStatus: subscription?.status ?? null,
      nextBillingDate: subscription?.currentPeriodEnd ?? null,
    });
  } catch (error) {
    console.error("Erreur GET /api/organization:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

/**
 * PATCH /api/organization
 * Met à jour uniquement les champs modifiables par l'utilisateur.
 *
 * ✅ Modifiable : nomEntreprise, contactEmail
 * 🚫 Refusé explicitement :
 *   - aiPhoneNumber : provisionné par Colossence, pas par l'utilisateur
 *   - subscriptionPlan / Status / nextBillingDate : gérés par Stripe via webhooks
 *
 * Corps attendu : { nomEntreprise?: string, contactEmail?: string | null }
 */
export async function PATCH(req: NextRequest) {
  try {
    const access = await requireBusinessProfile();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await req.json();

    // ── Détection des champs interdits ───────────────────────────────────────
    // On rejette explicitement toute tentative de modifier un champ sensible
    // plutôt que de l'ignorer silencieusement — ainsi, le front sait qu'il
    // envoie quelque chose d'incorrect (bug à corriger, pas à masquer).
    const FORBIDDEN_FIELDS = [
      "aiPhoneNumber",
      "subscriptionPlan",
      "subscriptionStatus",
      "nextBillingDate",
      "stripeCustomerId",
    ];
    const attempted = FORBIDDEN_FIELDS.filter((f) => body[f] !== undefined);
    if (attempted.length > 0) {
      return NextResponse.json(
        {
          error: `Ces champs ne peuvent pas être modifiés directement : ${attempted.join(", ")}`,
        },
        { status: 403 }
      );
    }

    // ── Construction de l'objet de mise à jour ───────────────────────────────
    const data: { nomEntreprise?: string; contactEmail?: string | null } = {};

    if (body.nomEntreprise !== undefined) {
      if (typeof body.nomEntreprise !== "string" || body.nomEntreprise.trim().length === 0) {
        return NextResponse.json(
          { error: "Le nom de l'entreprise ne peut pas être vide" },
          { status: 400 }
        );
      }
      data.nomEntreprise = body.nomEntreprise.trim();
    }

    if (body.contactEmail !== undefined) {
      // null ou chaîne vide → efface le champ (l'IA utilisera l'email du compte).
      if (body.contactEmail === null || body.contactEmail === "") {
        data.contactEmail = null;
      } else if (typeof body.contactEmail !== "string") {
        return NextResponse.json(
          { error: "contactEmail doit être une chaîne de caractères ou null" },
          { status: 400 }
        );
      } else if (!EMAIL_REGEX.test(body.contactEmail.trim())) {
        return NextResponse.json(
          { error: "L'adresse email de contact n'est pas valide" },
          { status: 400 }
        );
      } else {
        data.contactEmail = body.contactEmail.trim().toLowerCase();
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Aucun champ à modifier" }, { status: 400 });
    }

    // Mise à jour ciblée par businessProfileId (isolation garantie).
    const updated = await prisma.businessProfile.update({
      where: { id: access.businessProfileId },
      data,
      select: { nomEntreprise: true, contactEmail: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH /api/organization:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
