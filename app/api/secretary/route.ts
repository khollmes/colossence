import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const businessProfile = await prisma.businessProfile.findUnique({
    where: { userId },
    include: { aiSecretaryConfig: true },
  });

  if (!businessProfile) {
    return NextResponse.json({ consignes: "", messageAccueil: "", horaires: "", telephoneATransferer: "" });
  }

  return NextResponse.json({
    consignes: businessProfile.aiSecretaryConfig?.consignes || "",
    messageAccueil: businessProfile.aiSecretaryConfig?.messageAccueil || "",
    horaires: businessProfile.horaires,
    telephoneATransferer: businessProfile.telephoneATransferer,
  });
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();

    const { consignes, messageAccueil, horaires, telephoneATransferer } = body;

    // Récupérer ou créer le BusinessProfile
    let businessProfile = await prisma.businessProfile.findUnique({
      where: { userId },
      include: { aiSecretaryConfig: true },
    });

    if (!businessProfile) {
      return NextResponse.json(
        { error: "Profil entreprise introuvable. Veuillez d'abord compléter votre profil." },
        { status: 400 }
      );
    }

    // Mettre à jour horaires et téléphone sur le BusinessProfile
    if (horaires || telephoneATransferer) {
      await prisma.businessProfile.update({
        where: { id: businessProfile.id },
        data: {
          ...(horaires && { horaires }),
          ...(telephoneATransferer && { telephoneATransferer }),
        },
      });
    }

    // Créer ou mettre à jour la config du secrétariat IA
    if (businessProfile.aiSecretaryConfig) {
      await prisma.aISecretaryConfig.update({
        where: { id: businessProfile.aiSecretaryConfig.id },
        data: {
          ...(consignes !== undefined && { consignes }),
          ...(messageAccueil !== undefined && { messageAccueil }),
        },
      });
    } else {
      await prisma.aISecretaryConfig.create({
        data: {
          businessProfileId: businessProfile.id,
          consignes: consignes || "",
          messageAccueil: messageAccueil || "",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du secrétariat:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
