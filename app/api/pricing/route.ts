import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireBusinessProfile } from "@/lib/business-access";

/**
 * GET /api/pricing
 * Liste les tarifs ACTIFS de l'entreprise connectée.
 * Tri : les lignes STANDARD d'abord, puis les lignes spéciales (majorations, déplacement).
 *
 * Sécurité : le `where` filtre sur businessProfileId → impossible de voir les
 * tarifs d'une autre entreprise.
 */
export async function GET() {
  try {
    const access = await requireBusinessProfile();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const items = await prisma.pricingItem.findMany({
      where: {
        businessProfileId: access.businessProfileId, // ← la frontière entre clients
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    // On met les prestations STANDARD en tête, puis les lignes spéciales.
    // Tri explicite (plutôt que de dépendre de l'ordre de l'enum) : c'est plus lisible
    // et ça ne casse pas si on réorganise l'enum un jour.
    const standard = items.filter((item) => item.type === "STANDARD");
    const special = items.filter((item) => item.type !== "STANDARD");

    return NextResponse.json([...standard, ...special]);
  } catch (error) {
    console.error("Erreur GET /api/pricing:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

/**
 * POST /api/pricing
 * Crée une prestation de type STANDARD.
 * Corps attendu : { name, price } où price est en EUROS (ex : 150 ou 150.5).
 *
 * Les lignes spéciales (majorations, déplacement) ne se créent pas ici : elles sont
 * gérées à part. Cet endpoint force donc le type STANDARD.
 */
export async function POST(req: NextRequest) {
  try {
    const access = await requireBusinessProfile();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await req.json();

    // ── Validation du nom ──
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "Le nom de la prestation est obligatoire" },
        { status: 400 }
      );
    }

    // ── Validation du prix (en euros) ──
    // On exige un nombre strictement positif. Le front peut envoyer un décimal
    // (ex : 150.5 €), c'est la conversion en centimes qui s'occupera de l'arrondi.
    const priceEuros = body.price;
    if (typeof priceEuros !== "number" || !isFinite(priceEuros) || priceEuros <= 0) {
      return NextResponse.json(
        { error: "Le prix doit être un nombre strictement positif" },
        { status: 400 }
      );
    }

    // ── Conversion euros → centimes ──
    // On multiplie par 100 puis on arrondit (voir explication détaillée). Math.round
    // corrige les micro-erreurs des flottants : 150.5 * 100 peut donner 15049.999…
    const priceCents = Math.round(priceEuros * 100);

    const item = await prisma.pricingItem.create({
      data: {
        businessProfileId: access.businessProfileId, // ← rattaché à SON entreprise
        name,
        price: priceCents, // stocké en centimes (Int)
        type: "STANDARD",
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/pricing:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
