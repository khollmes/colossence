/**
 * Les 3 lignes de tarif "spéciales" créées par défaut pour CHAQUE entreprise.
 *
 * Pourquoi les pré-créer (au prix 0) ? Parce que la page Tarifs propose un bouton
 * "Modifier" sur chacune. Or on ne peut modifier (PATCH) qu'une ligne qui existe
 * déjà en base. En les créant dès l'inscription, elles sont toujours présentes :
 * le client n'a plus qu'à renseigner leur prix.
 *
 * Ce module est volontairement SANS dépendance (aucun import Prisma) pour être
 * réutilisable partout : routes API (alias @/), seed et scripts (chemins relatifs).
 */
export type SpecialPricingType = "NIGHT_SURCHARGE" | "HOLIDAY_SURCHARGE" | "TRAVEL";

export const DEFAULT_SPECIAL_PRICING: { type: SpecialPricingType; name: string }[] = [
  { type: "NIGHT_SURCHARGE", name: "Supplément heures de nuit" },
  { type: "HOLIDAY_SURCHARGE", name: "Supplément jours fériés" },
  { type: "TRAVEL", name: "Tarif de déplacement" },
];

/**
 * Payload prêt à l'emploi pour un `create` imbriqué Prisma
 * (businessProfile.pricingItems.create). Prix initialisé à 0 centime.
 */
export const defaultSpecialPricingCreateData = DEFAULT_SPECIAL_PRICING.map(
  (item) => ({ name: item.name, type: item.type, price: 0 })
);
