/**
 * API ROUTE : app/api/test-ovh/route.ts
 * Accessible depuis le navigateur via POST /api/test-ovh
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  POURQUOI UNE API ROUTE INTERMÉDIAIRE (PROXY) ?                        │
 * │                                                                         │
 * │  Option naïve (à ne PAS faire) :                                       │
 * │  Navigateur → fetch("http://votre-serveur-ovh.com/...") directement    │
 * │                                                                         │
 * │  Deux problèmes majeurs :                                               │
 * │                                                                         │
 * │  1. CORS (Cross-Origin Resource Sharing)                                │
 * │     Le navigateur bloque toute requête vers un domaine différent        │
 * │     sauf si le serveur cible envoie explicitement les bons headers      │
 * │     "Access-Control-Allow-Origin". Votre serveur OVH devrait donc       │
 * │     être configuré pour autoriser colossence.com — configuration        │
 * │     côté serveur plus complexe, et exposée à d'autres origines.         │
 * │                                                                         │
 * │  2. SÉCURITÉ de l'URL et des clés secrètes                             │
 * │     Si vous appelez OVH depuis le navigateur, l'URL complète de votre   │
 * │     serveur (et toute clé API) est visible dans l'onglet Réseau des     │
 * │     DevTools. N'importe qui peut la récupérer et appeler votre          │
 * │     serveur directement, sans passer par votre site.                    │
 * │                                                                         │
 * │  Solution : le proxy API Route                                          │
 * │  Navigateur → /api/test-ovh (Vercel, server-side) → Serveur OVH        │
 * │                                                                         │
 * │  - La requête Vercel → OVH se fait serveur à serveur : pas de CORS.    │
 * │  - L'URL d'OVH et les clés secrètes restent dans les variables         │
 * │    d'environnement Vercel, invisibles du navigateur.                    │
 * │  - On peut ajouter de l'authentification, du rate-limiting, etc.        │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { NextResponse } from "next/server";

// Timeout en millisecondes pour la requête vers OVH.
// Si OVH ne répond pas en 10 secondes, on abandonne plutôt que de laisser
// la requête pendre indéfiniment (Vercel coupe les fonctions après ~30s).
const TIMEOUT_MS = 10_000;

export async function POST() {
  // ── Étape 1 : Récupérer l'URL du serveur OVH ──────────────────────────────
  //
  // On lit OVH_SERVER_URL depuis les variables d'environnement Vercel.
  // À configurer dans : Vercel Dashboard → Settings → Environment Variables
  // Exemple de valeur : https://votre-ip-ou-domaine-ovh.com
  //
  // process.env est disponible uniquement côté serveur (pas dans le navigateur),
  // ce qui confirme que cette route s'exécute bien sur les serveurs de Vercel.
  const ovhUrl = process.env.OVH_SERVER_URL;

  if (!ovhUrl) {
    // Si la variable n'est pas définie, on retourne une erreur 500 claire
    // plutôt que de laisser fetch() planter avec un message obscur.
    return NextResponse.json(
      {
        success: false,
        error: "Variable d'environnement OVH_SERVER_URL non définie.",
        hint: "Ajoutez OVH_SERVER_URL dans Vercel → Settings → Environment Variables",
      },
      { status: 500 }
    );
  }

  // ── Étape 2 : Construire le payload à envoyer à OVH ───────────────────────
  //
  // C'est ce que votre serveur OVH recevra dans le body de la requête POST.
  // On inclut un timestamp pour que OVH puisse calculer la latence réseau
  // s'il le souhaite, et un message pour identifier la source.
  const payload = {
    message: "ping depuis Colossence",
    timestamp: new Date().toISOString(), // format ISO 8601, ex: "2026-06-23T14:32:00.000Z"
    source: "colossence.com",
  };

  // ── Étape 3 : Envoyer la requête à OVH avec un timeout ────────────────────
  //
  // AbortController permet d'annuler une requête fetch en cours.
  // C'est le mécanisme standard pour implémenter un timeout sur fetch(),
  // qui nativement n'en a pas.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(); // déclenche l'annulation après TIMEOUT_MS
  }, TIMEOUT_MS);

  // On note l'heure de départ pour mesurer le temps de réponse d'OVH.
  const startTime = Date.now();

  try {
    // fetch() côté serveur (Node.js / Vercel Edge) fonctionne exactement
    // comme dans le navigateur, mais sans restriction CORS.
    const ovhResponse = await fetch(`${ovhUrl}/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Si votre serveur OVH exige une clé d'authentification, ajoutez-la ici :
        // "Authorization": `Bearer ${process.env.OVH_API_KEY}`,
        // La clé reste invisible du navigateur car elle vit dans process.env.
      },
      body: JSON.stringify(payload),
      signal: controller.signal, // relie le fetch à notre AbortController
    });

    // On mesure le temps dès que le serveur a répondu (headers reçus).
    const responseTimeMs = Date.now() - startTime;

    // clearTimeout annule le timer si la réponse est arrivée avant le timeout.
    clearTimeout(timeoutId);

    // ── Étape 4 : Lire et transmettre la réponse d'OVH ──────────────────────
    //
    // ovhResponse.ok est true si le code HTTP est entre 200 et 299.
    // Un code 4xx ou 5xx met ok à false mais ne lève pas d'exception.
    if (!ovhResponse.ok) {
      // OVH a répondu mais avec une erreur applicative
      const errorText = await ovhResponse.text(); // le corps de l'erreur
      return NextResponse.json(
        {
          success: false,
          error: `Le serveur OVH a répondu avec le statut HTTP ${ovhResponse.status}`,
          ovhBody: errorText,
          responseTimeMs,
        },
        { status: 502 } // 502 Bad Gateway = le proxy a reçu une mauvaise réponse
      );
    }

    // Lecture de la réponse JSON envoyée par OVH.
    // Si OVH répond avec du texte brut, remplacez .json() par .text()
    const ovhData = await ovhResponse.json();

    // On renvoie la réponse d'OVH enrichie du temps de réponse mesuré ici.
    return NextResponse.json({
      success: true,
      ovhResponse: ovhData,
      responseTimeMs,
      payloadSent: payload, // utile pour voir exactement ce qui a été envoyé
    });

  } catch (error) {
    // On mesure quand même le temps en cas d'erreur
    const responseTimeMs = Date.now() - startTime;
    clearTimeout(timeoutId);

    // ── Étape 5 : Distinguer les types d'erreurs ──────────────────────────────

    // AbortError = notre timeout a expiré
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        {
          success: false,
          error: `Timeout : le serveur OVH n'a pas répondu en ${TIMEOUT_MS / 1000} secondes.`,
          hint: "Vérifiez que le serveur OVH est démarré et accessible depuis Internet.",
          responseTimeMs,
        },
        { status: 504 } // 504 Gateway Timeout
      );
    }

    // TypeError avec "fetch failed" = DNS introuvable ou connexion refusée
    // (serveur éteint, IP incorrecte, port fermé, firewall…)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        hint: "Vérifiez OVH_SERVER_URL et que le port est ouvert sur le firewall OVH.",
        responseTimeMs,
      },
      { status: 502 }
    );
  }
}
