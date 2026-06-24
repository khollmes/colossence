"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmailResult =
  | { success: true; sentAt: string; to: string }
  | { success: false; error: string; hint?: string };

type OVHResult =
  | { success: true; ovhResponse: unknown; responseTimeMs: number; payloadSent: unknown }
  | { success: false; error: string; hint?: string; ovhBody?: string; responseTimeMs?: number };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 p-8">
      <div className="max-w-2xl mx-auto space-y-10">

        <div>
          <span className="inline-block bg-yellow-500/20 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-yellow-500/30">
            PAGE TEMPORAIRE — À SUPPRIMER APRÈS LES TESTS
          </span>
          <h1 className="text-3xl font-bold text-white">Tests de communication</h1>
          <p className="mt-2 text-gray-400">Vérifie les connexions entre le site et les services externes.</p>
        </div>

        <EmailTestSection />
        <OVHTestSection />

      </div>
    </div>
  );
}

// ─── Section : test email ─────────────────────────────────────────────────────

function EmailTestSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailResult | null>(null);

  const handleSend = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email }),
      });
      setResult(await res.json());
    } catch {
      setResult({ success: false, error: "Erreur réseau." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-white font-semibold text-lg mb-1">Email via Resend</h2>
      <p className="text-gray-400 text-sm mb-5">
        Envoie un email de test pour vérifier que{" "}
        <code className="bg-gray-800 px-1 rounded">RESEND_API_KEY</code> est correctement configurée.
      </p>

      {/* Prérequis */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-5 text-xs text-blue-200/80">
        Prérequis :{" "}
        <code className="bg-gray-900 px-1 rounded">RESEND_API_KEY</code> dans{" "}
        <strong>.env.local</strong> ou <strong>Vercel → Environment Variables</strong>.
        Obtenez une clé gratuite sur{" "}
        <span className="text-blue-400">resend.com</span>.
      </div>

      {/* Champ + bouton */}
      <div className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && email && !loading && handleSend()}
          placeholder="votre@email.com"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
        />
        <button
          onClick={handleSend}
          disabled={!email || loading}
          className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          {loading && <Spinner />}
          {loading ? "Envoi…" : "Envoyer l'email"}
        </button>
      </div>

      {/* Résultat */}
      {result && (
        <div className={`mt-4 rounded-lg p-4 text-sm ${result.success ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"}`}>
          {result.success ? (
            <div>
              <p className="text-green-400 font-semibold">✅ Email envoyé avec succès</p>
              <p className="text-green-300/70 mt-1">Vérifiez la boîte de <strong className="text-white">{result.to}</strong> (et le dossier spam).</p>
              <p className="text-gray-500 text-xs mt-2">Envoyé le {new Date(result.sentAt).toLocaleString("fr-FR")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-red-400 font-semibold">❌ Échec</p>
              <p className="text-red-300/80">{result.error}</p>
              {result.hint && <p className="text-yellow-300/70 text-xs">💡 {result.hint}</p>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Section : test OVH ───────────────────────────────────────────────────────

function OVHTestSection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OVHResult | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/test-ovh", { method: "POST" });
      setResult(await res.json());
    } catch {
      setResult({ success: false, error: "Erreur réseau." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-white font-semibold text-lg mb-1">Serveur OVH (secrétariat IA)</h2>
      <p className="text-gray-400 text-sm mb-5">
        Envoie un ping au serveur OVH via l&apos;API route proxy pour vérifier la connexion.
      </p>

      {/* Prérequis */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-5 text-xs text-blue-200/80">
        Prérequis :{" "}
        <code className="bg-gray-900 px-1 rounded">OVH_SERVER_URL</code> dans{" "}
        <strong>.env.local</strong> ou <strong>Vercel → Environment Variables</strong>.
        Exemple : <code className="bg-gray-900 px-1 rounded">http://51.XX.XX.XX:3001</code>
      </div>

      {/* Flux */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4 mb-5 font-mono text-xs text-gray-400">
        <span className="text-blue-400">Navigateur</span>
        {" → "}
        <span className="text-purple-400">Vercel /api/test-ovh</span>
        {" → "}
        <span className="text-green-400">OVH :3001/test</span>
      </div>

      <button
        onClick={handleTest}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {loading && <Spinner />}
        {loading ? "Envoi en cours…" : "Envoyer un ping au serveur OVH"}
      </button>

      {/* Résultat */}
      {result && (
        <div className={`mt-4 rounded-lg p-4 text-sm ${result.success ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"}`}>
          {result.success ? (
            <div>
              <p className="text-green-400 font-semibold">✅ Connexion réussie — {result.responseTimeMs} ms</p>
              <LatencyBar ms={result.responseTimeMs} />
              <pre className="mt-3 bg-gray-900 rounded-lg p-3 text-xs text-gray-300 overflow-auto">
                {JSON.stringify(result.ovhResponse, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-red-400 font-semibold">❌ Échec {result.responseTimeMs !== undefined && `(${result.responseTimeMs} ms)`}</p>
              <p className="text-red-300/80">{result.error}</p>
              {result.hint && <p className="text-yellow-300/70 text-xs">💡 {result.hint}</p>}
              {result.ovhBody && (
                <pre className="bg-gray-900 rounded p-3 text-xs text-red-300/70 overflow-auto">{result.ovhBody}</pre>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Spinner() {
  return <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
}

function LatencyBar({ ms }: { ms: number }) {
  const { label, color, pct } =
    ms < 200 ? { label: "Excellent", color: "bg-green-500", pct: "100%" } :
    ms < 500 ? { label: "Bon",       color: "bg-yellow-500", pct: "66%" } :
    ms < 1500 ? { label: "Lent",     color: "bg-orange-500", pct: "33%" } :
               { label: "Très lent", color: "bg-red-500",    pct: "16%" };

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Latence</span><span className="text-white">{label}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: pct }} />
      </div>
    </div>
  );
}
