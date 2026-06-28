import type { CountryConfig } from "./types";

/**
 * Configuration France.
 * Le RIO (Relevé d'Identité Opérateur) est obligatoire pour toute
 * demande de portabilité de numéro en France — il fait 12 caractères.
 */
export const FR: CountryConfig = {
  code: "FR",
  name: "France",
  dialCode: "+33",
  rioRequired: true,
  rioLength: 12,
};
