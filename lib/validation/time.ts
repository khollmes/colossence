// Valide une heure "murale" au format "HH:MM" sur 24h (ex : "08:00", "23:30").
//
// Détail de la regex :
//   ([01]\d|2[0-3])  → heures : 00–19 (0/1 suivi d'un chiffre) OU 20–23
//   :                → le deux-points littéral
//   [0-5]\d          → minutes : 00–59
//
// Le zéro initial est OBLIGATOIRE ("08:00" et non "8:00") : c'est ce qui permet au
// tri alphabétique de correspondre au tri chronologique ("08:00" < "18:00").
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTime(value: unknown): value is string {
  return typeof value === "string" && TIME_REGEX.test(value);
}
