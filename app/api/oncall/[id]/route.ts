import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireBusinessProfile } from "@/lib/business-access";
import { isValidTime } from "@/lib/validation/time";

// ⚠️ Next.js 16 : `params` est une Promise dans une route dynamique → on l'await.
type RouteContext = { params: Promise<{ id: string }> };

const teamMemberSelect = {
  select: { id: true, firstName: true, lastName: true },
} as const;

/**
 * PATCH /api/oncall/[id]
 * Modifie un créneau. Champs optionnels : teamMemberId, dayOfWeek, startTime, endTime.
 *
 * 🔒 Sécurité : updateMany filtré sur { id ET businessProfileId } → impossible de
 * toucher le créneau d'un autre client (pas d'IDOR). 0 ligne touchée → 404.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const access = await requireBusinessProfile();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { id } = await params;
    const body = await req.json();

    const data: {
      teamMemberId?: string;
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
    } = {};

    // teamMemberId : doit appartenir à la même entreprise (et être actif).
    if (body.teamMemberId !== undefined) {
      const teamMemberId = typeof body.teamMemberId === "string" ? body.teamMemberId : "";
      const member = teamMemberId
        ? await prisma.teamMember.findFirst({
            where: {
              id: teamMemberId,
              businessProfileId: access.businessProfileId,
              isActive: true,
            },
            select: { id: true },
          })
        : null;
      if (!member) {
        return NextResponse.json(
          { error: "Ce membre d'équipe n'existe pas dans votre équipe" },
          { status: 400 }
        );
      }
      data.teamMemberId = teamMemberId;
    }

    if (body.dayOfWeek !== undefined) {
      if (
        typeof body.dayOfWeek !== "number" ||
        !Number.isInteger(body.dayOfWeek) ||
        body.dayOfWeek < 0 ||
        body.dayOfWeek > 6
      ) {
        return NextResponse.json(
          { error: "Le jour doit être un entier entre 0 (dimanche) et 6 (samedi)" },
          { status: 400 }
        );
      }
      data.dayOfWeek = body.dayOfWeek;
    }

    if (body.startTime !== undefined) {
      if (!isValidTime(body.startTime)) {
        return NextResponse.json({ error: "Heure de début invalide (HH:MM)" }, { status: 400 });
      }
      data.startTime = body.startTime;
    }

    if (body.endTime !== undefined) {
      if (!isValidTime(body.endTime)) {
        return NextResponse.json({ error: "Heure de fin invalide (HH:MM)" }, { status: 400 });
      }
      data.endTime = body.endTime;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Aucun champ à modifier" }, { status: 400 });
    }

    const result = await prisma.onCallSlot.updateMany({
      where: {
        id,
        businessProfileId: access.businessProfileId, // ← propriété vérifiée ici
        isActive: true,
      },
      data,
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });
    }

    const updated = await prisma.onCallSlot.findUnique({
      where: { id },
      include: { teamMember: teamMemberSelect },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH /api/oncall/[id]:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/oncall/[id]
 * Soft delete : isActive = false. Même protection de propriété que PATCH.
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const access = await requireBusinessProfile();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { id } = await params;

    const result = await prisma.onCallSlot.updateMany({
      where: {
        id,
        businessProfileId: access.businessProfileId, // ← propriété vérifiée ici
        isActive: true,
      },
      data: { isActive: false },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/oncall/[id]:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
