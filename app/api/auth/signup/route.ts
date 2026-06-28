/**
 * POST /api/auth/signup
 *
 * Crée un compte utilisateur en deux étapes atomiques :
 *   1. User + VerificationToken dans une transaction Prisma
 *   2. Email de vérification envoyé EN DEHORS de la transaction
 *
 * Note d'architecture : le schéma actuel n'a pas de modèle Organization.
 * L'équivalent est User (données personnelles) + BusinessProfile (données métier).
 * Le BusinessProfile est créé séparément lors de l'onboarding, car il requiert
 * des champs (metier, horaires, tarifs…) non collectés à l'inscription.
 */

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { signupSchema } from "@/lib/validations/signup";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";
import VerificationEmail from "@/emails/VerificationEmail";

// ─── Pourquoi re-valider côté serveur si le front valide déjà ? ──────────────
//
// Le navigateur exécute du JavaScript que l'utilisateur CONTRÔLE.
// N'importe qui peut :
//   • Désactiver JS et soumettre le formulaire HTML directement
//   • Utiliser curl / Postman pour envoyer des données arbitraires
//   • Modifier le code JS dans les DevTools avant soumission
//   • Écrire un script qui cible l'API directement
//
// La validation front-end est une aide à l'UX (feedback immédiat).
// La validation back-end est la seule barrière de sécurité réelle.
// Les deux sont nécessaires, avec des rôles différents.
// ─────────────────────────────────────────────────────────────────────────────

// Durée de validité du token de vérification : 24 heures
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  // ── 1. Rate limiting ──────────────────────────────────────────────────────
  // 5 tentatives par minute par IP — plus strict que les autres routes,
  // car l'inscription déclenche un email + une écriture DB + un bcrypt.hash.
  const ip = getClientIp(request);
  const { success } = checkRateLimit(`signup:${ip}`, {
    maxRequests: 5,
    windowMs: 60_000,
  });
  if (!success) return rateLimitResponse();

  try {
    // ── 2. Parsing du corps ───────────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Le corps de la requête doit être du JSON valide" },
        { status: 400 }
      );
    }

    // ── 3. Validation complète côté serveur ───────────────────────────────
    // safeParse ne lève pas d'exception : il retourne { success, data } ou { success, error }.
    // On utilise .flatten() pour obtenir les erreurs par champ plutôt qu'un arbre Zod brut.
    const result = signupSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          // fieldErrors : { email: ["..."], siret: ["..."], ... }
          champs: result.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const { prenom, nom, email, password, telephone } = result.data;
    // nomEntreprise, siret et rio sont validés mais pas encore stockés :
    // ils seront enregistrés dans BusinessProfile lors de l'onboarding.

    // ── 4. Unicité de l'email ─────────────────────────────────────────────
    // select: { id: true } : on ne charge que l'id, pas toutes les colonnes.
    // C'est plus rapide et évite de charger passwordHash en mémoire inutilement.
    const emailExists = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (emailExists) {
      // 409 Conflict : la ressource existe déjà.
      // Attention : en production, pour éviter l'énumération d'emails (attaque
      // permettant de savoir si un email est inscrit), certains systèmes
      // retournent toujours 201 et envoient un email "compte existant" à la place.
      return NextResponse.json(
        { error: "Un compte existe déjà avec cette adresse e-mail" },
        { status: 409 }
      );
    }

    // ── 5. Hachage du mot de passe (avant la transaction) ────────────────
    // bcrypt.hash avec cost=12 prend ~100–300ms (intentionnellement lent pour
    // résister aux attaques par force brute si la base de données est compromise).
    //
    // On effectue ce calcul AVANT d'ouvrir la transaction pour deux raisons :
    //  a) Une transaction DB retient une connexion du pool pendant toute sa durée.
    //     100–300ms de bcrypt bloquerait cette connexion pour rien.
    //  b) Moins de temps dans la transaction = moins de risque de timeout ou deadlock.
    const passwordHash = await bcrypt.hash(password, 12);

    // ── 6. Token de vérification (avant la transaction, même logique) ─────
    // 32 octets = 256 bits d'entropie → 64 caractères hexadécimaux.
    // Impossible à deviner par force brute même avec des milliards de tentatives.
    const verificationToken = randomBytes(32).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    // ── 7. TRANSACTION : User + VerificationToken ─────────────────────────
    //
    // POURQUOI UNE TRANSACTION ICI ?
    //
    // Ces deux opérations sont causalement liées : un User sans VerificationToken
    // est un compte "zombie" — il existe mais ne peut JAMAIS vérifier son email.
    //
    // Sans transaction (opérations séquentielles indépendantes) :
    //
    //   ┌──────────────────────────────────────────────────────────────┐
    //   │  tx.user.create()       ✓  ← écrit en base                  │
    //   │  [crash serveur / erreur réseau / bug]                       │
    //   │  tx.verificationToken.create()  ✗  ← jamais exécuté         │
    //   │                                                              │
    //   │  Résultat : User en base, sans token → compte inutilisable  │
    //   └──────────────────────────────────────────────────────────────┘
    //
    // Avec transaction (ATOMICITÉ — le A de ACID) :
    //
    //   ┌──────────────────────────────────────────────────────────────┐
    //   │  BEGIN TRANSACTION                                           │
    //   │    tx.user.create()             ← en attente                 │
    //   │    tx.verificationToken.create() ← en attente                │
    //   │  COMMIT   (les deux réussissent → les deux sont écrits)      │
    //   │  OU                                                          │
    //   │  ROLLBACK (l'une échoue → aucune des deux n'est écrite)     │
    //   └──────────────────────────────────────────────────────────────┘
    //
    // Invariant garanti : User existe ↔ VerificationToken existe.
    // ──────────────────────────────────────────────────────────────────
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          prenom,
          nom,
          email,
          passwordHash,
          telephone,
          // role: "USER" est la valeur par défaut définie dans le schéma Prisma
        },
        // On ne sélectionne que ce dont on a besoin pour la suite
        select: { id: true, prenom: true, email: true },
      });

      await tx.verificationToken.create({
        data: {
          token: verificationToken,
          userId: user.id,
          expiresAt: tokenExpiresAt,
        },
      });

      return user;
    });

    // ── 8. Email de vérification (HORS transaction) ───────────────────────
    //
    // L'email est envoyé après la transaction, pas dedans.
    // Raison : une panne SMTP ne doit pas annuler la création du compte.
    //
    // Si l'email échoue :
    //  • Le compte est créé → pas de perte de données
    //  • L'utilisateur peut redemander un email depuis la page de connexion
    //  • On log l'erreur pour investigation (Sentry, logs serveur…)
    //
    // Si on avait mis sendEmail() DANS la transaction :
    //  → Un timeout SMTP de 30s bloquerait la connexion DB 30s
    //  → Un refus SMTP annulerait la création du compte (mauvaise UX)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;

    try {
      await sendEmail({
        to: newUser.email,
        subject: "Confirmez votre adresse email — Colossence",
        react: VerificationEmail({ prenom: newUser.prenom, verificationUrl }),
      });
    } catch (emailError) {
      // On log mais on ne remonte PAS l'erreur au client.
      // Le compte est créé — l'échec d'email ne doit pas faire croire à l'utilisateur
      // que son inscription a échoué.
      console.error(
        `[signup] Échec de l'envoi de l'email de vérification à ${newUser.email}:`,
        emailError
      );
    }

    // ── 9. Réponse de succès ──────────────────────────────────────────────
    // On retourne uniquement ce dont le front a besoin.
    // Jamais le passwordHash, jamais le verificationToken.
    return NextResponse.json(
      {
        message: "Compte créé. Vérifiez votre boîte email pour activer votre accès.",
        userId: newUser.id,
      },
      { status: 201 }
    );
  } catch (error) {
    // Erreur inattendue (connexion DB perdue, bug Prisma, etc.)
    console.error("[signup] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
