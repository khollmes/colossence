import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireBusinessProfile } from "@/lib/business-access";
import { isValidTime } from "@/lib/validation/time";

// Sélection commune du membre associé : on ne renvoie que ce qu'il faut pour l'affichage.
const teamMemberSelect = {
  select: { id: true, firstName: true, lastName: true },
} as const;

/**
 * GET /api/oncall
 * Liste les créneaux d'astreinte ACTIFS de l'entreprise connectée, avec le membre associé.
 * Triés par jour puis par heure de début.
 */
export async function GET() {
  try {
    const access = await requireBusinessProfile();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const slots = await prisma.onCallSlot.findMany({
      where: {
        businessProfileId: access.businessProfileId, // ← la frontière entre clients
        isActive: true,
      },
      include: { teamMember: teamMemberSelect },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(slots);
  } catch (error) {
    console.error("Erreur GET /api/oncall:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

/**
 * POST /api/oncall
 * Crée un créneau d'astreinte.
 * Corps : { teamMemberId, dayOfWeek (0-6), startTime "HH:MM", endTime "HH:MM" }
 */
export async function POST(req: NextRequest) {
  try {
    const access = await requireBusinessProfile();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await req.json();

    // ── dayOfWeek : entier entre 0 (dimanche) et 6 (samedi) ──
    const dayOfWeek = body.dayOfWeek;
    if (
      typeof dayOfWeek !== "number" ||
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 0 ||
      dayOfWeek > 6
    ) {
      return NextResponse.json(
        { error: "Le jour doit être un entier entre 0 (dimanche) et 6 (samedi)" },
        { status: 400 }
      );
    }

    // ── Heures au format "HH:MM" ──
    // Note : on n'exige PAS endTime > startTime. Une astreinte de nuit peut chevaucher
    // minuit (ex : 18:00 → 08:00), ce qui est parfaitement valide ici.
    if (!isValidTime(body.startTime)) {
      return NextResponse.json({ error: "Heure de début invalide (HH:MM)" }, { status: 400 });
    }
    if (!isValidTime(body.endTime)) {
      return NextResponse.json({ error: "Heure de fin invalide (HH:MM)" }, { status: 400 });
    }

    // ── ⚠️ Le membre doit appartenir à LA MÊME entreprise (et être actif) ──
    // Sans ce contrôle, on pourrait rattacher une astreinte à un membre d'un AUTRE
    // client en devinant son id. On filtre donc par businessProfileId : si le membre
    // n'est pas dans CETTE entreprise, findFirst renvoie null → on refuse.
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

    const slot = await prisma.onCallSlot.create({
      data: {
        businessProfileId: access.businessProfileId, // ← rattaché à SON entreprise
        teamMemberId,
        dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
      },
      include: { teamMember: teamMemberSelect },
    });

    return NextResponse.json(slot, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/oncall:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
