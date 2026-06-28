import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireBusinessProfile } from "@/lib/business-access";

// Valeurs acceptées pour le filtre ?outcome=
// Duplique l'enum CallOutcome du schéma Prisma sous forme de tableau de strings.
// Raison : le client généré n'est pas disponible avant la migration — et le
// pattern du projet évite d'importer les enums depuis "generated/" dans le code
// applicatif (voir lib/pricing-defaults.ts pour le même pattern avec PricingType).
const VALID_OUTCOMES = ["APPOINTMENT", "MESSAGE", "TRANSFERRED", "MISSED"] as const;
type CallOutcome = (typeof VALID_OUTCOMES)[number];

/**
 * GET /api/calls
 * Renvoie les appels de l'entreprise connectée, triés du plus récent au plus ancien.
 *
 * Paramètres optionnels :
 *   ?outcome=APPOINTMENT|MESSAGE|TRANSFERRED|MISSED  → filtre par résultat
 *   ?search=0612345678                               → filtre par numéro (partiel)
 *
 * 🔒 Sécurité : requireBusinessProfile() résout l'entreprise depuis la session
 * serveur — jamais depuis un paramètre client. Un utilisateur ne voit que
 * les appels de SA propre entreprise.
 */
export async function GET(req: NextRequest) {
  try {
    const access = await requireBusinessProfile();
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { searchParams } = req.nextUrl;
    const outcomeParam = searchParams.get("outcome");
    const searchParam = searchParams.get("search");

    // ── Validation de ?outcome= ──────────────────────────────────────────────
    // Si le paramètre est présent mais invalide, on retourne 400 plutôt que de
    // l'ignorer silencieusement — un paramètre malformé est probablement une erreur
    // côté client (faute de frappe, version décalée de l'API).
    if (outcomeParam !== null && !VALID_OUTCOMES.includes(outcomeParam as CallOutcome)) {
      return NextResponse.json(
        {
          error: `Valeur de filtre invalide. Valeurs acceptées : ${VALID_OUTCOMES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // ── Construction du filtre WHERE ─────────────────────────────────────────
    // On commence toujours par businessProfileId : c'est la frontière de sécurité.
    // Les autres critères s'ajoutent par-dessus.
    const where = {
      businessProfileId: access.businessProfileId,

      // Filtre résultat : ajouté seulement si le paramètre est présent et valide.
      ...(outcomeParam && { outcome: outcomeParam as CallOutcome }),

      // Filtre numéro : recherche partielle, insensible à la casse.
      // "contains" en SQL → WHERE callerNumber ILIKE '%06123%'
      // "mode: insensitive" est nécessaire car PostgreSQL est sensible à la casse
      // par défaut pour LIKE (contrairement à MySQL).
      ...(searchParam?.trim() && {
        callerNumber: {
          contains: searchParam.trim(),
          mode: "insensitive" as const,
        },
      }),
    };

    const calls = await prisma.callLog.findMany({
      where,
      orderBy: { startedAt: "desc" }, // plus récent d'abord
      select: {
        id: true,
        callerNumber: true,
        startedAt: true,
        durationSec: true,
        outcome: true,
        transcript: true,
        audioUrl: true,
        createdAt: true,
        // businessProfileId est volontairement exclu : information interne
        // qui ne doit pas fuiter vers le front-end.
      },
    });

    return NextResponse.json(calls);
  } catch (error) {
    console.error("Erreur GET /api/calls:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
