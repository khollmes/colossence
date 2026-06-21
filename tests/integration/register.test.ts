import { vi, describe, it, expect, beforeEach } from 'vitest'

// ─── Mocks hoistés (doivent être déclarés avant tout import) ─────────────────

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))
vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn(() => ({ success: true, remaining: 9 })),
  rateLimitResponse: vi.fn(() =>
    new Response(JSON.stringify({ error: 'Trop de requêtes' }), { status: 429 })
  ),
  getClientIp: vi.fn(() => '127.0.0.1'),
}))
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$12$mockhashXXXXXXXXXXXXXXXXXXXXXXXX'),
    compare: vi.fn().mockResolvedValue(true),
  },
  hash: vi.fn().mockResolvedValue('$2b$12$mockhashXXXXXXXXXXXXXXXXXXXXXXXX'),
}))

import { POST } from '@/app/api/register/route'

// ─── Données de test ──────────────────────────────────────────────────────────

const validBody = {
  prenom: 'Jean',
  nom: 'Dupont',
  email: 'jean.dupont@example.com',
  password: 'motdepasse123',
  telephone: '0612345678',
  nomEntreprise: 'Dupont Serrurerie',
  siret: '12345678901234',
  metier: 'SERRURIER',
  zoneIntervention: 'Paris 75',
  horaires: 'Lun-Ven 8h-18h',
  tarifs: 'Dès 60€',
  telephoneATransferer: '0612345678',
}

const mockCreatedUser = {
  id: 'user-123',
  email: 'jean.dupont@example.com',
  prenom: 'Jean',
  nom: 'Dupont',
  passwordHash: '$2b$12$mockhashXXXXXXXXXXXXXXXXXXXXXXXX',
  businessProfile: {
    id: 'bp-123',
    aiSecretaryConfig: { id: 'config-123', isActive: true },
  },
}

function buildRequest(body: object) {
  return new Request('http://localhost/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/register', () => {
  beforeEach(() => {
    // Par défaut : aucun utilisateur existant, transaction réussie
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.$transaction.mockImplementation(async (fn: (tx: any) => any) => {
      const tx = {
        user: { create: vi.fn().mockResolvedValue(mockCreatedUser) },
      }
      return fn(tx)
    })
  })

  // ─── Cas nominal ─────────────────────────────────────────────────────────────

  it('retourne 201 avec les données de l\'utilisateur créé', async () => {
    const response = await POST(buildRequest(validBody))

    expect(response.status).toBe(201)
    const json = await response.json()
    expect(json.user).toMatchObject({
      id: 'user-123',
      email: 'jean.dupont@example.com',
      prenom: 'Jean',
      nom: 'Dupont',
    })
  })

  it('ne renvoie jamais le mot de passe en clair dans la réponse', async () => {
    const response = await POST(buildRequest(validBody))
    const json = await response.json()

    // Le corps de la réponse ne doit pas contenir le mot de passe ni le hash
    const responseText = JSON.stringify(json)
    expect(responseText).not.toContain('motdepasse123')
    expect(responseText).not.toContain('passwordHash')
    expect(json.user).not.toHaveProperty('passwordHash')
    expect(json.user).not.toHaveProperty('password')
  })

  // ─── Email déjà existant ──────────────────────────────────────────────────────

  it('retourne 409 si l\'email est déjà enregistré', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-existant',
      email: 'jean.dupont@example.com',
    })

    const response = await POST(buildRequest(validBody))

    expect(response.status).toBe(409)
    const json = await response.json()
    expect(json.error).toMatch(/existe déjà/i)
  })

  // ─── Validation Zod ───────────────────────────────────────────────────────────

  it('retourne 400 pour un email invalide', async () => {
    const response = await POST(buildRequest({ ...validBody, email: 'invalide-email' }))

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toMatch(/invalide/i)
  })

  it('retourne 400 pour un mot de passe trop court (< 8 caractères)', async () => {
    const response = await POST(buildRequest({ ...validBody, password: 'court' }))

    expect(response.status).toBe(400)
  })

  it('retourne 400 pour un SIRET invalide (pas 14 caractères)', async () => {
    const response = await POST(buildRequest({ ...validBody, siret: '123' }))

    expect(response.status).toBe(400)
  })

  it('retourne 400 pour un métier hors enum', async () => {
    const response = await POST(buildRequest({ ...validBody, metier: 'MENUISIER' }))

    expect(response.status).toBe(400)
  })

  it('retourne 400 si des champs requis sont manquants', async () => {
    const { prenom, ...bodyWithoutPrenom } = validBody
    const response = await POST(buildRequest(bodyWithoutPrenom))

    expect(response.status).toBe(400)
  })

  // ─── Création des entités ─────────────────────────────────────────────────────

  it('crée User, BusinessProfile et AISecretaryConfig via une transaction', async () => {
    const txUserCreate = vi.fn().mockResolvedValue(mockCreatedUser)
    prismaMock.$transaction.mockImplementation(async (fn: (tx: any) => any) => {
      return fn({ user: { create: txUserCreate } })
    })

    await POST(buildRequest(validBody))

    // La transaction doit avoir été appelée
    expect(prismaMock.$transaction).toHaveBeenCalledOnce()

    // tx.user.create doit inclure businessProfile + aiSecretaryConfig imbriqués
    expect(txUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'jean.dupont@example.com',
          businessProfile: expect.objectContaining({
            create: expect.objectContaining({
              aiSecretaryConfig: expect.objectContaining({
                create: expect.any(Object),
              }),
            }),
          }),
        }),
      })
    )
  })

  it('le message d\'accueil par défaut contient le nom de l\'entreprise', async () => {
    const txUserCreate = vi.fn().mockResolvedValue(mockCreatedUser)
    prismaMock.$transaction.mockImplementation(async (fn: (tx: any) => any) => {
      return fn({ user: { create: txUserCreate } })
    })

    await POST(buildRequest(validBody))

    const createArgs = txUserCreate.mock.calls[0][0]
    const messageAccueil =
      createArgs.data.businessProfile.create.aiSecretaryConfig.create.messageAccueil

    expect(messageAccueil).toContain('Dupont Serrurerie')
  })

  // ─── Rate limiting ────────────────────────────────────────────────────────────

  it('retourne 429 quand le rate limit est atteint', async () => {
    const { checkRateLimit } = await import('@/lib/rateLimit')
    vi.mocked(checkRateLimit).mockReturnValueOnce({ success: false, remaining: 0 })

    const response = await POST(buildRequest(validBody))
    expect(response.status).toBe(429)
  })
})
