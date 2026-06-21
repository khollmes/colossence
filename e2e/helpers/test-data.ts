// Génère un email unique à chaque test pour éviter les conflits de base de données
export function uniqueEmail(): string {
  return `e2e.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@test.local`
}

// Données complètes pour une inscription valide
export function buildRegisterData(overrides?: Partial<RegisterData>): RegisterData {
  const email = uniqueEmail()
  return {
    prenom: 'Test',
    nom: 'E2E',
    email,
    telephone: '0612345678',
    password: 'TestPassword123!',
    nomEntreprise: 'E2E Plomberie Test',
    siret: '12345678901234',
    metier: 'PLOMBIER',
    zoneIntervention: 'Paris et banlieue',
    horaires: 'Lun-Ven 8h-18h',
    tarifs: 'Dès 60€',
    telephoneATransferer: '0698765432',
    ...overrides,
  }
}

export interface RegisterData {
  prenom: string
  nom: string
  email: string
  telephone: string
  password: string
  nomEntreprise: string
  siret: string
  metier: string
  zoneIntervention: string
  horaires: string
  tarifs: string
  telephoneATransferer: string
}

// Compte admin créé par le seed Prisma — utilisé pour les tests de connexion
export const ADMIN_USER = {
  email: 'admin@colossence.com',
  password: 'Admin123!',
}

// Cartes Stripe en mode test
export const STRIPE_CARDS = {
  success: '4242 4242 4242 4242',   // Paiement accepté
  declined: '4000 0000 0000 0002',  // Paiement refusé
  expiry: '12/28',
  cvc: '123',
  zip: '75001',
}
