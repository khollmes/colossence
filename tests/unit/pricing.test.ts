import { vi, describe, it, expect, beforeEach } from 'vitest'

// ─── Mocks hoistés ────────────────────────────────────────────────────────────

const { prismaMock, stripeMock, mockGetServerSession } = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn() },
    subscription: { findFirst: vi.fn() },
    log: { create: vi.fn() },
  },
  stripeMock: {
    customers: { create: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
  },
  mockGetServerSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))
vi.mock('@/lib/stripe', () => ({ default: stripeMock }))
vi.mock('next-auth', () => ({ getServerSession: mockGetServerSession, default: vi.fn() }))
vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn(() => ({ success: true, remaining: 9 })),
  rateLimitResponse: vi.fn(),
  getClientIp: vi.fn(() => '127.0.0.1'),
}))

import { POST } from '@/app/api/checkout/route'

// ─── Données de test ──────────────────────────────────────────────────────────

const mockSession = {
  user: { id: 'user-123', email: 'jean@example.com', name: 'Jean Dupont' },
}

const mockUser = {
  id: 'user-123',
  email: 'jean@example.com',
  prenom: 'Jean',
  nom: 'Dupont',
}

const mockCheckoutSession = {
  id: 'cs_test_123',
  url: 'https://checkout.stripe.com/pay/cs_test_123',
}

function buildCheckoutRequest(plan: string) {
  return new Request('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  })
}

describe('Logique de pricing - checkout', () => {
  beforeEach(() => {
    mockGetServerSession.mockResolvedValue(mockSession)
    prismaMock.user.findUnique.mockResolvedValue(mockUser)
    prismaMock.subscription.findFirst.mockResolvedValue(null) // Pas de client Stripe existant
    stripeMock.customers.create.mockResolvedValue({ id: 'cus_test_123' })
    stripeMock.checkout.sessions.create.mockResolvedValue(mockCheckoutSession)
  })

  // ─── Frais de mise en ligne ───────────────────────────────────────────────────

  it('inclut les frais de mise en ligne de 50€ (5000 centimes)', async () => {
    const response = await POST(buildCheckoutRequest('MENSUEL') as any)
    expect(response.status).toBe(200)

    const callArgs = stripeMock.checkout.sessions.create.mock.calls[0][0]
    const setupFeeItem = callArgs.line_items.find((item: any) => item.price_data)

    expect(setupFeeItem).toBeDefined()
    expect(setupFeeItem.price_data.unit_amount).toBe(5000) // 50€ en centimes
    expect(setupFeeItem.price_data.currency).toBe('eur')
  })

  // ─── Période d'essai ─────────────────────────────────────────────────────────

  it('définit une période d\'essai de 30 jours', async () => {
    await POST(buildCheckoutRequest('MENSUEL') as any)

    const callArgs = stripeMock.checkout.sessions.create.mock.calls[0][0]
    expect(callArgs.subscription_data.trial_period_days).toBe(30)
  })

  // ─── Prix par plan ────────────────────────────────────────────────────────────

  it('utilise le price ID MENSUEL pour le plan mensuel', async () => {
    await POST(buildCheckoutRequest('MENSUEL') as any)

    const callArgs = stripeMock.checkout.sessions.create.mock.calls[0][0]
    const subscriptionItem = callArgs.line_items.find((item: any) => item.price)

    expect(subscriptionItem.price).toBe('price_mensuel_test') // env var définie dans setup.ts
  })

  it('utilise le price ID ANNUEL pour le plan annuel', async () => {
    await POST(buildCheckoutRequest('ANNUEL') as any)

    const callArgs = stripeMock.checkout.sessions.create.mock.calls[0][0]
    const subscriptionItem = callArgs.line_items.find((item: any) => item.price)

    expect(subscriptionItem.price).toBe('price_annuel_test') // env var définie dans setup.ts
  })

  // ─── Montant total ────────────────────────────────────────────────────────────

  it('le checkout inclut bien 2 lignes : abonnement + frais de mise en ligne', async () => {
    await POST(buildCheckoutRequest('MENSUEL') as any)

    const callArgs = stripeMock.checkout.sessions.create.mock.calls[0][0]
    expect(callArgs.line_items).toHaveLength(2)
  })

  it('retourne l\'URL de checkout Stripe', async () => {
    const response = await POST(buildCheckoutRequest('MENSUEL') as any)
    const json = await response.json()

    expect(json.url).toBe('https://checkout.stripe.com/pay/cs_test_123')
  })

  // ─── Plan invalide ────────────────────────────────────────────────────────────

  it('retourne 400 pour un plan inconnu', async () => {
    const response = await POST(buildCheckoutRequest('TRIMESTRIEL') as any)
    expect(response.status).toBe(400)
  })

  // ─── Métadonnées ─────────────────────────────────────────────────────────────

  it('transmet userId et plan dans les métadonnées de la session', async () => {
    await POST(buildCheckoutRequest('ANNUEL') as any)

    const callArgs = stripeMock.checkout.sessions.create.mock.calls[0][0]
    expect(callArgs.metadata).toMatchObject({ userId: 'user-123', plan: 'ANNUEL' })
    expect(callArgs.subscription_data.metadata).toMatchObject({ userId: 'user-123', plan: 'ANNUEL' })
  })
})
