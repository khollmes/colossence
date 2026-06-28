import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireBusinessProfile } from "@/lib/business-access";

// Limites de longueur imposées par le prompt métier.
const GREETING_MAX = 500;
const INSTRUCTIONS_MAX = 1000;

/**
 * GET /api/secretariat-config
 * Renvoie la configuration du secrétariat IA de l'entreprise connectée.
 *
 * 🔒 Sécurité : requireBusinessProfile() résout l'entreprise depuis la session
 * serveur — jamais depuis un paramètre fourni par le client. Un utilisateur ne
 * peut donc lire QUE sa propre config.
 */
export async function GET() {
  try {
    const access = await requireBusinessProfile();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const config = await prisma.aISecretaryConfig.findUnique({
      where: { businessProfileId: access.businessProfileId },
      select: { messageAccueil: true, consignes: true },
    });

    // Si aucune config n'a encore été créée, on renvoie des chaînes vides.
    // Pas d'erreur 404 : c'est un état normal pour une entreprise qui vient de s'inscrire.
    return NextResponse.json({
      greetingMessage: config?.messageAccueil ?? "",
      aiInstructions: config?.consignes ?? "",
    });
  } catch (error) {
    console.error("Erreur GET /api/secretariat-config:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

/**
 * PATCH /api/secretariat-config
 * Met à jour greetingMessage et/ou aiInstructions. Mise à jour partielle possible.
 * Corps : { greetingMessage?: string, aiInstructions?: string }
 *
 * 🔒 Sécurité : même isolation que GET — on écrit uniquement sur l'entreprise
 * de l'utilisateur connecté.
 */
export async function PATCH(req: NextRequest) {
  try {
    const access = await requireBusinessProfile();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await req.json();

    // On construit progressivement l'objet à écrire en base (noms DB internes).
    const data: { messageAccueil?: string; consignes?: string } = {};

    if (body.greetingMessage !== undefined) {
      if (typeof body.greetingMessage !== "string") {
        return NextResponse.json(
          { error: "greetingMessage doit être une chaîne de caractères" },
          { status: 400 }
        );
      }
      if (body.greetingMessage.length > GREETING_MAX) {
        return NextResponse.json(
          { error: `Le message d'accueil ne peut pas dépasser ${GREETING_MAX} caractères` },
          { status: 400 }
        );
      }
      data.messageAccueil = body.greetingMessage;
    }

    if (body.aiInstructions !== undefined) {
      if (typeof body.aiInstructions !== "string") {
        return NextResponse.json(
          { error: "aiInstructions doit être une chaîne de caractères" },
          { status: 400 }
        );
      }
      if (body.aiInstructions.length > INSTRUCTIONS_MAX) {
        return NextResponse.json(
          { error: `Les consignes ne peuvent pas dépasser ${INSTRUCTIONS_MAX} caractères` },
          { status: 400 }
        );
      }
      data.consignes = body.aiInstructions;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Aucun champ à modifier" }, { status: 400 });
    }

    // upsert : crée la ligne AISecretaryConfig si elle n'existe pas encore,
    // sinon la met à jour. Plus sûr qu'un "findUnique puis create/update" séparé
    // car il n'y a pas de risque de condition de course (race condition).
    const updated = await prisma.aISecretaryConfig.upsert({
      where: { businessProfileId: access.businessProfileId },
      update: data,
      create: {
        businessProfileId: access.businessProfileId,
        // À la création, les champs non fournis dans ce PATCH reçoivent une chaîne
        // vide (la base exige une valeur, pas de @default côté Prisma pour ces champs).
        messageAccueil: data.messageAccueil ?? "",
        consignes: data.consignes ?? "",
      },
      select: { messageAccueil: true, consignes: true },
    });

    return NextResponse.json({
      greetingMessage: updated.messageAccueil,
      aiInstructions: updated.consignes,
    });
  } catch (error) {
    console.error("Erreur PATCH /api/secretariat-config:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
