"use client";

import { useState } from "react";
import { validatePhone } from "@/lib/validation/phone";

interface PhoneFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Code pays ISO (défaut "FR") */
  countryCode?: string;
  placeholder?: string;
  required?: boolean;
  /** Erreur injectée depuis le parent (ex: validation au submit) */
  error?: string;
}

export default function PhoneField({
  id,
  label,
  value,
  onChange,
  countryCode = "FR",
  placeholder = "06 12 34 56 78",
  required,
  error,
}: PhoneFieldProps) {
  const [internalError, setInternalError] = useState<string | null>(null);

  const handleBlur = () => {
    if (!value.trim()) {
      setInternalError(null);
      return;
    }
    const result = validatePhone(value, countryCode);
    setInternalError(result.valid ? null : (result.error ?? "Numéro invalide"));
  };

  // L'erreur du parent (submit) prend le dessus sur l'erreur interne (blur)
  const displayError = error ?? internalError;
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        type="tel"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          // Efface l'erreur interne dès que l'utilisateur retape
          setInternalError(null);
        }}
        onBlur={handleBlur}
        aria-describedby={displayError ? errorId : undefined}
        aria-invalid={!!displayError}
        required={required}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${
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
