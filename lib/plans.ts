// Métadonnées d'affichage + helpers partagés autour de l'enum Plan.
// ⚠️ Ce fichier est importé côté client ET serveur : il ne doit contenir
// AUCUNE référence à process.env (les Price IDs Stripe vivent dans les routes serveur).

export type PlanEnum =
  | "STANDARD_MENSUEL"
  | "STANDARD_ANNUEL"
  | "FULLIA_MENSUEL"
  | "FULLIA_ANNUEL";

export type PlanFamily = "STANDARD" | "FULLIA";
export type PlanInterval = "mois" | "an";

interface PlanMeta {
  label: string; // Nom de la famille affiché ("Standard", "Full IA")
  family: PlanFamily;
  price: number; // en euros
  interval: PlanInterval;
}

export const PLAN_META: Record<PlanEnum, PlanMeta> = {
  STANDARD_MENSUEL: { label: "Standard", family: "STANDARD", price: 70, interval: "mois" },
  STANDARD_ANNUEL: { label: "Standard", family: "STANDARD", price: 700, interval: "an" },
  FULLIA_MENSUEL: { label: "Full IA", family: "FULLIA", price: 250, interval: "mois" },
  FULLIA_ANNUEL: { label: "Full IA", family: "FULLIA", price: 2000, interval: "an" },
};

// Offres mensuelles : trial 30 jours + frais d'installation au checkout.
const MONTHLY_PLANS = new Set<PlanEnum>(["STANDARD_MENSUEL", "FULLIA_MENSUEL"]);

export function isValidPlan(plan: string): plan is PlanEnum {
  return plan in PLAN_META;
}

export function isMonthlyPlan(plan: PlanEnum): boolean {
  return MONTHLY_PLANS.has(plan);
}

// Libellé compact pour l'UI : "Standard — 70 €/mois"
export function formatPlanLabel(plan: PlanEnum): string {
  const meta = PLAN_META[plan];
  return `${meta.label} — ${meta.price.toLocaleString("fr-FR")} €/${meta.interval}`;
}
