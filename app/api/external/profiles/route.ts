import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  const expectedKey = process.env.EXTERNAL_SERVER_API_KEY;

  if (!expectedKey || apiKey !== expectedKey) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const activeProfiles = await prisma.businessProfile.findMany({
      where: {
        aiSecretaryConfig: {
          isActive: true,
        },
        user: {
          subscriptions: {
            some: {
              status: "ACTIVE",
            },
          },
        },
      },
      include: {
        aiSecretaryConfig: true,
        user: {
          select: {
            id: true,
            email: true,
            prenom: true,
            nom: true,
          },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profiles = activeProfiles.map((bp: any) => ({
      userId: bp.user.id,
      email: bp.user.email,
      prenom: bp.user.prenom,
      nom: bp.user.nom,
      businessProfileId: bp.id,
      nomEntreprise: bp.nomEntreprise,
      metier: bp.metier,
      zoneIntervention: bp.zoneIntervention,
      horaires: bp.horaires,
      tarifs: bp.tarifs,
      telephoneATransferer: bp.telephoneATransferer,
      consignes: bp.aiSecretaryConfig?.consignes || "",
      messageAccueil: bp.aiSecretaryConfig?.messageAccueil || "",
      isActive: bp.aiSecretaryConfig?.isActive ?? false,
    }));

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("[External API] Erreur lors de la récupération des profils:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
