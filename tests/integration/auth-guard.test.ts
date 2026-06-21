import { vi, describe, it, expect, beforeEach } from 'vitest'

// ─── Mocks hoistés ────────────────────────────────────────────────────────────

const { prismaMock, mockGetServerSession } = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    businessProfile: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    subscription: { findFirst: vi.fn() },
    log: { create: vi.fn() },
  },
  mockGetServerSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))
vi.mock('next-auth', () => ({ getServerSession: mockGetServerSession, default: vi.fn() }))
vi.mock('@/lib/stripe', () => ({
  default: {
    customers: { create: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
    billingPortal: { sessions: { create: vi.fn() } },
  },
}))
vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn(() => ({ success: true, remaining: 9 })),
  rateLimitResponse: vi.fn(),
  getClientIp: vi.fn(() => '127.0.0.1'),
}))

import { GET as profileGET, PUT as profilePUT } from '@/app/api/profile/route'
import { GET as secretaryGET } from '@/app/api/secretary/route'
import { GET as externalProfilesGET } from '@/app/api/external/profiles/route'
import { NextRequest } from 'next/server'

// ─── Sessions de test ─────────────────────────────────────────────────────────

const sessionUserA = {
  user: { id: 'user-A', email: 'usera@example.com', role: 'USER', name: 'User A' },
}

const sessionUserB = {
  user: { id: 'user-B', email: 'userb@example.com', role: 'USER', name: 'User B' },
}

const mockUserAProfile = {
  id: 'user-A',
  prenom: 'Alice',
  nom: 'Martin',
  email: 'usera@example.com',
  telephone: null,
  businessProfile: {
    nomEntreprise: 'Alice Plomberie',
    siret: '11111111111111',
    metier: 'PLOMBIER',
    zoneIntervention: 'Lyon',
    tarifs: '80€/h',
  },
}

describe('Sécurité des routes — protection par session', () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockResolvedValue(mockUserAProfile)
    prismaMock.businessProfile.findUnique.mockResolvedValue({ id: 'bp-A' })
    prismaMock.businessProfile.findMany.mockResolvedValue([])
  })

  // ─── /api/profile ──────────────────────────────────────────────────────────────

  describe('GET /api/profile', () => {
    it('retourne 401 si aucune session n\'est active', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const response = await profileGET()
      expect(response.status).toBe(401)

      const json = await response.json()
      expect(json.error).toMatch(/non autorisé/i)
    })

    it('retourne 200 avec les données de l\'utilisateur connecté', async () => {
      mockGetServerSession.mockResolvedValue(sessionUserA)

      const response = await profileGET()
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json.email).toBe('usera@example.com')
    })
  })

  describe('PUT /api/profile', () => {
    it('retourne 401 si aucune session n\'est active', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const req = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom: 'Bob' }),
      })

      const response = await profilePUT(req)
      expect(response.status).toBe(401)
    })
  })

  // ─── /api/secretary ────────────────────────────────────────────────────────────

  describe('GET /api/secretary', () => {
    it('retourne 401 sans session', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const response = await secretaryGET()
      expect(response.status).toBe(401)
    })
  })

  // ─── /api/external/profiles ────────────────────────────────────────────────────

  describe('GET /api/external/profiles', () => {
    it('retourne 401 sans clé API (header absent)', async () => {
      const req = new NextRequest('http://localhost/api/external/profiles', {
        method: 'GET',
      })

      const response = await externalProfilesGET(req)
      expect(response.status).toBe(401)

      const json = await response.json()
      expect(json.error).toMatch(/non autorisé/i)
    })

    it('retourne 401 avec une clé API incorrecte', async () => {
      const req = new NextRequest('http://localhost/api/external/profiles', {
        method: 'GET',
        headers: { 'x-api-key': 'mauvaise-cle-api' },
      })

      const response = await externalProfilesGET(req)
      expect(response.status).toBe(401)
    })

    it('retourne 200 avec la clé API correcte', async () => {
      prismaMock.businessProfile.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost/api/external/profiles', {
        method: 'GET',
        headers: { 'x-api-key': process.env.EXTERNAL_SERVER_API_KEY! },
      })

      const response = await externalProfilesGET(req)
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toHaveProperty('profiles')
      expect(Array.isArray(json.profiles)).toBe(true)
    })

    it('retourne uniquement les profils actifs avec abonnement ACTIVE', async () => {
      const mockProfile = {
        id: 'bp-A',
        nomEntreprise: 'Alice Plomberie',
        metier: 'PLOMBIER',
        zoneIntervention: 'Lyon',
        horaires: 'Lun-Ven 9h-17h',
        tarifs: '80€/h',
        telephoneATransferer: '0612345678',
        user: { id: 'user-A', email: 'usera@example.com', prenom: 'Alice', nom: 'Martin' },
        aiSecretaryConfig: {
          consignes: 'Pas le week-end',
          messageAccueil: 'Bonjour',
          isActive: true,
        },
      }
      prismaMock.businessProfile.findMany.mockResolvedValue([mockProfile])

      const req = new NextRequest('http://localhost/api/external/profiles', {
        method: 'GET',
        headers: { 'x-api-key': process.env.EXTERNAL_SERVER_API_KEY! },
      })

      const response = await externalProfilesGET(req)
      const json = await response.json()

      expect(json.profiles).toHaveLength(1)
      expect(json.profiles[0].userId).toBe('user-A')
      expect(json.profiles[0].isActive).toBe(true)
    })
  })

  // ─── Isolation des données entre utilisateurs ──────────────────────────────────

  describe('Isolation des données par utilisateur', () => {
    it('GET /api/profile retourne toujours les données de l\'utilisateur connecté, jamais celles d\'un autre', async () => {
      // User A est connecté : ses propres données sont retournées
      mockGetServerSession.mockResolvedValue(sessionUserA)
      prismaMock.user.findUnique.mockResolvedValue(mockUserAProfile)

      const response = await profileGET()
      const json = await response.json()

      // Vérifie que ce sont bien les données de User A
      expect(json.email).toBe('usera@example.com')
      // Vérifie que Prisma a cherché avec le bon userId (user-A, pas user-B)
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-A' } })
      )
    })

    it('quand User B est connecté, le profil de User A est inaccessible', async () => {
      // User B est connecté
      mockGetServerSession.mockResolvedValue(sessionUserB)
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUserAProfile,
        id: 'user-B',
        email: 'userb@example.com',
      })

      const response = await profileGET()
      const json = await response.json()

      // L'API n'a pas cherché user-A, elle a cherché user-B (l'utilisateur connecté)
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-B' } })
      )
      // User A ne devrait pas apparaître dans la réponse de User B
      expect(json.email).not.toBe('usera@example.com')
    })
  })
})
