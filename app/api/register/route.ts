import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/register";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 }
      );
    }

    // Hash le mot de passe
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Créer User + BusinessProfile + AISecretaryConfig en une transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          prenom: data.prenom,
          nom: data.nom,
          email: data.email,
          passwordHash,
          telephone: data.telephone,
          businessProfile: {
            create: {
              nomEntreprise: data.nomEntreprise,
              siret: data.siret,
              metier: data.metier,
              zoneIntervention: data.zoneIntervention,
              horaires: data.horaires,
              tarifs: data.tarifs,
              telephoneATransferer: data.telephoneATransferer,
              aiSecretaryConfig: {
                create: {
                  consignes: "",
                  messageAccueil: `Bonjour, vous êtes bien chez ${data.nomEntreprise}. Comment puis-je vous aider ?`,
                  isActive: true,
                },
              },
            },
          },
        },
        include: {
          businessProfile: {
            include: { aiSecretaryConfig: true },
          },
        },
      });

      return newUser;
    });

    return NextResponse.json(
      {
        message: "Compte créé avec succès",
        user: {
          id: user.id,
          email: user.email,
          prenom: user.prenom,
          nom: user.nom,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
