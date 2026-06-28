import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireBusinessProfile } from "@/lib/business-access";
import { validatePhone } from "@/lib/validation/phone";

/**
 * GET /api/team
 * Liste les membres ACTIFS de l'entreprise de l'utilisateur connecté.
 *
 * Sécurité : le `where` filtre sur businessProfileId (= celui de l'utilisateur
 * connecté, résolu côté serveur). La requête ne peut donc PHYSIQUEMENT pas
 * remonter les membres d'une autre entreprise.
 */
export async function GET() {
  try {
    const access = await requireBusinessProfile();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const members = await prisma.teamMember.findMany({
      where: {
        businessProfileId: access.businessProfileId, // ← la frontière entre clients
        isActive: true, // on n'affiche pas les membres "soft-deleted"
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Erreur GET /api/team:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

/**
 * POST /api/team
 * Crée un membre d'équipe pour l'entreprise de l'utilisateur connecté.
 * Corps attendu : { firstName, lastName, phone, country? }
 */
export async function POST(req: NextRequest) {
  try {
    const access = await requireBusinessProfile();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await req.json();

    // ── Validation du prénom / nom ──
    // On normalise (trim) puis on refuse les chaînes vides.
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Le prénom et le nom sont obligatoires" },
        { status: 400 }
      );
    }

    // ── Validation du téléphone ──
    // validatePhone a besoin d'un pays (FR par défaut, surchargeable via body.country).
    // En cas de succès, il renvoie le numéro normalisé en E.164 (+33...) qu'on stocke.
    const country =
      typeof body.country === "string" && body.country ? body.country : "FR";
    const phoneResult = validatePhone(
      typeof body.phone === "string" ? body.phone : "",
      country
    );

    if (!phoneResult.valid) {
      return NextResponse.json({ error: phoneResult.error }, { status: 400 });
    }

    const member = await prisma.teamMember.create({
      data: {
        businessProfileId: access.businessProfileId, // ← rattaché à SON entreprise
        firstName,
        lastName,
        phone: phoneResult.formatted!, // format E.164 garanti par la validation
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/team:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
