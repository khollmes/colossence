import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/register";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { success } = checkRateLimit(`register:${ip}`);
  if (!success) {
    return rateLimitResponse();
  }

  try {
    const body = await request.json();

    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    // Transaction : User + BusinessProfile créés ensemble ou pas du tout.
    // Les champs de configuration du secrétariat (horaires, tarifs, zone…)
    // sont initialisés à "" — ils seront remplis lors de la mise en place.
    const user = await prisma.$transaction(async (tx) => {
      return tx.user.create({
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
              // Champs remplis lors de la mise en place
              zoneIntervention: "",
              horaires: "",
              tarifs: "",
              telephoneATransferer: "",
            },
          },
        },
        select: { id: true, email: true, prenom: true, nom: true },
      });
    });

    return NextResponse.json(
      {
        message: "Compte créé avec succès",
        user: { id: user.id, email: user.email, prenom: user.prenom, nom: user.nom },
      },
      { status: 201 }
    );
  } catch (error) {
    // Log détaillé en développement pour diagnostiquer (connexion DB, env vars…)
    console.error("[register] Erreur:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
