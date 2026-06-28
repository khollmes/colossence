import type { CountryConfig } from "./types";
import { FR } from "./fr";

/**
 * Registre central des pays supportés.
 * Pour ajouter un pays : importer sa config et l'ajouter ici, c'est tout.
 */
const COUNTRIES: Record<string, CountryConfig> = {
  FR,
};

/**
 * Retourne la configuration d'un pays par son code ISO.
 * Retourne null si le pays n'est pas encore supporté.
 */
export function getCountryConfig(code: string): CountryConfig | null {
  return COUNTRIES[code.toUpperCase()] ?? null;
}

export type { CountryConfig };
export { FR };
