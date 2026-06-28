"use client";

import { useState, useEffect } from "react";
import { Phone, Search, ChevronLeft, Info } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CallOutcome = "APPOINTMENT" | "MESSAGE" | "TRANSFERRED" | "MISSED";

// Structure d'un tour de parole dans la transcription (tableau stocké en Json dans la DB).
type TranscriptEntry = {
  speaker: "AI" | "CALLER";
  text: string;
  t: number; // secondes depuis le début de l'appel
};

// Représente un appel tel que renvoyé par GET /api/calls.
type CallLog = {
  id: string;
  callerNumber: string;
  startedAt: string;   // ISO 8601, ex : "2026-06-28T14:32:00.000Z"
  durationSec: number;
  outcome: CallOutcome;
  transcript: unknown; // type brut de Prisma Json → validé par parseTranscript()
  audioUrl: string | null;
  createdAt: string;
};

// ─── Configuration des badges ─────────────────────────────────────────────────

// Map outcome → label français + classes Tailwind pour le badge.
const OUTCOME_CONFIG: Record<CallOutcome, { label: string; badge: string }> = {
  APPOINTMENT: { label: "RDV pris",  badge: "bg-green-100 text-green-700" },
  MESSAGE:     { label: "Message",   badge: "bg-blue-100 text-blue-700" },
  TRANSFERRED: { label: "Transféré", badge: "bg-orange-100 text-orange-700" },
  MISSED:      { label: "Manqué",    badge: "bg-red-100 text-red-700" },
};

// Options du filtre outcome (valeur vide = "Tous").
const FILTER_OPTIONS = [
  { value: "",            label: "Tous" },
  { value: "APPOINTMENT", label: "RDV pris" },
  { value: "MESSAGE",     label: "Message" },
  { value: "TRANSFERRED", label: "Transféré" },
  { value: "MISSED",      label: "Manqué" },
] as const;

// ─── Fonctions utilitaires ────────────────────────────────────────────────────

/**
 * Formate une durée en secondes vers une chaîne lisible.
 * Ex : 134 → "2m14s" | 45 → "45s"
 */
function formatDuration(sec: number): string {
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  return min > 0 ? `${min}m${s.toString().padStart(2, "0")}s` : `${s}s`;
}

/**
 * Formate une date ISO en français.
 * full=false → "28 juin à 14h32" (pour la liste, compact)
 * full=true  → "28 juin 2026 à 14h32" (pour le détail, complet)
 */
function formatDate(iso: string, full = false): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleDateString("fr-FR", { month: "long" });
  const year = d.getFullYear();
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return full
    ? `${day} ${month} ${year} à ${h}h${m}`
    : `${day} ${month} à ${h}h${m}`;
}

/**
 * Valide et transforme le champ transcript (type Json de Prisma, donc "unknown")
 * en tableau typé. Filtre silencieusement les entrées malformées au lieu de planter.
 *
 * Prisma représente un champ Json en TypeScript comme "unknown" — on ne peut pas
 * faire confiance à sa structure sans vérification explicite. Cette fonction est le
 * seul endroit où on passe de "unknown" à "TranscriptEntry[]".
 */
function parseTranscript(raw: unknown): TranscriptEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (e): e is TranscriptEntry =>
      e !== null &&
      typeof e === "object" &&
      !Array.isArray(e) &&
      (e.speaker === "AI" || e.speaker === "CALLER") &&
      typeof e.text === "string" &&
      typeof e.t === "number"
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AppelsPage() {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres utilisateur
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // valeur "debounced" utilisée pour fetch
  const [outcomeFilter, setOutcomeFilter] = useState("");

  // Appel sélectionné pour le détail
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);

  // Sur mobile, on n'affiche qu'une colonne à la fois.
  // true = on montre le détail (plein écran), false = on montre la liste.
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false);

  // ── Debounce de la recherche ──────────────────────────────────────────────
  // Évite de déclencher une requête API à chaque lettre tapée.
  // Mécanisme : on pose un setTimeout de 400ms ; si l'utilisateur retape avant
  // qu'il s'écoule, on annule le précédent (clearTimeout) et on en pose un nouveau.
  // Résultat : l'API n'est appelée que 400ms après la dernière frappe.
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── Chargement des appels ─────────────────────────────────────────────────
  // Se relance automatiquement chaque fois que searchQuery ou outcomeFilter change.
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Construction de l'URL avec les paramètres actifs.
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (outcomeFilter)      params.set("outcome", outcomeFilter);
    const qs = params.size > 0 ? `?${params.toString()}` : "";

    fetch(`/api/calls${qs}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur serveur");
        return res.json();
      })
      .then((data: CallLog[]) => setCalls(data))
      .catch(() => setError("Impossible de charger les appels."))
      .finally(() => setIsLoading(false));
  }, [searchQuery, outcomeFilter]);

  function handleSelectCall(call: CallLog) {
    setSelectedCall(call);
    setShowDetailOnMobile(true);
  }

  function handleBack() {
    setShowDetailOnMobile(false);
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appels</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Historique des appels traités par votre assistant.
        </p>
      </div>

      {/* ── Encadré pédagogique ── */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 leading-relaxed">
          Retrouvez ici tous les appels traités par votre assistant. Cliquez sur un appel
          pour voir la conversation détaillée et réécouter l&apos;enregistrement.
        </p>
      </div>

      {/* ── Barre d'outils ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Champ de recherche par numéro */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Rechercher un numéro…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filtres outcome */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setOutcomeFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                outcomeFilter === opt.value
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Layout maître-détail ── */}
      {/* Sur mobile : une seule colonne visible à la fois.
          Sur lg+ : deux colonnes côte à côte. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── Colonne gauche : liste ─── */}
        {/* Masquée sur mobile quand le détail est affiché */}
        <div className={showDetailOnMobile ? "hidden lg:block" : "block"}>

          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Chargement des appels…
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 rounded-xl border border-dashed border-gray-200">
              <Phone className="w-8 h-8 mb-2 text-gray-300" />
              <p className="text-sm">Aucun appel trouvé.</p>
              {(searchQuery || outcomeFilter) && (
                <p className="text-xs mt-1">Essayez d&apos;élargir les filtres.</p>
              )}
            </div>
          ) : (
            <ul className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
              {calls.map((call) => {
                const cfg = OUTCOME_CONFIG[call.outcome];
                const isSelected = selectedCall?.id === call.id;

                return (
                  <li key={call.id}>
                    <button
                      onClick={() => handleSelectCall(call)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                        isSelected ? "bg-indigo-50" : "hover:bg-gray-50"
                      }`}
                    >
                      {/* Icône téléphone — rouge si appel manqué */}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          call.outcome === "MISSED" ? "bg-red-100" : "bg-indigo-100"
                        }`}
                      >
                        <Phone
                          className={`w-4 h-4 ${
                            call.outcome === "MISSED" ? "text-red-500" : "text-indigo-600"
                          }`}
                        />
                      </div>

                      {/* Info principale */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {call.callerNumber}
                          </span>
                          {/* Badge outcome */}
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(call.startedAt)}
                          <span className="mx-1">·</span>
                          {formatDuration(call.durationSec)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ─── Colonne droite : détail ─── */}
        {/* Sur mobile : visible en plein écran seulement après clic sur un appel */}
        <div className={showDetailOnMobile ? "block lg:block" : "hidden lg:block"}>
          {selectedCall ? (
            <CallDetail call={selectedCall} onBack={handleBack} />
          ) : (
            // Placeholder visible uniquement sur desktop quand rien n'est sélectionné
            <div className="hidden lg:flex flex-col items-center justify-center h-64 text-gray-400 rounded-xl border border-dashed border-gray-200">
              <Phone className="w-8 h-8 mb-2 text-gray-300" />
              <p className="text-sm">Sélectionnez un appel pour voir le détail</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sous-composant : panneau de détail d'un appel ───────────────────────────

function CallDetail({ call, onBack }: { call: CallLog; onBack: () => void }) {
  const cfg = OUTCOME_CONFIG[call.outcome];
  const entries = parseTranscript(call.transcript);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

      {/* En-tête */}
      <div className="p-4 border-b border-gray-100">
        {/* Bouton retour — visible uniquement sur mobile */}
        <button
          onClick={onBack}
          className="lg:hidden flex items-center gap-1 text-sm text-indigo-600 mb-3 hover:text-indigo-700"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour aux appels
        </button>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-900 text-base">{call.callerNumber}</p>
            <p className="text-sm text-gray-500 mt-0.5">{formatDate(call.startedAt, true)}</p>
            <p className="text-sm text-gray-500">
              Durée : {formatDuration(call.durationSec)}
            </p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Lecteur audio */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        {call.audioUrl ? (
          // L'élément <audio controls> affiche le lecteur natif du navigateur :
          // bouton lecture/pause, barre de progression, volume. Zéro JS requis.
          <audio controls src={call.audioUrl} className="w-full h-9" />
        ) : (
          <p className="text-xs text-gray-400 italic text-center py-1">
            Enregistrement non disponible pour cet appel.
          </p>
        )}
      </div>

      {/* Transcription façon messagerie */}
      <div className="p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Transcription
        </p>

        {entries.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-4">
            Aucune transcription disponible.
          </p>
        ) : (
          // Conteneur scrollable pour les longues transcriptions.
          // max-h-80 = 320px — évite que le panneau grandisse à l'infini.
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {entries.map((entry, i) => {
              const isAI = entry.speaker === "AI";
              return (
                // Ligne : IA à gauche, appelant à droite (flex-row-reverse).
                <div
                  key={i}
                  className={`flex items-end gap-2 ${isAI ? "" : "flex-row-reverse"}`}
                >
                  {/* Avatar emoji */}
                  <span className="text-lg shrink-0 leading-none mb-0.5" aria-hidden>
                    {isAI ? "🤖" : "👤"}
                  </span>

                  {/* Bulle de message */}
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      isAI
                        ? "bg-gray-100 text-gray-800 rounded-bl-sm"   // IA : gris, coin BG carré
                        : "bg-blue-100 text-blue-900 rounded-br-sm"   // Appelant : bleu, coin BD carré
                    }`}
                  >
                    {entry.text}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
