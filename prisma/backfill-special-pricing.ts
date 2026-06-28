/**
 * Script ponctuel : crée les 3 lignes de tarif spéciales (à 0 €) pour les
 * entreprises qui existaient AVANT qu'on les génère à l'inscription.
 *
 * Idempotent : pour chaque entreprise et chaque type spécial, on ne crée la ligne
 * QUE si elle n'existe pas déjà. On peut donc relancer ce script sans rien dupliquer.
 *
 * Lancement : npx tsx prisma/backfill-special-pricing.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { DEFAULT_SPECIAL_PRICING } from "../lib/pricing-defaults";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const profiles = await prisma.businessProfile.findMany({ select: { id: true } });
  console.log(`🔎 ${profiles.length} entreprise(s) à vérifier…`);

  let created = 0;

  for (const profile of profiles) {
    for (const special of DEFAULT_SPECIAL_PRICING) {
      // Existe-t-il déjà une ligne de ce type pour cette entreprise ?
      const existing = await prisma.pricingItem.findFirst({
        where: { businessProfileId: profile.id, type: special.type },
        select: { id: true },
      });

      if (!existing) {
        await prisma.pricingItem.create({
          data: {
            businessProfileId: profile.id,
            name: special.name,
            price: 0,
            type: special.type,
          },
        });
        created++;
      }
    }
  }

  console.log(`✅ Backfill terminé : ${created} ligne(s) spéciale(s) créée(s).`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du backfill:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
