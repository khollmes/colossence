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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { businessProfile: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    prenom: user.prenom,
    nom: user.nom,
    email: user.email,
    telephone: user.telephone || "",
    nomEntreprise: user.businessProfile?.nomEntreprise || "",
    siret: user.businessProfile?.siret || "",
    metier: user.businessProfile?.metier || "",
    zoneIntervention: user.businessProfile?.zoneIntervention || "",
    tarifs: user.businessProfile?.tarifs || "",
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

    const { prenom, nom, telephone, nomEntreprise, siret, metier, zoneIntervention, tarifs } = body;

    // Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(prenom && { prenom }),
        ...(nom && { nom }),
        ...(telephone !== undefined && { telephone }),
      },
    });

    // Mettre à jour ou créer le BusinessProfile
    if (nomEntreprise || siret || metier || zoneIntervention || tarifs) {
      const existing = await prisma.businessProfile.findUnique({
        where: { userId },
      });

      if (existing) {
        await prisma.businessProfile.update({
          where: { userId },
          data: {
            ...(nomEntreprise && { nomEntreprise }),
            ...(siret && { siret }),
            ...(metier && { metier }),
            ...(zoneIntervention && { zoneIntervention }),
            ...(tarifs && { tarifs }),
          },
        });
      } else {
        await prisma.businessProfile.create({
          data: {
            userId,
            nomEntreprise: nomEntreprise || "",
            siret: siret || "",
            metier: metier || "SERRURIER",
            zoneIntervention: zoneIntervention || "",
            horaires: "",
            tarifs: tarifs || "",
            telephoneATransferer: "",
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
