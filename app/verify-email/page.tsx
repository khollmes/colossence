/**
 * Page de vérification d'email — Server Component.
 *
 * Cette page est appelée quand l'utilisateur clique sur le lien reçu par email :
 *   https://colossence.com/verify-email?token=abc123...
 *
 * Tout le traitement se fait côté serveur (pas de "use client") :
 * - Aucune donnée sensible n'est exposée au navigateur
 * - Le token est validé et consommé avant d'envoyer la moindre réponse HTML
 * - Next.js peut mettre la page en cache selon le résultat
 */

import Link from "next/link";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vérification de l'email — Colossence",
};

// En Next.js 15+, searchParams est une Promise — il faut l'awaiter.
// En Next.js 14, c'était un objet direct. Le typage Promise<...> est la
// convention à partir de Next.js 15 pour permettre le streaming et le Suspense.
type SearchParams = Promise<{ token?: string }>;

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { token } = await searchParams;

  // ── Cas 1 : aucun token dans l'URL ──────────────────────────────────────────
  // Ex: quelqu'un navigue manuellement vers /verify-email sans paramètre
  if (!token) {
    return (
      <Layout>
        <StatusCard
          icon="⚠️"
          title="Lien invalide"
          message="Ce lien de vérification ne contient pas de token. Vérifiez que vous avez cliqué sur le bon lien dans votre email."
          colorClass="border-yellow-200 bg-yellow-50"
          titleColorClass="text-yellow-800"
          messageColorClass="text-yellow-700"
        />
        <BackToLogin />
      </Layout>
    );
  }

  // ── Cas 2 : recherche du token en base ──────────────────────────────────────
  // On cherche par le token (qui est @unique dans le schéma).
  // On inclut l'utilisateur pour pouvoir vérifier son nom et mettre à jour emailVerified.
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  // ── Cas 3 : token introuvable ────────────────────────────────────────────────
  // Deux raisons possibles :
  // a) Le token n'a jamais existé (URL falsifiée, faute de frappe)
  // b) Le token a déjà été utilisé et supprimé (c'est normal et voulu — voir ci-dessous)
  if (!verificationToken) {
    return (
      <Layout>
        <StatusCard
          icon="❌"
          title="Lien introuvable"
          message="Ce lien de vérification est invalide ou a déjà été utilisé. Si votre email n'est pas encore vérifié, connectez-vous pour en demander un nouveau."
          colorClass="border-red-200 bg-red-50"
          titleColorClass="text-red-800"
          messageColorClass="text-red-700"
        />
        <BackToLogin />
      </Layout>
    );
  }

  // ── Cas 4 : token expiré ─────────────────────────────────────────────────────
  // Le token existe mais sa date d'expiration est dépassée.
  // On le supprime immédiatement pour ne pas encombrer la DB.
  if (verificationToken.expiresAt < new Date()) {
    await prisma.verificationToken.delete({
      where: { token },
    });

    return (
      <Layout>
        <StatusCard
          icon="⏰"
          title="Lien expiré"
          message="Ce lien de vérification a expiré (valable 24h). Connectez-vous à votre compte pour recevoir un nouvel email de confirmation."
          colorClass="border-orange-200 bg-orange-50"
          titleColorClass="text-orange-800"
          messageColorClass="text-orange-700"
        />
        <BackToLogin />
      </Layout>
    );
  }

  // ── Cas 5 : token valide — on valide le compte ───────────────────────────────
  //
  // On utilise une transaction pour garantir que les deux opérations sont
  // atomiques : soit les deux réussissent, soit aucune n'est appliquée.
  // Sans transaction, si la mise à jour du User réussit mais que la suppression
  // du token échoue, l'utilisateur pourrait valider son compte deux fois.
  //
  // POURQUOI SUPPRIMER LE TOKEN APRÈS USAGE ?
  // ─────────────────────────────────────────
  // 1. USAGE UNIQUE : un token de vérification ne doit servir qu'une seule fois.
  //    Si quelqu'un intercepte le lien (ex: dans les logs d'un proxy, un email
  //    transféré, un aperçu de lien), il ne peut pas l'utiliser après coup.
  //
  // 2. RÉDUCTION DE LA SURFACE D'ATTAQUE : moins de tokens actifs en base =
  //    moins de chances qu'un attaquant en devinant un au hasard trouve un valide.
  //
  // 3. HYGIÈNE : la table VerificationToken ne stocke que des tokens encore
  //    utilisables. Sans cette suppression, elle accumulerait des milliers de
  //    tokens obsolètes qui alourdissent les requêtes et les backups.

  await prisma.$transaction([
    // Marquer l'email comme vérifié avec la date exacte (utile pour les audits RGPD)
    prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: new Date() },
    }),
    // Supprimer le token — il ne peut plus être réutilisé
    prisma.verificationToken.delete({
      where: { token },
    }),
  ]);

  // ── Succès ───────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <StatusCard
        icon="✅"
        title="Email vérifié !"
        message={`Bienvenue ${verificationToken.user.prenom} ! Votre adresse email a bien été confirmée. Vous pouvez maintenant vous connecter à votre espace.`}
        colorClass="border-green-200 bg-green-50"
        titleColorClass="text-green-800"
        messageColorClass="text-green-700"
      />
      <Link
        href="/login"
        className="mt-6 block w-full py-3 text-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
      >
        Se connecter
      </Link>
    </Layout>
  );
}

// ─── Composants de mise en page ───────────────────────────────────────────────

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900 tracking-tight">
            Colossence
          </Link>
          <p className="mt-2 text-gray-500 text-sm">Vérification de votre adresse email</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  icon,
  title,
  message,
  colorClass,
  titleColorClass,
  messageColorClass,
}: {
  icon: string;
  title: string;
  message: string;
  colorClass: string;
  titleColorClass: string;
  messageColorClass: string;
}) {
  return (
    <div className={`rounded-xl border p-5 ${colorClass}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none mt-0.5">{icon}</span>
        <div>
          <h2 className={`font-semibold text-lg ${titleColorClass}`}>{title}</h2>
          <p className={`mt-1 text-sm leading-relaxed ${messageColorClass}`}>{message}</p>
        </div>
      </div>
    </div>
  );
}

function BackToLogin() {
  return (
    <Link
      href="/login"
      className="mt-6 block w-full py-3 text-center rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition-colors text-sm"
    >
      Retour à la connexion
    </Link>
  );
}
