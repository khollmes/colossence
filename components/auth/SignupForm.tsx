"use client";

import { useState } from "react";
import PhoneField from "@/components/PhoneField";
import RioField from "@/components/RioField";
import { validateSiret } from "@/lib/validation/siret";
import { checkPasswordStrength } from "@/lib/validation/password";
import { validatePhone } from "@/lib/validation/phone";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/** Toutes les données collectées dans le formulaire */
export interface SignupFormData {
  // Étape 1
  prenom: string;
  nom: string;
  // Étape 2
  nomEntreprise: string;
  siret: string;
  // Étape 3
  email: string;
  motDePasse: string;
  confirmation: string;
  // Étape 4
  telephone: string;
  rio: string;
}

/** Erreurs par champ (optionnelles) */
type FormErrors = Partial<Record<keyof SignupFormData, string>>;

export interface SignupFormProps {
  /** Appelée quand l'utilisateur valide la dernière étape */
  onSubmit: (data: SignupFormData) => void | Promise<void>;
}

// ─────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;
const STEP_LABELS = ["Identité", "Entreprise", "Accès", "Contact"];

// ─────────────────────────────────────────────────────────────
// Composants UI atomiques
// ─────────────────────────────────────────────────────────────

/** Titre + sous-titre d'une étape */
function StepTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

/**
 * Wrapper générique : label → champ → message d'erreur.
 * Le champ est passé en children pour rester flexible.
 */
function FormField({
  id,
  label,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}

/** Champ texte stylisé réutilisable */
function InputField({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  maxLength,
}: {
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
  maxLength?: number;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      maxLength={maxLength}
      aria-invalid={!!error}
      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${
        error
          ? "border-red-400 bg-red-50 focus:ring-red-400"
          : "border-gray-300 hover:border-gray-400"
      }`}
    />
  );
}

/**
 * Champ mot de passe avec bouton "Afficher / Masquer".
 * L'état show/hide est local au champ.
 */
function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        // pr-20 pour laisser la place au bouton "Afficher"
        className={`w-full px-4 py-2.5 pr-20 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${
          error
            ? "border-red-400 bg-red-50 focus:ring-red-400"
            : "border-gray-300 hover:border-gray-400"
        }`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-indigo-500 hover:text-indigo-700 transition"
      >
        {show ? "Masquer" : "Afficher"}
      </button>
    </div>
  );
}

/**
 * Barre de force du mot de passe.
 * Affiche 4 segments colorés selon le score et liste les critères manquants.
 */
function PasswordStrengthBar({
  strength,
}: {
  strength: ReturnType<typeof checkPasswordStrength>;
}) {
  // Couleur des segments : rouge → orange → jaune → vert
  const segmentColor =
    strength.score <= 1
      ? "bg-red-400"
      : strength.score === 2
      ? "bg-orange-400"
      : strength.score === 3
      ? "bg-yellow-400"
      : "bg-green-500";

  const labelColor =
    strength.score <= 1
      ? "text-red-500"
      : strength.score === 2
      ? "text-orange-500"
      : strength.score === 3
      ? "text-yellow-600"
      : "text-green-600";

  // Critères encore non remplis (pour guider l'utilisateur)
  const missing = [
    !strength.checks.length && "8 car. min",
    !strength.checks.uppercase && "Majuscule",
    !strength.checks.number && "Chiffre",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mt-2">
      {/* 4 segments de couleur progressive */}
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              n <= strength.score ? segmentColor : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className={`text-xs font-medium ${labelColor}`}>{strength.label}</span>
        {missing && <span className="text-xs text-gray-400">{missing}</span>}
      </div>
    </div>
  );
}

/**
 * Barre de progression en haut du formulaire.
 * Affiche des ronds numérotés reliés par une ligne colorée.
 */
function ProgressBar({
  currentStep,
  totalSteps,
  stepLabels,
}: {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}) {
  // Pourcentage de progression pour la ligne horizontale
  const percent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="mb-8">
      <div className="flex items-start justify-between relative">
        {/* Ligne de fond (grise) */}
        <div className="absolute left-3.5 right-3.5 top-3.5 h-0.5 bg-gray-200 -z-10" />
        {/* Ligne de progression (indigo), animée */}
        <div
          className="absolute left-3.5 top-3.5 h-0.5 bg-indigo-600 transition-all duration-300 ease-out -z-10"
          style={{ width: `calc(${percent}% - 0.875rem * 2 * ${percent / 100})` }}
          // Note : ce calcul approximatif corrige l'offset des ronds aux extrémités
        />

        {stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const done = stepNum < currentStep;
          const active = stepNum === currentStep;

          return (
            <div key={label} className="flex flex-col items-center gap-1.5">
              {/* Rond indicateur */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                  done
                    ? "bg-indigo-600 text-white"
                    : active
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                    : "bg-white border-2 border-gray-300 text-gray-400"
                }`}
              >
                {done ? "✓" : stepNum}
              </div>
              {/* Label de l'étape — masqué sur mobile */}
              <span
                className={`text-xs font-medium hidden sm:block ${
                  active ? "text-indigo-600" : done ? "text-gray-600" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Indicateur compact pour mobile */}
      <p className="text-center text-sm text-gray-500 mt-4 sm:hidden">
        Étape {currentStep} sur {totalSteps} — {stepLabels[currentStep - 1]}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Étapes du formulaire
// ─────────────────────────────────────────────────────────────

/** Props partagées par toutes les étapes */
type StepProps = {
  formData: SignupFormData;
  errors: FormErrors;
  updateField: (field: keyof SignupFormData, value: string) => void;
};

/** Étape 1 — Prénom et Nom */
function StepIdentity({ formData, errors, updateField }: StepProps) {
  return (
    <>
      <StepTitle
        title="Vos informations personnelles"
        subtitle="Comment devons-nous vous appeler ?"
      />
      <div className="space-y-4">
        <FormField id="prenom" label="Prénom" error={errors.prenom} required>
          <InputField
            id="prenom"
            value={formData.prenom}
            onChange={(v) => updateField("prenom", v)}
            placeholder="Marie"
            autoComplete="given-name"
            error={errors.prenom}
          />
        </FormField>
        <FormField id="nom" label="Nom" error={errors.nom} required>
          <InputField
            id="nom"
            value={formData.nom}
            onChange={(v) => updateField("nom", v)}
            placeholder="Dupont"
            autoComplete="family-name"
            error={errors.nom}
          />
        </FormField>
      </div>
    </>
  );
}

/** Étape 2 — Nom d'entreprise et SIRET */
function StepCompany({ formData, errors, updateField }: StepProps) {
  return (
    <>
      <StepTitle
        title="Votre entreprise"
        subtitle="Ces informations nous permettent de vérifier votre identité légale."
      />
      <div className="space-y-4">
        <FormField
          id="nomEntreprise"
          label="Nom de l'entreprise"
          error={errors.nomEntreprise}
          required
        >
          <InputField
            id="nomEntreprise"
            value={formData.nomEntreprise}
            onChange={(v) => updateField("nomEntreprise", v)}
            placeholder="Ma Société SAS"
            autoComplete="organization"
            error={errors.nomEntreprise}
          />
        </FormField>

        <FormField id="siret" label="Numéro SIRET" error={errors.siret} required>
          <InputField
            id="siret"
            value={formData.siret}
            // On accepte uniquement les chiffres (pas d'espaces dans l'état)
            onChange={(v) => updateField("siret", v.replace(/\D/g, ""))}
            placeholder="73282932000074"
            autoComplete="off"
            maxLength={14}
            error={errors.siret}
          />
          <p className="mt-1 text-xs text-gray-400">
            14 chiffres — visible sur votre extrait Kbis ou sur{" "}
            <span className="font-medium">annuaire-entreprises.data.gouv.fr</span>
          </p>
        </FormField>
      </div>
    </>
  );
}

/** Étape 3 — Email, mot de passe et confirmation */
function StepAccess({
  formData,
  errors,
  updateField,
  passwordStrength,
}: StepProps & { passwordStrength: ReturnType<typeof checkPasswordStrength> }) {
  return (
    <>
      <StepTitle
        title="Vos identifiants de connexion"
        subtitle="Ces informations vous permettront de vous connecter à votre espace."
      />
      <div className="space-y-4">
        <FormField id="email" label="Adresse e-mail" error={errors.email} required>
          <InputField
            id="email"
            type="email"
            value={formData.email}
            onChange={(v) => updateField("email", v)}
            placeholder="marie@entreprise.fr"
            autoComplete="email"
            error={errors.email}
          />
        </FormField>

        <FormField id="motDePasse" label="Mot de passe" error={errors.motDePasse} required>
          <PasswordInput
            id="motDePasse"
            value={formData.motDePasse}
            onChange={(v) => updateField("motDePasse", v)}
            placeholder="Au moins 8 caractères"
            autoComplete="new-password"
            error={errors.motDePasse}
          />
          {/* Indicateur de force — apparaît dès le premier caractère */}
          {formData.motDePasse.length > 0 && (
            <PasswordStrengthBar strength={passwordStrength} />
          )}
        </FormField>

        <FormField
          id="confirmation"
          label="Confirmer le mot de passe"
          error={errors.confirmation}
          required
        >
          <PasswordInput
            id="confirmation"
            value={formData.confirmation}
            onChange={(v) => updateField("confirmation", v)}
            placeholder="Répétez votre mot de passe"
            autoComplete="new-password"
            error={errors.confirmation}
          />
        </FormField>
      </div>
    </>
  );
}

/** Étape 4 — Téléphone et RIO (optionnel) */
function StepContact({ formData, errors, updateField }: StepProps) {
  return (
    <>
      <StepTitle
        title="Vos coordonnées"
        subtitle="Pour activer et gérer votre ligne téléphonique."
      />
      <div className="space-y-4">
        <PhoneField
          id="telephone"
          label="Numéro de téléphone"
          value={formData.telephone}
          onChange={(v) => updateField("telephone", v)}
          required
          error={errors.telephone}
        />

        <RioField
          id="rio"
          value={formData.rio}
          onChange={(v) => updateField("rio", v)}
          error={errors.rio}
        />

        {/* Note rassurante sur l'aspect optionnel du RIO */}
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-800 leading-relaxed">
          <p className="font-semibold mb-1">Le code RIO est optionnel</p>
          <p>
            Vous pouvez finaliser votre inscription sans RIO. Ce code ne sera nécessaire
            qu'au moment de l'activation de votre ligne, si vous souhaitez conserver
            votre numéro actuel (portabilité).
          </p>
          <p className="mt-2 flex items-baseline gap-1 flex-wrap">
            Pour l'obtenir gratuitement, composez le
            <span className="font-bold text-blue-900 text-base">3179</span>
            depuis votre ligne mobile et notez le code communiqué par le serveur vocal.
          </p>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────

export default function SignupForm({ onSubmit }: SignupFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  // visible contrôle la transition de fondu entre étapes
  const [visible, setVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Un seul objet d'état pour tout le formulaire (plus simple à transmettre à onSubmit)
  const [formData, setFormData] = useState<SignupFormData>({
    prenom: "",
    nom: "",
    nomEntreprise: "",
    siret: "",
    email: "",
    motDePasse: "",
    confirmation: "",
    telephone: "",
    rio: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Met à jour un seul champ sans écraser les autres.
   * Efface également l'erreur associée dès que l'utilisateur retape.
   */
  const updateField = (field: keyof SignupFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /**
   * Transition entre étapes : fondu sortant (200ms) → changement → fondu entrant.
   * Les erreurs sont effacées à chaque changement d'étape.
   */
  const goToStep = (nextStep: number) => {
    setVisible(false);
    setTimeout(() => {
      setCurrentStep(nextStep);
      setErrors({});
      setVisible(true);
    }, 200);
  };

  /**
   * Valide les champs de l'étape courante.
   * Retourne true si aucune erreur, false sinon (et remplit l'objet errors).
   */
  const validateStep = (): boolean => {
    const newErrors: FormErrors = {};

    if (currentStep === 1) {
      if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est requis";
      if (!formData.nom.trim()) newErrors.nom = "Le nom est requis";
    }

    if (currentStep === 2) {
      if (!formData.nomEntreprise.trim())
        newErrors.nomEntreprise = "Le nom de l'entreprise est requis";

      const siretResult = validateSiret(formData.siret);
      if (!siretResult.valid)
        newErrors.siret = siretResult.error ?? "Numéro SIRET invalide";
    }

    if (currentStep === 3) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        newErrors.email = "Adresse e-mail invalide";

      // Vérification des critères minimum du mot de passe
      const { checks } = checkPasswordStrength(formData.motDePasse);
      if (!checks.length) {
        newErrors.motDePasse = "Le mot de passe doit contenir au moins 8 caractères";
      } else if (!checks.uppercase) {
        newErrors.motDePasse = "Ajoutez au moins une lettre majuscule";
      } else if (!checks.number) {
        newErrors.motDePasse = "Ajoutez au moins un chiffre";
      }

      if (formData.confirmation !== formData.motDePasse)
        newErrors.confirmation = "Les mots de passe ne correspondent pas";
    }

    if (currentStep === 4) {
      if (!formData.telephone.trim()) {
        newErrors.telephone = "Le numéro de téléphone est requis";
      } else {
        const phoneResult = validatePhone(formData.telephone, "FR");
        if (!phoneResult.valid)
          newErrors.telephone = phoneResult.error ?? "Numéro invalide";
      }
      // Le RIO n'est pas validé ici car il est optionnel
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) goToStep(currentStep + 1);
  };

  const handlePrev = () => goToStep(currentStep - 1);

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculé en continu pour l'indicateur visuel à l'étape 3
  const passwordStrength = checkPasswordStrength(formData.motDePasse);

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8">
      <ProgressBar
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        stepLabels={STEP_LABELS}
      />

      {/* Carte principale — transition de fondu et léger glissement vertical */}
      <div
        className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 transition-all duration-200 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
        }`}
      >
        {currentStep === 1 && (
          <StepIdentity formData={formData} errors={errors} updateField={updateField} />
        )}
        {currentStep === 2 && (
          <StepCompany formData={formData} errors={errors} updateField={updateField} />
        )}
        {currentStep === 3 && (
          <StepAccess
            formData={formData}
            errors={errors}
            updateField={updateField}
            passwordStrength={passwordStrength}
          />
        )}
        {currentStep === 4 && (
          <StepContact formData={formData} errors={errors} updateField={updateField} />
        )}

        {/* Barre de navigation : Précédent à gauche, Suivant/S'inscrire à droite */}
        <div
          className={`flex gap-3 mt-8 ${
            currentStep === 1 ? "justify-end" : "justify-between"
          }`}
        >
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition font-medium text-sm"
            >
              ← Précédent
            </button>
          )}

          {currentStep < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 transition font-medium text-sm shadow-sm"
            >
              Suivant →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 transition font-medium text-sm shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Inscription en cours…" : "S'inscrire"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
