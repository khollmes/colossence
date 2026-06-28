interface SiretValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valide un numéro SIRET français (14 chiffres).
 *
 * Un SIRET = SIREN (9 chiffres) + NIC (5 chiffres).
 * La validité est vérifiée via l'algorithme de Luhn, utilisé aussi
 * pour les numéros de carte bancaire.
 */
export function validateSiret(siret: string): SiretValidationResult {
  // Supprimer les espaces éventuels (ex: "123 456 789 00012")
  const cleaned = siret.replace(/\s/g, "");

  // Vérifier que le SIRET contient exactement 14 chiffres
  if (!/^\d{14}$/.test(cleaned)) {
    return { valid: false, error: "Le SIRET doit contenir exactement 14 chiffres" };
  }

  // --- Algorithme de Luhn ---
  // But : vérifier que le SIRET n'est pas une suite de chiffres au hasard.
  // Chaque chiffre en position paire (0, 2, 4...) est doublé ; si le double
  // dépasse 9, on soustrait 9. La somme de tous les chiffres traités doit
  // être divisible par 10.

  let somme = 0;

  for (let i = 0; i < 14; i++) {
    let chiffre = parseInt(cleaned[i], 10);

    // Les positions paires (index 0, 2, 4...) sont doublées
    if (i % 2 === 0) {
      chiffre *= 2;

      // Si le double dépasse 9 (ex: 7*2=14), on soustrait 9 (14-9=5)
      // Ce qui revient à additionner les deux chiffres du résultat (1+4=5)
      if (chiffre > 9) {
        chiffre -= 9;
      }
    }

    somme += chiffre;
  }

  // La clé de contrôle est valide si la somme est un multiple de 10
  if (somme % 10 !== 0) {
    return { valid: false, error: "Numéro SIRET invalide (clé de contrôle incorrecte)" };
  }

  return { valid: true };
}
