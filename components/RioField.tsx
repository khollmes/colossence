"use client";

import { useState, useId } from "react";
import { validateRio } from "@/lib/validation/rio";

const RIO_HELP =
  "Le RIO est votre code de portabilité. Composez le 3179 depuis votre ligne pour l'obtenir gratuitement.";

interface RioFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Code pays ISO (défaut "FR") */
  countryCode?: string;
  /** Erreur injectée depuis le parent (ex: validation au submit) */
  error?: string;
}

export default function RioField({
  id,
  value,
  onChange,
  countryCode = "FR",
  error,
}: RioFieldProps) {
  const [internalError, setInternalError] = useState<string | null>(null);
  // Gère l'affichage du tooltip via hover ET focus clavier
  const [tooltipVisible, setTooltipVisible] = useState(false);
  // useId génère un id stable côté serveur + client (pas de risque d'hydration)
  const tooltipId = useId();

  const handleBlur = () => {
    if (!value.trim()) {
      setInternalError(null);
      return;
    }
    const result = validateRio(value, countryCode);
    setInternalError(result.valid ? null : (result.error ?? "Code RIO invalide"));
  };

  const displayError = error ?? internalError;
  const errorId = `${id}-error`;

  return (
    <div>
      {/* Label + bouton d'aide sur la même ligne */}
      <div className="flex items-center gap-2 mb-1">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          Code RIO
        </label>

        {/* Bouton "?" — focusable au clavier, déclenche le tooltip */}
        <div className="relative">
          <button
            type="button"
            aria-label="Comment obtenir mon RIO ?"
            aria-describedby={tooltipId}
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
            onFocus={() => setTooltipVisible(true)}
            onBlur={() => setTooltipVisible(false)}
            className="w-4 h-4 rounded-full bg-gray-400 hover:bg-indigo-500 focus:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
          >
            ?
          </button>

          {/* Tooltip — visible au hover ET au focus du bouton "?" */}
          {tooltipVisible && (
            <div
              id={tooltipId}
              role="tooltip"
              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 px-3 py-2.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 leading-relaxed"
            >
              {RIO_HELP}
              {/* Petite flèche vers le bas */}
              <span
                aria-hidden="true"
                className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"
              />
            </div>
          )}
        </div>
      </div>

      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value.toUpperCase());
          setInternalError(null);
        }}
        onBlur={handleBlur}
        aria-describedby={displayError ? errorId : undefined}
        aria-invalid={!!displayError}
        maxLength={12}
        placeholder="ABCD12345678"
        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition tracking-widest font-mono ${
          displayError
            ? "border-red-400 bg-red-50 focus:ring-red-400"
            : "border-gray-300"
        }`}
      />

      {displayError && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
          <span aria-hidden="true">⚠</span>
          {displayError}
        </p>
      )}
    </div>
  );
}
