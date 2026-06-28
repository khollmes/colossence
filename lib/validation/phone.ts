import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";

interface PhoneValidationResult {
  valid: boolean;
  /** Numéro formaté en E.164 (ex: "+33612345678") — présent si valid = true */
  formatted?: string;
  error?: string;
}

/**
 * Valide un numéro de téléphone pour un pays donné.
 *
 * Utilise libphonenumber-js qui connaît les règles de chaque opérateur :
 * longueur, préfixes valides, numéros spéciaux, etc.
 * Le format E.164 retourné est le standard international (+33XXXXXXXXX).
 */
export function validatePhone(
  phone: string,
  countryCode: string
): PhoneValidationResult {
  try {
    const country = countryCode.toUpperCase() as CountryCode;

    if (!isValidPhoneNumber(phone, country)) {
      return { valid: false, error: "Numéro de téléphone invalide pour ce pays" };
    }

    const parsed = parsePhoneNumber(phone, country);
    return { valid: true, formatted: parsed.format("E.164") };
  } catch {
    return { valid: false, error: "Format de numéro de téléphone incorrect" };
  }
}
