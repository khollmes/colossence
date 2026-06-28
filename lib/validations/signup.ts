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

  // z.string().refine() permet d'utiliser notre propre logique de validation (Luhn)
  // plutôt qu'une simple regex. Le deuxième argument retourne le message d'erreur
  // renvoyé par validateSiret, pour éviter de dupliquer les messages.
  siret: z.string().refine(
    (v) => validateSiret(v).valid,
    (v) => ({ message: validateSiret(v).error ?? "Numéro SIRET invalide" })
  ),

  email: z.email("Adresse e-mail invalide"),

  // Deux refine() chaînés : chaque critère manquant donne un message précis
  // plutôt qu'un seul message générique "mot de passe invalide".
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .refine((v) => /[A-Z]/.test(v), "Le mot de passe doit contenir au moins une majuscule")
    .refine((v) => /\d/.test(v), "Le mot de passe doit contenir au moins un chiffre"),

  // libphonenumber-js connaît les règles de chaque opérateur (longueur, préfixes…)
  // La regex seule ne suffirait pas à valider un numéro FR correctement.
  telephone: z.string().refine(
    (v) => validatePhone(v, "FR").valid,
    (v) => ({ message: validatePhone(v, "FR").error ?? "Numéro de téléphone invalide" })
  ),

  // Le RIO n'est nécessaire qu'à l'activation de la ligne — optionnel à l'inscription.
  // Il sera demandé et stocké lors du flux de portabilité (à implémenter).
  rio: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
