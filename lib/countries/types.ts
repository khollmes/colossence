/**
 * Configuration d'un pays pour la validation téléphone et RIO.
 * Chaque pays exporte un objet qui implémente cette interface.
 */
export interface CountryConfig {
  /** Code ISO 3166-1 alpha-2 du pays (ex: "FR", "ES", "DE") */
  code: string;

  /** Nom lisible du pays (ex: "France") */
  name: string;

  /** Indicatif téléphonique international (ex: "+33") */
  dialCode: string;

  /** Indique si un code RIO est obligatoire pour la portabilité dans ce pays */
  rioRequired: boolean;

  /**
   * Longueur exacte du code RIO dans ce pays.
   * null si le RIO n'existe pas (rioRequired === false).
   */
  rioLength: number | null;
}
