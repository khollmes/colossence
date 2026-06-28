"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhoneField from "@/components/PhoneField";
import { validatePhone } from "@/lib/validation/phone";

const METIER_OPTIONS = [
  { value: "SERRURIER", label: "Serrurier" },
  { value: "PLOMBIER", label: "Plombier" },
  { value: "ELECTRICIEN", label: "Électricien" },
  { value: "GARAGE", label: "Garage" },
  { value: "CHAUFFAGISTE", label: "Chauffagiste" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    password: "",
    confirmPassword: "",
    nomEntreprise: "",
    siret: "",
    metier: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Valide téléphone et correspondance des mots de passe avant de passer à l'étape 2
  const nextStep = () => {
    if (step === 1) {
      const newErrors: Record<string, string> = {};

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Adresse e-mail invalide";
      }

      const phoneResult = validatePhone(formData.telephone, "FR");
      if (!phoneResult.valid) {
        newErrors.telephone = phoneResult.error ?? "Numéro invalide";
      }

      if (!formData.password) {
        newErrors.password = "Le mot de passe est requis";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
      }

      if (Object.keys(newErrors).length > 0) {
        setFieldErrors(newErrors);
        return;
      }
    }
    setFieldErrors({});
    setStep(2);
  };

  const prevStep = () => {
    setFieldErrors({});
    setStep(1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // On exclut confirmPassword : l'API n'en a pas besoin et la validation
      // côté serveur rejetterait un champ inconnu du schéma Zod.
      const { confirmPassword: _, ...payload } = formData;
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Créer un compte</h1>
          <p className="mt-2 text-gray-600">Étape {step} sur 2</p>
        </div>

        {/* Barre de progression */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-indigo-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div
              className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
              data-testid="register-error"
            >
              {error}
            </div>
          )}

          {/* Étape 1 : Informations personnelles */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Informations personnelles
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => updateField("prenom", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => updateField("nom", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="Dupont"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    updateField("email", e.target.value);
                    clearFieldError("email");
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${
                    fieldErrors.email ? "border-red-400 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="jean@exemple.fr"
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-sm text-red-600">⚠ {fieldErrors.email}</p>
                )}
              </div>
              <PhoneField
                id="telephone"
                label="Téléphone"
                value={formData.telephone}
                onChange={(v) => {
                  updateField("telephone", v);
                  clearFieldError("telephone");
                }}
                error={fieldErrors.telephone}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    updateField("password", e.target.value);
                    clearFieldError("password");
                    clearFieldError("confirmPassword");
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${
                    fieldErrors.password ? "border-red-400 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="••••••••"
                />
                {fieldErrors.password && (
                  <p className="mt-1.5 text-sm text-red-600">⚠ {fieldErrors.password}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    updateField("confirmPassword", e.target.value);
                    clearFieldError("confirmPassword");
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${
                    fieldErrors.confirmPassword ? "border-red-400 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="••••••••"
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1.5 text-sm text-red-600">⚠ {fieldErrors.confirmPassword}</p>
                )}
              </div>
            </div>
          )}

          {/* Étape 2 : Informations entreprise */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Informations entreprise
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l&apos;entreprise
                </label>
                <input
                  type="text"
                  value={formData.nomEntreprise}
                  onChange={(e) => updateField("nomEntreprise", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="Dupont Plomberie"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SIRET (14 chiffres)
                </label>
                <input
                  type="text"
                  value={formData.siret}
                  onChange={(e) => updateField("siret", e.target.value)}
                  maxLength={14}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="12345678901234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Métier
                </label>
                <select
                  value={formData.metier}
                  onChange={(e) => updateField("metier", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white"
                >
                  <option value="">Sélectionner un métier</option>
                  {METIER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
                data-testid="btn-back"
              >
                Retour
              </button>
            ) : (
              <div />
            )}

            {step < 2 ? (
              <button
                onClick={nextStep}
                className="px-6 py-2.5 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition font-medium"
                data-testid="btn-next"
              >
                Suivant
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="btn-submit"
              >
                {loading ? "Création..." : "Créer mon compte"}
              </button>
            )}
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-gray-600">
          Déjà un compte ?{" "}
          <a href="/login" className="text-indigo-600 hover:underline font-medium">
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}
