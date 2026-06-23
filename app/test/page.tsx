/**
 * PAGE DE TEST : app/test/page.tsx
 * Accessible via https://colossence.com/test
 *
 * FLUX COMPLET D'UNE REQUÊTE :
 *
 *  ┌──────────────┐   1. fetch POST    ┌─────────────────────────┐
 *  │  Navigateur  │ ─────────────────► │  /api/test-ovh (Vercel) │
 *  │  (cette page)│                    │  app/api/test-ovh/      │
 *  └──────────────┘ ◄───────────────── │  route.ts               │
 *        ▲          4. JSON réponse    └────────────┬────────────┘
 *        │                                          │ 2. fetch POST (server→server)
 *        │                                          ▼
 *        │                             ┌─────────────────────────┐
 *        │          3. JSON réponse    │  Serveur OVH            │
 *        └──── (via l'API route) ───── │  http://votre-ip/test   │
 *                                      └─────────────────────────┘
 *
 * RAPPEL : on NE va PAS directement vers OVH depuis le navigateur car :
 *   - CORS bloquerait la requête
 *   - L'URL secrète d'OVH serait visible dans les DevTools
 *
 * À SUPPRIMER une fois la communication vérifiée.
 */

"use client";
// "use client" est nécessaire car on utilise useState et des événements
// (onClick, useEffect…). Sans ce directive, Next.js traite le composant
// comme un Server Component qui s'exécute uniquement sur le serveur.

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

// Représente ce que notre API route /api/test-ovh renvoie au navigateur
type TestResult =
  | {
      success: true;
      ovhResponse: unknown;   // la réponse brute du serveur OVH
      responseTimeMs: number;
      payloadSent: unknown;   // le payload qu'on a envoyé à OVH
    }
  | {
      success: false;
      error: string;
      hint?: string;
      ovhBody?: string;
      responseTimeMs?: number;
    };

// ─── Composant principal ──────────────────────────────────────────────────────

export default function TestOVHPage() {
  // État local du composant :
  const [loading, setLoading] = useState(false);   // true pendant la requête
  const [result, setResult] = useState<TestResult | null>(null);  // null = pas encore de test

  // ── Handler du bouton ─────────────────────────────────────────────────────
  const handleTest = async () => {
    setLoading(true);
    setResult(null); // efface le résultat précédent

    try {
      // On appelle NOTRE API route, pas OVH directement.
      // Le navigateur envoie une requête vers le même domaine (colossence.com),
      // ce qui évite tout problème CORS.
      const response = await fetch("/api/test-ovh", {
        method: "POST",
        // Pas besoin de body ici : c'est l'API route qui construit le payload
        // à envoyer à OVH. On garde cette route simple.
      });

      // response.json() désérialise le corps JSON de la réponse HTTP.
      // Même si le statut HTTP est 4xx/5xx, on peut toujours lire le JSON
      // (notre API route retourne toujours du JSON, succès ou erreur).
      const data: TestResult = await response.json();
      setResult(data);

    } catch (err) {
      // Ce bloc ne se déclenche qu'en cas d'erreur réseau côté navigateur
      // (ex: pas de connexion Internet, DNS fail pour colossence.com elle-même).
      // Les erreurs côté serveur sont gérées dans l'API route et retournées en JSON.
      setResult({
        success: false,
        error: err instanceof Error ? err.message : "Erreur réseau inconnue",
        hint: "Vérifiez votre connexion Internet.",
      });
    } finally {
      // finally s'exécute toujours, succès ou erreur : on arrête le chargement.
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 p-8">
      <div className="max-w-2xl mx-auto">

        {/* ── En-tête ─────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <span className="inline-block bg-yellow-500/20 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-yellow-500/30">
            PAGE TEMPORAIRE — À SUPPRIMER APRÈS LES TESTS
          </span>
          <h1 className="text-3xl font-bold text-white">
            Test communication serveur OVH
          </h1>
          <p className="mt-2 text-gray-400">
            Vérifie que Vercel peut joindre le serveur OVH qui héberge le secrétariat IA.
          </p>
        </div>

        {/* ── Schéma du flux ──────────────────────────────────────────────── */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 mb-8 font-mono text-xs">
          <p className="text-gray-500 mb-3">Flux de la requête :</p>
          <div className="space-y-1 text-gray-400">
            <p><span className="text-blue-400">Navigateur</span> → POST /api/test-ovh</p>
            <p className="pl-4 text-gray-600">↓ (serveur Vercel, invisible du navigateur)</p>
            <p className="pl-4"><span className="text-purple-400">Vercel</span> → POST {"{OVH_SERVER_URL}"}/test</p>
            <p className="pl-8 text-gray-600">↓</p>
            <p className="pl-8"><span className="text-green-400">Serveur OVH</span> → réponse JSON</p>
            <p className="pl-4 text-gray-600">↓ retransmis par Vercel</p>
            <p><span className="text-blue-400">Navigateur</span> ← affichage ici</p>
          </div>
        </div>

        {/* ── Variable d'environnement ─────────────────────────────────────── */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-8">
          <p className="text-blue-300 text-sm font-semibold mb-1">
            Prérequis : variable d&apos;environnement
          </p>
          <p className="text-blue-200/70 text-xs">
            <code className="bg-gray-900 px-1 rounded">OVH_SERVER_URL</code> doit être définie dans{" "}
            <strong>Vercel → Settings → Environment Variables</strong>.
            <br />
            Exemple : <code className="bg-gray-900 px-1 rounded">http://51.XX.XX.XX:3001</code>
          </p>
        </div>

        {/* ── Bouton de test ──────────────────────────────────────────────── */}
        <button
          onClick={handleTest}
          disabled={loading}
          className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-lg transition-colors flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              {/* Spinner CSS pur — pas de dépendance supplémentaire */}
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Envoi en cours…
            </>
          ) : (
            "Envoyer un test au serveur OVH"
          )}
        </button>

        {/* ── Zone de résultat ────────────────────────────────────────────── */}
        {result && (
          <div className="mt-8">
            {result.success ? (
              /* ── SUCCÈS ── */
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-green-400 font-bold text-lg">Connexion réussie !</p>
                    <p className="text-green-300/70 text-sm">
                      Le serveur OVH a répondu en{" "}
                      <strong className="text-green-300">{result.responseTimeMs} ms</strong>
                    </p>
                  </div>
                </div>

                {/* Indicateur de latence */}
                <LatencyBar ms={result.responseTimeMs} />

                {/* Payload envoyé à OVH */}
                <div className="mt-5">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    Payload envoyé à OVH
                  </p>
                  <pre className="bg-gray-900 rounded-lg p-4 text-xs text-gray-300 overflow-auto">
                    {JSON.stringify(result.payloadSent, null, 2)}
                  </pre>
                </div>

                {/* Réponse brute d'OVH */}
                <div className="mt-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    Réponse brute du serveur OVH
                  </p>
                  <pre className="bg-gray-900 rounded-lg p-4 text-xs text-gray-300 overflow-auto">
                    {JSON.stringify(result.ovhResponse, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              /* ── ERREUR ── */
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">❌</span>
                  <div>
                    <p className="text-red-400 font-bold text-lg">Échec de la connexion</p>
                    {result.responseTimeMs !== undefined && (
                      <p className="text-red-300/70 text-sm">
                        Après {result.responseTimeMs} ms
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Message d'erreur principal */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Erreur</p>
                    <p className="text-red-300 text-sm bg-gray-900 rounded-lg px-4 py-3">
                      {result.error}
                    </p>
                  </div>

                  {/* Conseil de débogage si disponible */}
                  {result.hint && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                        Que vérifier
                      </p>
                      <p className="text-yellow-300/80 text-sm bg-gray-900 rounded-lg px-4 py-3">
                        💡 {result.hint}
                      </p>
                    </div>
                  )}

                  {/* Corps de la réponse OVH si disponible (erreur HTTP 4xx/5xx) */}
                  {result.ovhBody && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                        Réponse brute d&apos;OVH
                      </p>
                      <pre className="bg-gray-900 rounded-lg p-4 text-xs text-red-300/70 overflow-auto">
                        {result.ovhBody}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Guide de débogage contextuel */}
                <DebugGuide error={result.error} />
              </div>
            )}
          </div>
        )}

        {/* ── Ce que votre serveur OVH doit faire ────────────────────────── */}
        <div className="mt-10 bg-gray-900/40 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-3">
            Ce que votre serveur OVH doit exposer
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Votre serveur doit avoir un endpoint <code className="bg-gray-800 px-1 rounded">POST /test</code> qui
            accepte ce payload et renvoie une réponse JSON. Exemple minimal en Node.js :
          </p>
          <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-xs text-gray-300 overflow-auto">
{`// server.js (sur votre VPS OVH)
const express = require('express');
const app = express();
app.use(express.json());

app.post('/test', (req, res) => {
  console.log('Reçu de Colossence :', req.body);
  res.json({
    status: 'ok',
    message: 'pong depuis OVH',
    received: req.body,
    serverTime: new Date().toISOString(),
  });
});

app.listen(3001, () => console.log('Serveur OVH prêt sur :3001'));`}
          </pre>
        </div>

      </div>
    </div>
  );
}

// ─── Composant : barre de latence ─────────────────────────────────────────────
//
// Donne une indication visuelle de la qualité de la connexion.
function LatencyBar({ ms }: { ms: number }) {
  // Seuils arbitraires adaptés à une communication inter-serveurs
  const quality =
    ms < 200 ? { label: "Excellent", color: "bg-green-500", width: "w-full" } :
    ms < 500 ? { label: "Bon", color: "bg-yellow-500", width: "w-2/3" } :
    ms < 1500 ? { label: "Lent", color: "bg-orange-500", width: "w-1/3" } :
               { label: "Très lent", color: "bg-red-500", width: "w-1/6" };

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Latence</span>
        <span className="text-white font-semibold">{quality.label}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div className={`${quality.color} ${quality.width} h-2 rounded-full transition-all`} />
      </div>
    </div>
  );
}

// ─── Composant : guide de débogage contextuel ─────────────────────────────────
//
// Affiche des conseils différents selon le type d'erreur détecté.
function DebugGuide({ error }: { error: string }) {
  const isTimeout = error.toLowerCase().includes("timeout");
  const isCors = error.toLowerCase().includes("cors");
  const isEnvMissing = error.toLowerCase().includes("ovh_server_url");

  if (isEnvMissing) {
    return (
      <div className="mt-5 border-t border-red-500/20 pt-4">
        <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Étapes de résolution</p>
        <ol className="text-sm text-gray-400 space-y-1 list-decimal ml-4">
          <li>Allez dans <strong className="text-white">Vercel Dashboard → votre projet → Settings → Environment Variables</strong></li>
          <li>Ajoutez <code className="bg-gray-900 px-1 rounded">OVH_SERVER_URL</code> avec l&apos;URL de votre serveur</li>
          <li>Redéployez (ou attendez le prochain déploiement)</li>
        </ol>
      </div>
    );
  }

  if (isTimeout) {
    return (
      <div className="mt-5 border-t border-red-500/20 pt-4">
        <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Causes possibles du timeout</p>
        <ul className="text-sm text-gray-400 space-y-1 list-disc ml-4">
          <li>Le serveur OVH n&apos;est pas démarré (<code className="bg-gray-900 px-1 rounded">node server.js</code> ?)</li>
          <li>Le port est bloqué par le firewall OVH (vérifiez les règles iptables)</li>
          <li>L&apos;IP ou le port dans <code className="bg-gray-900 px-1 rounded">OVH_SERVER_URL</code> est incorrect</li>
        </ul>
      </div>
    );
  }

  if (isCors) {
    return (
      <div className="mt-5 border-t border-red-500/20 pt-4">
        <p className="text-sm text-yellow-300/80">
          Erreur CORS inattendue : normalement impossible depuis le serveur Vercel.
          Vérifiez que <code className="bg-gray-900 px-1 rounded">OVH_SERVER_URL</code> est correct.
        </p>
      </div>
    );
  }

  return null;
}
