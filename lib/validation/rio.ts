import { getCountryConfig } from "../countries";

interface RioValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valide un code RIO selon les règles du pays.
 *
 * La logique est entièrement pilotée par CountryConfig :
 * - Si le pays ne requiert pas de RIO → on valide sans poser de question.
 * - Sinon on vérifie la longueur exacte (rioLength) et le format alphanumérique.
 *
 * Ajouter la validation RIO d'un nouveau pays = renseigner sa config, pas toucher ici.
 */
export function validateRio(rio: string, countryCode: string): RioValidationResult {
  const config = getCountryConfig(countryCode);

  if (!config) {
    return { valid: false, error: `Pays non supporté : ${countryCode}` };
  }

  // Certains pays n'ont pas de RIO (portabilité gérée autrement)
  if (!config.rioRequired) {
    return { valid: true };
  }

  const trimmed = rio.trim().toUpperCase();

  if (trimmed.length !== config.rioLength) {
    return {
      valid: false,
      error: `Le RIO doit contenir exactement ${config.rioLength} caractères`,
    };
  }

  // Format alphanumérique : lettres et chiffres uniquement
  if (!/^[A-Z0-9]+$/.test(trimmed)) {
    return { valid: false, error: "Le RIO ne doit contenir que des lettres et des chiffres" };
  }

  return { valid: true };
}
