import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireBusinessProfile } from "@/lib/business-access";
import { isValidTime } from "@/lib/validation/time";

/**
 * GET /api/night-hours
 * Renvoie les heures de nuit de l'entreprise connectée.
 *
 * Sécurité : on ne lit QUE la ligne dont l'id == businessProfileId de l'utilisateur
 * connecté (résolu côté serveur). Impossible de lire celles d'une autre entreprise.
 */
export async function GET() {
  try {
    const access = await requireBusinessProfile();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const profile = await prisma.businessProfile.findUnique({
      where: { id: access.businessProfileId },
      select: { nightStartTime: true, nightEndTime: true },
    });

    // En théorie impossible (requireBusinessProfile vient de la trouver), mais on reste prudent.
    if (!profile) {
      return NextResponse.json({ error: "Entreprise introuvable" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Erreur GET /api/night-hours:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

/**
 * PATCH /api/night-hours
 * Met à jour les heures de nuit. Corps : { nightStartTime?, nightEndTime? } au format "HH:MM".
 * On accepte une mise à jour partielle (l'une, l'autre, ou les deux).
 */
export async function PATCH(req: NextRequest) {
  try {
    const access = await requireBusinessProfile();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await req.json();
    const data: { nightStartTime?: string; nightEndTime?: string } = {};

    if (body.nightStartTime !== undefined) {
      if (!isValidTime(body.nightStartTime)) {
        return NextResponse.json(
          { error: "Heure de début invalide (format attendu : HH:MM)" },
          { status: 400 }
        );
      }
      data.nightStartTime = body.nightStartTime;
    }

    if (body.nightEndTime !== undefined) {
      if (!isValidTime(body.nightEndTime)) {
        return NextResponse.json(
          { error: "Heure de fin invalide (format attendu : HH:MM)" },
          { status: 400 }
        );
      }
      data.nightEndTime = body.nightEndTime;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Aucune heure à modifier" }, { status: 400 });
    }

    // L'id ciblé EST le businessProfileId de l'utilisateur connecté → mise à jour
    // intrinsèquement cloisonnée (on ne peut écrire que sur sa propre entreprise).
    const updated = await prisma.businessProfile.update({
      where: { id: access.businessProfileId },
      data,
      select: { nightStartTime: true, nightEndTime: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH /api/night-hours:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
