import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireBusinessProfile } from "@/lib/business-access";
import { validatePhone } from "@/lib/validation/phone";

// ⚠️ Next.js 16 : dans une route dynamique, `params` est une Promise → on l'await.
type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/team/[id]
 * Modifie un membre. Champs acceptés (tous optionnels) : firstName, lastName, phone, country.
 *
 * 🔒 Le cœur de la sécurité : on N'écrit JAMAIS avec un simple { where: { id } }.
 * On passe par updateMany en filtrant sur { id ET businessProfileId }. Ainsi la
 * propriété est vérifiée DANS la requête SQL elle-même : si le membre appartient
 * à une autre entreprise, AUCUNE ligne ne correspond, donc rien n'est modifié.
 * On répond alors 404 (même réponse que "n'existe pas") pour ne pas révéler
 * l'existence d'un membre d'un autre client.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const access = await requireBusinessProfile();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { id } = await params;
    const body = await req.json();

    // On construit la mise à jour à partir des seuls champs fournis et valides.
    const data: { firstName?: string; lastName?: string; phone?: string } = {};

    if (body.firstName !== undefined) {
      const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
      if (!firstName) {
        return NextResponse.json({ error: "Le prénom ne peut pas être vide" }, { status: 400 });
      }
      data.firstName = firstName;
    }

    if (body.lastName !== undefined) {
      const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
      if (!lastName) {
        return NextResponse.json({ error: "Le nom ne peut pas être vide" }, { status: 400 });
      }
      data.lastName = lastName;
    }

    if (body.phone !== undefined) {
      const country =
        typeof body.country === "string" && body.country ? body.country : "FR";
      const phoneResult = validatePhone(
        typeof body.phone === "string" ? body.phone : "",
        country
      );
      if (!phoneResult.valid) {
        return NextResponse.json({ error: phoneResult.error }, { status: 400 });
      }
      data.phone = phoneResult.formatted!; // normalisé en E.164
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Aucun champ à modifier" }, { status: 400 });
    }

    // updateMany + filtre de propriété = pas d'IDOR possible.
    const result = await prisma.teamMember.updateMany({
      where: {
        id,
        businessProfileId: access.businessProfileId, // ← propriété vérifiée ici
        isActive: true, // on ne modifie pas un membre désactivé
      },
      data,
    });

    // 0 ligne touchée = membre inexistant OU appartenant à un autre client → 404
    if (result.count === 0) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    // On relit la ligne pour renvoyer l'état à jour au client.
    const updated = await prisma.teamMember.findUnique({ where: { id } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH /api/team/[id]:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/team/[id]
 * Soft delete : on ne supprime pas la ligne, on passe isActive à false.
 * Même protection de propriété que PATCH (filtre id + businessProfileId).
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const access = await requireBusinessProfile();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { id } = await params;

    const result = await prisma.teamMember.updateMany({
      where: {
        id,
        businessProfileId: access.businessProfileId, // ← propriété vérifiée ici
        isActive: true, // déjà désactivé → on traite comme "introuvable"
      },
      data: { isActive: false },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/team/[id]:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
