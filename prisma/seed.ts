import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcrypt";
import { defaultSpecialPricingCreateData } from "../lib/pricing-defaults";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("Admin123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@colossence.com" },
    update: {},
    create: {
      prenom: "Admin",
      nom: "Colossence",
      email: "admin@colossence.com",
      passwordHash,
      telephone: "0600000000",
      role: "ADMIN",
      businessProfile: {
        create: {
          nomEntreprise: "Colossence Admin",
          siret: "00000000000000",
          metier: "PLOMBIER",
          zoneIntervention: "France entière",
          horaires: "Lun-Ven 9h-18h",
          tarifs: "Sur devis",
          telephoneATransferer: "0600000000",
          aiSecretaryConfig: {
            create: {
              consignes: "Compte admin de test",
              messageAccueil: "Bonjour, bienvenue chez Colossence.",
              isActive: false,
            },
          },
          // 3 lignes de tarif spéciales par défaut (nuit, fériés, déplacement).
          pricingItems: {
            create: defaultSpecialPricingCreateData,
          },
        },
      },
    },
  });

  console.log(`✅ Admin créé : ${admin.email} (mot de passe: Admin123!)`);
  console.log("⚠️  Changez le mot de passe admin en production !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
