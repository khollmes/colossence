import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireBusinessProfile } from "@/lib/business-access";

// ⚠️ Next.js 16 : dans une route dynamique, `params` est une Promise → on l'await.
type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/pricing/[id]
 * Modifie le nom et/ou le prix d'un tarif. Corps : { name?, price? } (price en EUROS).
 * Autorisé sur TOUS les types, y compris les lignes spéciales (on peut changer
 * leur prix — mais pas les supprimer, voir DELETE).
 *
 * 🔒 Sécurité : updateMany filtré sur { id ET businessProfileId }. La propriété est
 * vérifiée DANS la requête SQL → pas d'IDOR possible. 0 ligne touchée → 404.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const access = await requireBusinessProfile();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { id } = await params;
    const body = await req.json();

    const data: { name?: string; price?: number } = {};

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) {
        return NextResponse.json({ error: "Le nom ne peut pas être vide" }, { status: 400 });
      }
      data.name = name;
    }

    if (body.price !== undefined) {
      const priceEuros = body.price;
      if (typeof priceEuros !== "number" || !isFinite(priceEuros) || priceEuros <= 0) {
        return NextResponse.json(
          { error: "Le prix doit être un nombre strictement positif" },
          { status: 400 }
        );
      }
      // Conversion euros → centimes (voir explication). Math.round = arrondi au centime.
      data.price = Math.round(priceEuros * 100);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Aucun champ à modifier" }, { status: 400 });
    }

    const result = await prisma.pricingItem.updateMany({
      where: {
        id,
        businessProfileId: access.businessProfileId, // ← propriété vérifiée ici
        isActive: true,
      },
      data,
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Tarif introuvable" }, { status: 404 });
    }

    const updated = await prisma.pricingItem.findUnique({ where: { id } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH /api/pricing/[id]:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/pricing/[id]
 * Soft delete (isActive = false) — mais UNIQUEMENT pour les prestations STANDARD.
 *
 * Règle métier : les lignes spéciales (NIGHT_SURCHARGE, HOLIDAY_SURCHARGE, TRAVEL)
 * ne peuvent PAS être supprimées (on peut seulement modifier leur prix via PATCH).
 * On a donc besoin de connaître le `type` AVANT de supprimer → on lit la ligne
 * d'abord (toujours filtrée par businessProfileId pour la sécurité).
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const access = await requireBusinessProfile();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { id } = await params;

    // 1. On récupère la ligne — filtrée par businessProfileId (sécurité : on ne lit
    //    que CE qui appartient à l'utilisateur). Absente → 404.
    const item = await prisma.pricingItem.findFirst({
      where: {
        id,
        businessProfileId: access.businessProfileId,
        isActive: true,
      },
      select: { type: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Tarif introuvable" }, { status: 404 });
    }

    // 2. Règle métier : seules les prestations STANDARD sont supprimables.
    if (item.type !== "STANDARD") {
      return NextResponse.json(
        { error: "Les tarifs spéciaux ne peuvent pas être supprimés, seulement modifiés" },
        { status: 403 }
      );
    }

    // 3. Soft delete, en regardant à nouveau businessProfileId dans le where (ceinture
    //    et bretelles : la propriété est revérifiée au moment de l'écriture).
    const result = await prisma.pricingItem.updateMany({
      where: {
        id,
        businessProfileId: access.businessProfileId,
        type: "STANDARD",
        isActive: true,
      },
      data: { isActive: false },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Tarif introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/pricing/[id]:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
