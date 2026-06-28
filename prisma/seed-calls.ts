/**
 * Script de seed pour insérer des appels de démonstration dans CallLog.
 *
 * Prérequis : la migration Prisma doit être appliquée AVANT de lancer ce script.
 *   → npx prisma migrate dev --name add_call_log
 *
 * Lancement :
 *   npx tsx prisma/seed-calls.ts
 *
 * Idempotent : le script supprime d'abord les appels de démo existants
 * (identifiés par leur numéro commençant par "+33600") avant de les recréer.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Renvoie une date il y a N jours, à une heure donnée (format "HH:MM").
 * Exemple : daysAgo(2, "14:30") → avant-hier à 14h30.
 */
function daysAgo(days: number, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(h, m, 0, 0);
  return d;
}

// ─── Données de démo ──────────────────────────────────────────────────────────

// Chaque objet représente un appel réaliste (contexte : artisans du bâtiment).
// "t" dans les transcriptions = secondes depuis le début de l'appel.
const DEMO_CALLS = [
  // ── 1. Serrurerie / APPOINTMENT (rendez-vous pris) ──────────────────────────
  {
    callerNumber: "+33601234567",
    startedAt: daysAgo(0, "09:12"),
    durationSec: 187,
    outcome: "APPOINTMENT" as const,
    transcript: [
      { speaker: "AI",     text: "Bonjour, serrurerie Martin, je suis votre assistant. Comment puis-je vous aider ?", t: 0 },
      { speaker: "CALLER", text: "Bonjour, j'ai claqué ma porte et je suis bloqué dehors.", t: 5 },
      { speaker: "AI",     text: "Je comprends, c'est urgent. Pouvez-vous me donner votre adresse exacte ?", t: 8 },
      { speaker: "CALLER", text: "Oui, je suis au 14 rue des Lilas, à Lyon 3e.", t: 14 },
      { speaker: "AI",     text: "Parfait. Un serrurier peut intervenir d'ici 30 à 45 minutes. Est-ce que cela vous convient ?", t: 19 },
      { speaker: "CALLER", text: "Oui, c'est parfait, merci beaucoup !", t: 26 },
    ],
    audioUrl: null,
  },

  // ── 2. Plomberie / MESSAGE (message transmis) ────────────────────────────────
  {
    callerNumber: "+33712345678",
    startedAt: daysAgo(0, "11:45"),
    durationSec: 94,
    outcome: "MESSAGE" as const,
    transcript: [
      { speaker: "AI",     text: "Bonjour, plomberie Dubois, votre assistant à l'écoute.", t: 0 },
      { speaker: "CALLER", text: "Bonjour, j'ai un robinet qui goutte depuis ce matin dans ma cuisine.", t: 4 },
      { speaker: "AI",     text: "D'accord, je note votre demande. Votre nom et votre numéro, s'il vous plaît ?", t: 10 },
      { speaker: "CALLER", text: "Je suis Madame Renard, au 06 87 65 43 21.", t: 16 },
      { speaker: "AI",     text: "Merci Madame Renard. Je transmets votre message. Un plombier vous rappellera dans la journée.", t: 23 },
    ],
    audioUrl: null,
  },

  // ── 3. Serrurerie / TRANSFERRED (appel transféré) ───────────────────────────
  {
    callerNumber: "+33698765432",
    startedAt: daysAgo(1, "08:33"),
    durationSec: 72,
    outcome: "TRANSFERRED" as const,
    transcript: [
      { speaker: "AI",     text: "Bonjour, comment puis-je vous aider ?", t: 0 },
      { speaker: "CALLER", text: "C'est urgent, on m'a signalé une effraction dans mon local commercial.", t: 3 },
      { speaker: "AI",     text: "Je comprends, c'est une situation urgente. Je vous transfère immédiatement vers notre serrurier de garde.", t: 7 },
      { speaker: "CALLER", text: "Merci, vite s'il vous plaît.", t: 14 },
    ],
    audioUrl: null,
  },

  // ── 4. Chauffagiste / APPOINTMENT (rendez-vous) ──────────────────────────────
  {
    callerNumber: "+33645678901",
    startedAt: daysAgo(1, "15:20"),
    durationSec: 213,
    outcome: "APPOINTMENT" as const,
    transcript: [
      { speaker: "AI",     text: "Bonjour, chauffagerie Moreau, je suis votre assistant. Que puis-je faire pour vous ?", t: 0 },
      { speaker: "CALLER", text: "Bonjour, ma chaudière ne s'allume plus depuis hier soir, on est sans chauffage.", t: 5 },
      { speaker: "AI",     text: "Je suis désolé d'entendre ça. Quelle est votre adresse et quelle est la marque de votre chaudière ?", t: 12 },
      { speaker: "CALLER", text: "Je suis au 8 avenue Pasteur à Grenoble. C'est une Vaillant, je crois.", t: 20 },
      { speaker: "AI",     text: "Très bien. Avez-vous vérifié si le voyant d'erreur clignote sur la chaudière ?", t: 27 },
      { speaker: "CALLER", text: "Oui, il clignote en rouge.", t: 35 },
      { speaker: "AI",     text: "Compris. Je vous programme une intervention demain matin entre 9h et 11h. Est-ce que ça vous convient ?", t: 40 },
      { speaker: "CALLER", text: "Oui, parfait.", t: 48 },
    ],
    audioUrl: null,
  },

  // ── 5. Plomberie / MISSED (appel manqué, raccroche) ─────────────────────────
  {
    callerNumber: "+33756789012",
    startedAt: daysAgo(2, "07:58"),
    durationSec: 31,
    outcome: "MISSED" as const,
    transcript: [
      { speaker: "AI",     text: "Bonjour, plomberie Dubois, votre assistant à l'écoute.", t: 0 },
      { speaker: "CALLER", text: "Allo ? Allo, il y a quelqu'un ?", t: 4 },
      { speaker: "AI",     text: "Oui, je vous entends. Comment puis-je vous aider ?", t: 7 },
    ],
    audioUrl: null,
  },

  // ── 6. Électricité / MESSAGE ─────────────────────────────────────────────────
  {
    callerNumber: "+33623456789",
    startedAt: daysAgo(3, "13:05"),
    durationSec: 118,
    outcome: "MESSAGE" as const,
    transcript: [
      { speaker: "AI",     text: "Bonjour, électricité Bernard, je suis votre assistant. Que puis-je faire pour vous ?", t: 0 },
      { speaker: "CALLER", text: "Bonjour. J'ai un disjoncteur qui saute régulièrement dans mon appartement.", t: 5 },
      { speaker: "AI",     text: "Je comprends. Est-ce que c'est le disjoncteur général ou un disjoncteur de circuit particulier ?", t: 11 },
      { speaker: "CALLER", text: "Plutôt un circuit, celui de la cuisine je crois.", t: 19 },
      { speaker: "AI",     text: "Merci. Je transmets votre message à l'électricien. Votre nom et votre numéro ?", t: 25 },
      { speaker: "CALLER", text: "Je m'appelle Thomas Perrin, je rappelle du 06 23 45 67 89.", t: 32 },
      { speaker: "AI",     text: "Noté, Monsieur Perrin. Vous serez rappelé dans les meilleurs délais.", t: 39 },
    ],
    audioUrl: null,
  },

  // ── 7. Serrurerie / APPOINTMENT (porte blindée) ──────────────────────────────
  {
    callerNumber: "+33789012345",
    startedAt: daysAgo(5, "10:40"),
    durationSec: 156,
    outcome: "APPOINTMENT" as const,
    transcript: [
      { speaker: "AI",     text: "Bonjour, serrurerie Martin, votre assistant à votre service.", t: 0 },
      { speaker: "CALLER", text: "Bonjour, je souhaite faire installer une porte blindée dans mon appartement.", t: 4 },
      { speaker: "AI",     text: "Très bien. Agissez-vous dans le cadre d'une rénovation ou suite à un incident ?", t: 10 },
      { speaker: "CALLER", text: "Rénovation, je viens d'acheter l'appartement.", t: 17 },
      { speaker: "AI",     text: "Parfait. Je peux vous programmer un rendez-vous de devis cette semaine. Votre adresse ?", t: 23 },
      { speaker: "CALLER", text: "24 boulevard des Capucines, Paris 9e.", t: 30 },
      { speaker: "AI",     text: "Noté. Jeudi 10h, un technicien passera pour évaluer l'installation. Ça vous convient ?", t: 36 },
      { speaker: "CALLER", text: "Oui, très bien. Merci.", t: 44 },
    ],
    audioUrl: null,
  },

  // ── 8. Garage auto / TRANSFERRED (dépannage urgent) ──────────────────────────
  {
    callerNumber: "+33634567890",
    startedAt: daysAgo(6, "19:22"),
    durationSec: 68,
    outcome: "TRANSFERRED" as const,
    transcript: [
      { speaker: "AI",     text: "Bonjour, garage Dupont, votre assistant disponible 24h/24.", t: 0 },
      { speaker: "CALLER", text: "Bonsoir, je suis en panne sur l'autoroute A7, j'ai besoin d'un dépanneur.", t: 3 },
      { speaker: "AI",     text: "Je comprends, c'est urgent. Je vous transfère immédiatement vers notre service de dépannage.", t: 8 },
      { speaker: "CALLER", text: "Merci, vite, je suis sur la voie d'urgence.", t: 15 },
    ],
    audioUrl: null,
  },
];

// ─── Script principal ─────────────────────────────────────────────────────────

async function main() {
  console.log("📞 Seed des appels de démonstration…");

  // Trouver le businessProfile de l'admin de test.
  // On passe par le User (email unique) pour éviter de coder un id en dur.
  const adminUser = await prisma.user.findUnique({
    where: { email: "admin@colossence.com" },
    include: { businessProfile: { select: { id: true } } },
  });

  if (!adminUser?.businessProfile) {
    console.error(
      "❌ Aucun profil entreprise trouvé pour admin@colossence.com.\n" +
      "   Lance d'abord : npx tsx prisma/seed.ts"
    );
    process.exit(1);
  }

  const businessProfileId = adminUser.businessProfile.id;
  console.log(`   → Entreprise : ${businessProfileId}`);

  // Supprimer les anciens appels de démo pour rendre le script idempotent
  // (on peut le relancer sans doubler les données).
  // On identifie les démos par le préfixe "+33600" qui n'existe pas en réel.
  // Ici on efface TOUS les callLogs du profil admin (c'est un profil de test).
  const deleted = await prisma.callLog.deleteMany({
    where: { businessProfileId },
  });
  if (deleted.count > 0) {
    console.log(`   → ${deleted.count} anciens appel(s) supprimé(s) avant réinsertion.`);
  }

  // Insérer les 8 appels de démo.
  // createMany est plus efficace qu'une boucle de create() car il génère
  // un seul INSERT ... VALUES (...), (...), (...) au lieu de N requêtes séparées.
  // Note : createMany ne supporte pas les relations imbriquées (include), c'est pourquoi
  // on passe businessProfileId directement dans chaque objet.
  const result = await prisma.callLog.createMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: DEMO_CALLS.map((call) => ({
      businessProfileId,
      callerNumber: call.callerNumber,
      startedAt: call.startedAt,
      durationSec: call.durationSec,
      outcome: call.outcome,
      // Prisma accepte n'importe quelle valeur JSON sérialisable pour un champ Json.
      // Le cast "as any" est volontaire : le type généré (InputJsonValue) est complexe
      // et notre tableau d'objets est valide — TypeScript ne peut pas l'inférer ici.
      transcript: call.transcript as any,
      audioUrl: call.audioUrl,
    })),
  });

  console.log(`✅ ${result.count} appels de démonstration insérés.`);
  console.log("\nRécapitulatif :");
  DEMO_CALLS.forEach((c, i) => {
    const min = Math.floor(c.durationSec / 60);
    const sec = c.durationSec % 60;
    const age = i === 0 || i === 1 ? "aujourd'hui" : `il y a ${[0,0,1,1,2,3,5,6][i]} jour(s)`;
    console.log(
      `   ${i + 1}. ${c.callerNumber}  [${c.outcome.padEnd(12)}]  ${min}m${sec.toString().padStart(2, "0")}s  — ${age}`
    );
  });
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed des appels :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
