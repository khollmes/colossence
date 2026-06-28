/**
 * Schéma de validation Zod pour l'inscription simplifiée.
 *
 * Différence avec lib/validations/register.ts (l'ancien formulaire complet) :
 * ce schéma couvre uniquement les données collectées à l'étape d'inscription.
 * La complétion du BusinessProfile (métier, zone, horaires…) se fait ensuite
 * dans un flux d'onboarding séparé.
 */

import { z } from "zod/v4";
import { validateSiret } from "@/lib/validation/siret";
import { validatePhone } from "@/lib/validation/phone";

export const signupSchema = z.object({
  prenom: z.string().min(1, "Le prénom est requis"),
  nom: z.string().min(1, "Le nom est requis"),

  nomEntreprise: z.string().min(1, "Le nom de l'entreprise est requis"),

  // superRefine() est nécessaire en Zod v4 pour les messages d'erreur dynamiques.
  // refine() n'accepte qu'un message statique (string) — pas une fonction.
  // superRefine() donne accès à ctx.addIssue() pour construire le message
  // à partir du résultat de validateSiret (qui inclut le détail de l'erreur Luhn).
  siret: z.string().superRefine((v, ctx) => {
    const result = validateSiret(v);
    if (!result.valid) {
      ctx.addIssue({ code: "custom", message: result.error ?? "Numéro SIRET invalide" });
    }
  }),

  email: z.email("Adresse e-mail invalide"),

  // Deux refine() chaînés : chaque critère manquant donne un message précis
  // plutôt qu'un seul message générique "mot de passe invalide".
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .refine((v) => /[A-Z]/.test(v), "Le mot de passe doit contenir au moins une majuscule")
    .refine((v) => /\d/.test(v), "Le mot de passe doit contenir au moins un chiffre"),

  // Même logique : superRefine pour récupérer le message précis de libphonenumber-js.
  telephone: z.string().superRefine((v, ctx) => {
    const result = validatePhone(v, "FR");
    if (!result.valid) {
      ctx.addIssue({ code: "custom", message: result.error ?? "Numéro de téléphone invalide" });
    }
  }),

  // Le RIO n'est nécessaire qu'à l'activation de la ligne — optionnel à l'inscription.
  // Il sera demandé et stocké lors du flux de portabilité (à implémenter).
  rio: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
