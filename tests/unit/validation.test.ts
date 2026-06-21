import { describe, it, expect } from 'vitest'
import { registerSchema } from '@/lib/validations/register'

const validData = {
  prenom: 'Jean',
  nom: 'Dupont',
  email: 'jean.dupont@example.com',
  password: 'motdepasse123',
  telephone: '0612345678',
  nomEntreprise: 'Dupont Serrurerie',
  siret: '12345678901234',
  metier: 'SERRURIER' as const,
  zoneIntervention: 'Paris 75',
  horaires: 'Lun-Ven 8h-18h',
  tarifs: 'Dès 60€',
  telephoneATransferer: '0612345678',
}

describe('Schéma de validation - registerSchema', () => {
  // ─── Cas valide ──────────────────────────────────────────────────────────────

  it('accepte des données valides complètes', () => {
    const result = registerSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('accepte tous les métiers valides de l\'enum', () => {
    const metiers = ['SERRURIER', 'PLOMBIER', 'ELECTRICIEN', 'GARAGE', 'CHAUFFAGISTE'] as const
    for (const metier of metiers) {
      const result = registerSchema.safeParse({ ...validData, metier })
      expect(result.success, `Le métier ${metier} devrait être accepté`).toBe(true)
    }
  })

  // ─── SIRET ───────────────────────────────────────────────────────────────────

  it('rejette un SIRET trop court (< 14 chiffres)', () => {
    const result = registerSchema.safeParse({ ...validData, siret: '1234567890' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.path.includes('siret'))).toBe(true)
    }
  })

  it('rejette un SIRET trop long (> 14 chiffres)', () => {
    const result = registerSchema.safeParse({ ...validData, siret: '123456789012345' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.path.includes('siret'))).toBe(true)
    }
  })

  it('accepte un SIRET de exactement 14 caractères', () => {
    const result = registerSchema.safeParse({ ...validData, siret: '12345678901234' })
    expect(result.success).toBe(true)
  })

  // ─── Métier ──────────────────────────────────────────────────────────────────

  it('rejette un métier hors enum (ex: MENUISIER)', () => {
    const result = registerSchema.safeParse({ ...validData, metier: 'MENUISIER' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.path.includes('metier'))).toBe(true)
    }
  })

  it('rejette un métier vide', () => {
    const result = registerSchema.safeParse({ ...validData, metier: '' })
    expect(result.success).toBe(false)
  })

  // ─── Email ───────────────────────────────────────────────────────────────────

  it('rejette un email invalide (sans @)', () => {
    const result = registerSchema.safeParse({ ...validData, email: 'email-invalide' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.path.includes('email'))).toBe(true)
    }
  })

  it('rejette un email sans domaine', () => {
    const result = registerSchema.safeParse({ ...validData, email: 'user@' })
    expect(result.success).toBe(false)
  })

  // ─── Mot de passe ────────────────────────────────────────────────────────────

  it('rejette un mot de passe de moins de 8 caractères', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'court' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.path.includes('password'))).toBe(true)
    }
  })

  it('accepte un mot de passe de exactement 8 caractères', () => {
    const result = registerSchema.safeParse({ ...validData, password: '12345678' })
    expect(result.success).toBe(true)
  })

  // ─── Téléphone ───────────────────────────────────────────────────────────────

  it('rejette un téléphone vide', () => {
    const result = registerSchema.safeParse({ ...validData, telephone: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.path.includes('telephone'))).toBe(true)
    }
  })

  // ─── Champs requis ───────────────────────────────────────────────────────────

  it('rejette si le prénom est manquant', () => {
    const { prenom, ...withoutPrenom } = validData
    const result = registerSchema.safeParse(withoutPrenom)
    expect(result.success).toBe(false)
  })

  it('rejette si le nom d\'entreprise est vide', () => {
    const result = registerSchema.safeParse({ ...validData, nomEntreprise: '' })
    expect(result.success).toBe(false)
  })
})
