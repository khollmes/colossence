interface PasswordChecks {
  // Au moins 8 caractères
  length: boolean;
  // Au moins une lettre majuscule
  uppercase: boolean;
  // Au moins une lettre minuscule
  lowercase: boolean;
  // Au moins un chiffre
  number: boolean;
}

interface PasswordStrengthResult {
  // Score de 0 (très faible) à 4 (très fort)
  score: number;
  label: "Trop faible" | "Faible" | "Moyen" | "Fort";
  checks: PasswordChecks;
}

/**
 * Évalue la force d'un mot de passe.
 *
 * Chaque critère rempli ajoute 1 point au score.
 * Score minimum pour être accepté : 3 (longueur + majuscule + chiffre).
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  // Vérification de chaque critère avec des expressions régulières
  const checks: PasswordChecks = {
    length: password.length >= 8,       // Au moins 8 caractères
    uppercase: /[A-Z]/.test(password),  // Contient au moins une majuscule
    lowercase: /[a-z]/.test(password),  // Contient au moins une minuscule
    number: /\d/.test(password),        // Contient au moins un chiffre
  };

  // Le score = nombre de critères remplis (0 à 4)
  const score = Object.values(checks).filter(Boolean).length;

  // Traduction du score en label lisible
  const label = scoreToLabel(score);

  return { score, label, checks };
}

/** Convertit un score numérique en libellé compréhensible. */
function scoreToLabel(score: number): PasswordStrengthResult["label"] {
  if (score <= 1) return "Trop faible";
  if (score === 2) return "Faible";
  if (score === 3) return "Moyen";
  return "Fort"; // score === 4
}
