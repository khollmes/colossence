import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Résultat de la vérification d'accès.
 * - ok = true  → utilisateur connecté ET son entreprise (businessProfileId) trouvée
 * - ok = false → on renvoie le bon code HTTP (401 non connecté, 403 pas d'entreprise)
 */
type BusinessAccess =
  | { ok: true; businessProfileId: string; userId: string }
  | { ok: false; status: number; error: string };

/**
 * Point de contrôle de sécurité UNIQUE pour toutes les routes cloisonnées par client
 * (équipe, tarifs, et les futures ressources d'une entreprise).
 *
 * Pourquoi un helper partagé ? Pour que la vérification de propriété soit
 * IMPOSSIBLE à oublier : chaque route commence par l'appeler. Dupliquer cette
 * logique dans chaque handler ouvrirait une faille au premier oubli.
 *
 * Étapes :
 *   1. Récupère la session NextAuth. Pas de session → 401 (non authentifié).
 *   2. Lit le userId DEPUIS LA SESSION (signée côté serveur), jamais depuis le
 *      corps de la requête : un client ne peut donc pas se faire passer pour un autre.
 *   3. Remonte l'entreprise (BusinessProfile) liée à cet utilisateur. C'est CETTE
 *      valeur (businessProfileId) qui sert de "frontière" entre les clients.
 *
 * Note sur les rôles OWNER/MEMBER : ton schéma ne les a pas. Ici, 1 User possède
 * 1 seule entreprise (relation 1-à-1). L'utilisateur connecté EST donc forcément
 * le propriétaire de SON entreprise — la règle "seul le propriétaire gère" est
 * garantie par construction. Si un jour tu ajoutes plusieurs utilisateurs par
 * entreprise avec des rôles, c'est ICI qu'on ajouterait le test `role === "OWNER"`.
 */
export async function requireBusinessProfile(): Promise<BusinessAccess> {
  const session = await getServerSession(authOptions);

  // 1. Non connecté → 401
  if (!session?.user) {
    return { ok: false, status: 401, error: "Non autorisé" };
  }

  // 2. L'identité vient de la session signée, pas du body : non falsifiable.
  const userId = (session.user as { id: string }).id;

  // 3. On récupère l'entreprise de cet utilisateur. select { id } : on ne charge
  //    que ce dont on a besoin.
  const businessProfile = await prisma.businessProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  // Compte sans entreprise (profil pas encore créé) → pas de ressource possible → 403
  if (!businessProfile) {
    return {
      ok: false,
      status: 403,
      error: "Aucune entreprise associée à ce compte",
    };
  }

  return { ok: true, businessProfileId: businessProfile.id, userId };
}
