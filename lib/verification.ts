/**
 * Logique de vérification d'email.
 *
 * Flux complet :
 *  1. L'utilisateur s'inscrit
 *  2. On génère un token aléatoire → on le stocke en DB avec une expiration de 24h
 *  3. On envoie un email avec un lien contenant ce token
 *  4. L'utilisateur clique → la page /verify-email lit le token, vérifie qu'il n'est
 *     pas expiré, met emailVerified = now() sur l'User, supprime le token
 */

import { randomBytes } from "crypto";
import prisma from "./prisma";
import { sendEmail } from "./email";
import VerificationEmail from "@/emails/VerificationEmail";

// ─── Pourquoi crypto.randomBytes et PAS Math.random() ? ──────────────────────
//
// Math.random() est un générateur pseudo-aléatoire (PRNG) : son algorithme est
// déterministe et prévisible. Un attaquant qui connaît quelques valeurs produites
// peut retrouver les suivantes — catastrophique pour des tokens de sécurité.
//
// crypto.randomBytes() utilise le générateur d'entropie du système d'exploitation
// (CSPRNG — Cryptographically Secure PRNG) : /dev/urandom sur Linux/Mac, CryptGenRandom
// sur Windows. Ces sources sont imprévisibles par construction.
//
// Règle simple : tout token qui protège l'accès à un compte → crypto, jamais Math.random.
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_EXPIRY_HOURS = 24;

/**
 * Génère un token de vérification sécurisé pour un utilisateur.
 * Supprime les anciens tokens avant d'en créer un nouveau pour éviter
 * l'accumulation de tokens orphelins en base.
 */
export async function generateVerificationToken(userId: string): Promise<string> {
  // 32 octets aléatoires → 64 caractères hexadécimaux.
  // 64 caractères hex = 256 bits d'entropie : impossible à deviner par force brute.
  const token = randomBytes(32).toString("hex");

  // Nettoyage des anciens tokens pour cet utilisateur.
  // Raison : un utilisateur peut redemander un email si le premier n'est pas arrivé.
  // On ne veut pas que plusieurs tokens valides coexistent pour le même compte.
  await prisma.verificationToken.deleteMany({
    where: { userId },
  });

  // Calcul de la date d'expiration : maintenant + 24h
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
}

interface UserForVerification {
  id: string;
  prenom: string;
  email: string;
}

/**
 * Envoie l'email de vérification à un utilisateur.
 * À appeler juste après l'inscription, ou quand l'utilisateur demande un renvoi.
 */
export async function sendVerificationEmail(user: UserForVerification): Promise<void> {
  const token = await generateVerificationToken(user.id);

  // NEXT_PUBLIC_APP_URL permet de construire des URLs absolues côté serveur.
  // Le préfixe NEXT_PUBLIC_ rend la variable accessible dans le navigateur aussi,
  // ce qui est utile si on génère des liens côté client un jour.
  // Valeur : https://colossence.com en production, http://localhost:3000 en local.
  // Priorité : variable explicite > URL Vercel auto-injectée > localhost (dev)
  // VERCEL_URL est disponible automatiquement sur tous les déploiements Vercel
  // mais ne contient pas le schéma — il faut ajouter https://
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const verificationUrl = `${appUrl}/verify-email?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: "Confirmez votre adresse email — Colossence",
    // On passe le composant React directement.
    // lib/email.ts appelle render() pour le transformer en HTML compatible email.
    react: VerificationEmail({ prenom: user.prenom, verificationUrl }),
  });
}
