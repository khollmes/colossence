import { z } from "zod/v4";

export const registerSchema = z.object({
  prenom: z.string().min(1, "Le prénom est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  email: z.email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  telephone: z.string().min(1, "Le téléphone est requis"),
  nomEntreprise: z.string().min(1, "Le nom d'entreprise est requis"),
  siret: z.string().min(14, "Le SIRET doit contenir 14 chiffres").max(14),
  metier: z.enum(["SERRURIER", "PLOMBIER", "ELECTRICIEN", "GARAGE", "CHAUFFAGISTE"]),
  zoneIntervention: z.string().min(1, "La zone d'intervention est requise"),
  horaires: z.string().min(1, "Les horaires sont requis"),
  tarifs: z.string().min(1, "Les tarifs sont requis"),
  telephoneATransferer: z.string().min(1, "Le téléphone à transférer est requis"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
