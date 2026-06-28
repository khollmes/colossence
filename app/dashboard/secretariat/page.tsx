"use client";

import { useState, useEffect, useRef } from "react";
import { Info, Save, Volume2, VolumeX, Phone } from "lucide-react";

// ─── Constantes ──────────────────────────────────────────────────────────────

const GREETING_MAX = 500;
const INSTRUCTIONS_MAX = 1000;

// Clé pour mémoriser le ton dans le navigateur (préférence locale, pas en base).
const TONE_STORAGE_KEY = "colossence-secretariat-tone";

// Options de ton disponibles — ne sont pas envoyées à l'API, juste un guide
// visuel pour aider le gestionnaire à rédiger son message.
const TONE_OPTIONS = [
  {
    value: "professionnel",
    label: "Professionnel",
    description: "Formel et rassurant, idéal pour les situations d'urgence.",
  },
  {
    value: "chaleureux",
    label: "Chaleureux",
    description: "Sympathique et proche, met le client à l'aise dès les premiers mots.",
  },
  {
    value: "direct",
    label: "Direct",
    description: "Efficace et concis, va droit au but sans formules superflues.",
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SecretariatPage() {
  // Valeurs du formulaire
  const [greetingMessage, setGreetingMessage] = useState("");
  const [aiInstructions, setAiInstructions] = useState("");
  // Ton : préférence locale uniquement (non persistée dans la base de données).
  const [tone, setTone] = useState("professionnel");

  // États de l'interface
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // État de la synthèse vocale ("parle-t-il en ce moment ?")
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Ref pour pouvoir annuler la synthèse si le composant se démonte
  // (on évite ainsi un appel à setIsSpeaking sur un composant démonté).
  const synthRef = useRef<typeof window.speechSynthesis | null>(null);

  // ── Chargement initial ──────────────────────────────────────────────────
  useEffect(() => {
    // Restaurer le ton sauvegardé localement (indépendant du serveur).
    const savedTone = localStorage.getItem(TONE_STORAGE_KEY);
    if (savedTone) setTone(savedTone);

    // Récupérer greetingMessage et aiInstructions depuis le serveur.
    fetch("/api/secretariat-config")
      .then((res) => res.json())
      .then((data) => {
        setGreetingMessage(data.greetingMessage ?? "");
        setAiInstructions(data.aiInstructions ?? "");
      })
      .catch(() => setError("Impossible de charger la configuration."))
      .finally(() => setIsLoading(false));

    // Conserver une référence à speechSynthesis pour le nettoyage ci-dessous.
    synthRef.current = window.speechSynthesis;

    // Annuler toute lecture en cours si l'on quitte la page.
    return () => {
      synthRef.current?.cancel();
    };
  }, []);

  // ── Sauvegarde ─────────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/secretariat-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ greetingMessage, aiInstructions }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de la sauvegarde.");

      // Le ton n'est pas envoyé à l'API — on le sauvegarde uniquement en local.
      localStorage.setItem(TONE_STORAGE_KEY, tone);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setIsSaving(false);
    }
  }

  // ── Synthèse vocale ────────────────────────────────────────────────────
  //
  // L'API SpeechSynthesis (Web Speech API) est intégrée dans les navigateurs
  // modernes — aucun serveur, aucun coût. Elle fonctionne en 3 étapes :
  //   1. Créer un SpeechSynthesisUtterance (= "la phrase à prononcer")
  //   2. Configurer la langue, le débit, etc.
  //   3. Appeler window.speechSynthesis.speak(utterance)
  //
  // On peut arrêter la lecture à tout moment avec window.speechSynthesis.cancel().
  function handleSpeak() {
    if (!("speechSynthesis" in window)) return;

    if (isSpeaking) {
      // Si une lecture est déjà en cours, on l'arrête.
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const text =
      greetingMessage.trim() || "Aucun message d'accueil n'a encore été configuré.";

    // Crée l'objet qui décrit ce qui sera lu.
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";  // Voix française
    utterance.rate = 0.92;     // Légèrement plus lent que la normale (0.1–10, défaut 1)
    utterance.pitch = 1;       // Hauteur de voix normale (0–2)

    // Callback déclenché automatiquement quand la lecture se termine.
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }

  // ── Rendu de chargement ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Chargement de la configuration…
      </div>
    );
  }

  const selectedTone = TONE_OPTIONS.find((t) => t.value === tone);

  // ── Rendu principal ─────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuration du secrétariat</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Personnalisez comment votre assistant IA accueille vos clients au téléphone.
        </p>
      </div>

      {/* ── Encadré pédagogique ── */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex gap-4">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 leading-relaxed">
          Le message d&apos;accueil est la première chose que vos clients entendent au
          téléphone. Un accueil clair et chaleureux inspire confiance et donne une image
          professionnelle de votre entreprise.
        </p>
      </div>

      {/* ── Grille 2 colonnes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* ─── Colonne gauche : formulaire ─── */}
        <form onSubmit={handleSave} className="space-y-6">

          {/* Message d'accueil */}
          <div>
            <label
              htmlFor="greeting"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Message d&apos;accueil
            </label>
            <textarea
              id="greeting"
              rows={5}
              maxLength={GREETING_MAX}
              value={greetingMessage}
              onChange={(e) => setGreetingMessage(e.target.value)}
              placeholder="Serrurerie Dupont bonjour, je suis votre assistant virtuel, comment puis-je vous aider ?"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            {/* Compteur de caractères : vire au rouge quand on approche de la limite. */}
            <p
              className={`text-right text-xs mt-1 ${
                greetingMessage.length >= GREETING_MAX
                  ? "text-red-500 font-medium"
                  : "text-gray-400"
              }`}
            >
              {greetingMessage.length}/{GREETING_MAX}
            </p>
          </div>

          {/* Ton de l'assistant (préférence locale) */}
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Ton de l&apos;assistant
            </span>
            <div className="space-y-2">
              {TONE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    tone === opt.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="tone"
                    value={opt.value}
                    checked={tone === opt.value}
                    onChange={() => setTone(opt.value)}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{opt.label}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5 italic">
              Le ton est mémorisé sur cet appareil uniquement et ne modifie pas le comportement de l&apos;IA.
            </p>
          </div>

          {/* Instructions spéciales */}
          <div>
            <label
              htmlFor="instructions"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Instructions spéciales
            </label>
            <textarea
              id="instructions"
              rows={6}
              maxLength={INSTRUCTIONS_MAX}
              value={aiInstructions}
              onChange={(e) => setAiInstructions(e.target.value)}
              placeholder="Toujours demander l'adresse exacte et la nature du problème."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <p
              className={`text-right text-xs mt-1 ${
                aiInstructions.length >= INSTRUCTIONS_MAX
                  ? "text-red-500 font-medium"
                  : "text-gray-400"
              }`}
            >
              {aiInstructions.length}/{INSTRUCTIONS_MAX}
            </p>
          </div>

          {/* Messages de retour */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2">
              <span aria-hidden>✓</span>
              Configuration enregistrée avec succès.
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>

        {/* ─── Colonne droite : aperçu téléphone (sticky) ─── */}
        <div className="lg:sticky lg:top-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Ce que vos appelants entendront
          </h2>

          {/* Cadre façon smartphone */}
          <div className="bg-gray-900 rounded-3xl p-3 shadow-2xl max-w-xs mx-auto">

            {/* Encoche du haut */}
            <div className="flex justify-center mb-3">
              <div className="w-20 h-1.5 rounded-full bg-gray-700" />
            </div>

            {/* Écran */}
            <div className="bg-white rounded-2xl p-5 min-h-64">
              {/* En-tête : identité de l'appelant fictif */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Assistant Colossence</p>
                  <p className="text-xs text-green-600">● En appel…</p>
                </div>
              </div>

              {/* Bulle de message (mise à jour en temps réel) */}
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 leading-relaxed min-h-20">
                {greetingMessage.trim() ? (
                  greetingMessage
                ) : (
                  <span className="text-gray-400 italic">
                    Votre message d&apos;accueil apparaîtra ici au fur et à mesure que vous tapez…
                  </span>
                )}
              </div>

              {/* Indicateur de ton sélectionné */}
              {selectedTone && (
                <p className="mt-3 text-xs text-gray-400">
                  Ton :{" "}
                  <span className="font-medium text-gray-600">{selectedTone.label}</span>
                  {" — "}
                  {selectedTone.description}
                </p>
              )}
            </div>

            {/* Bouton rond du bas */}
            <div className="flex justify-center mt-3">
              <div className="w-8 h-8 rounded-full bg-gray-700" />
            </div>
          </div>

          {/* Bouton synthèse vocale */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={handleSpeak}
              disabled={!greetingMessage.trim()}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4 text-red-500" />
                  Arrêter la lecture
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  🔊 Écouter un aperçu
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 mt-2">
              Utilise la synthèse vocale de votre navigateur en français.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
