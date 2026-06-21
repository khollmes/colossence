import { vi, describe, it, expect, beforeEach } from 'vitest'

// ─── Mocks hoistés ────────────────────────────────────────────────────────────

const { prismaMock, stripeMock, mockSyncActivated, mockSyncDeactivated } = vi.hoisted(() => ({
  prismaMock: {
    subscription: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    payment: { create: vi.fn() },
    failedPayment: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    businessProfile: { findUnique: vi.fn() },
    aISecretaryConfig: { updateMany: vi.fn() },
    log: { create: vi.fn() },
  },
  stripeMock: {
    webhooks: { constructEvent: vi.fn() },
    subscriptions: { retrieve: vi.fn() },
  },
  mockSyncActivated: vi.fn().mockResolvedValue(true),
  mockSyncDeactivated: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))
vi.mock('@/lib/stripe', () => ({ default: stripeMock }))
vi.mock('@/lib/syncServer', () => ({
  syncSubscriptionActivated: mockSyncActivated,
  syncSubscriptionDeactivated: mockSyncDeactivated,
}))
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  buildPaymentFailedEmail: vi.fn().mockReturnValue({
    to: '',
    subject: 'Échec de paiement',
    html: '<p>Test</p>',
  }),
}))

import { POST } from '@/app/api/webhooks/stripe/route'
import { NextRequest } from 'next/server'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildWebhookRequest(body = 'raw-body', signature = 'valid-sig') {
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': signature,
    },
    body,
  })
}

function mockConstructEvent(eventType: string, dataObject: object) {
  stripeMock.webhooks.constructEvent.mockReturnValue({
    id: `evt_test_${Date.now()}`,
    type: eventType,
    data: { object: dataObject },
  })
}

// ─── Données de test ──────────────────────────────────────────────────────────

const mockStripeSubscription = {
  id: 'sub_test_123',
  status: 'trialing',
  trial_end: Math.floor(Date.now() / 1000) + 30 * 86400,
  current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
}

const mockDbSubscription = {
  id: 'sub-db-123',
  userId: 'user-123',
  stripeSubscriptionId: 'sub_test_123',
  stripeCustomerId: 'cus_test_123',
  status: 'TRIALING',
  plan: 'MENSUEL',
  // Inclus pour handleInvoicePaymentFailed qui fait include: { user: true }
  user: { id: 'user-123', prenom: 'Jean', email: 'jean@example.com' },
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    prismaMock.subscription.create.mockResolvedValue({})
    prismaMock.subscription.update.mockResolvedValue({})
    prismaMock.subscription.findFirst.mockResolvedValue(mockDbSubscription)
    prismaMock.payment.create.mockResolvedValue({})
    prismaMock.failedPayment.findFirst.mockResolvedValue(null)
    prismaMock.failedPayment.create.mockResolvedValue({ id: 'fp-123', relances: 1 })
    prismaMock.failedPayment.update.mockResolvedValue({})
    prismaMock.failedPayment.updateMany.mockResolvedValue({})
    prismaMock.businessProfile.findUnique.mockResolvedValue({ id: 'bp-123', userId: 'user-123' })
    prismaMock.aISecretaryConfig.updateMany.mockResolvedValue({})
    prismaMock.log.create.mockResolvedValue({})
    stripeMock.subscriptions.retrieve.mockResolvedValue(mockStripeSubscription)
  })

  // ─── Sécurité de la signature ─────────────────────────────────────────────────

  it('retourne 400 quand la signature Stripe est invalide', async () => {
    stripeMock.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Signature invalide')
    })

    const response = await POST(buildWebhookRequest('body', 'bad-sig'))

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Signature invalide')
  })

  it('retourne 400 si le header stripe-signature est absent', async () => {
    const req = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: 'raw-body',
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  // ─── checkout.session.completed ───────────────────────────────────────────────

  it('checkout.session.completed → crée l\'abonnement en TRIALING avec setupFeePaid=true', async () => {
    mockConstructEvent('checkout.session.completed', {
      id: 'cs_test_123',
      metadata: { userId: 'user-123', plan: 'MENSUEL' },
      subscription: 'sub_test_123',
      customer: 'cus_test_123',
      payment_intent: 'pi_test_123',
    })

    const response = await POST(buildWebhookRequest())
    expect(response.status).toBe(200)

    // L'abonnement doit être créé avec status TRIALING et setupFeePaid=true
    expect(prismaMock.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-123',
          plan: 'MENSUEL',
          status: 'TRIALING',
          setupFeePaid: true,
        }),
      })
    )
  })

  it('checkout.session.completed → enregistre un Payment de 50€ pour les frais de mise en ligne', async () => {
    mockConstructEvent('checkout.session.completed', {
      id: 'cs_test_123',
      metadata: { userId: 'user-123', plan: 'MENSUEL' },
      subscription: 'sub_test_123',
      customer: 'cus_test_123',
      payment_intent: 'pi_test_123',
    })

    await POST(buildWebhookRequest())

    expect(prismaMock.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-123',
          montant: 50,
          type: 'SETUP_FEE',
          status: 'succeeded',
        }),
      })
    )
  })

  it('checkout.session.completed → crée un Log de l\'événement', async () => {
    mockConstructEvent('checkout.session.completed', {
      id: 'cs_test_123',
      metadata: { userId: 'user-123', plan: 'MENSUEL' },
      subscription: 'sub_test_123',
      customer: 'cus_test_123',
      payment_intent: null,
    })

    await POST(buildWebhookRequest())

    expect(prismaMock.log.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'checkout.session.completed',
          userId: 'user-123',
        }),
      })
    )
  })

  // ─── invoice.payment_failed ───────────────────────────────────────────────────

  it('invoice.payment_failed → crée un FailedPayment et passe l\'abonnement en PAST_DUE', async () => {
    mockConstructEvent('invoice.payment_failed', {
      id: 'in_test_123',
      subscription: 'sub_test_123',
      amount_due: 25000, // 250€ en centimes
      payment_intent: null,
    })

    const response = await POST(buildWebhookRequest())
    expect(response.status).toBe(200)

    expect(prismaMock.failedPayment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-123',
          stripeInvoiceId: 'in_test_123',
          relances: 1,
        }),
      })
    )

    expect(prismaMock.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'PAST_DUE' },
      })
    )
  })

  it('invoice.payment_failed → incrémente les relances si le FailedPayment existe déjà', async () => {
    prismaMock.failedPayment.findFirst.mockResolvedValue({
      id: 'fp-existing',
      relances: 1,
      stripeInvoiceId: 'in_test_123',
    })

    mockConstructEvent('invoice.payment_failed', {
      id: 'in_test_123',
      subscription: 'sub_test_123',
      amount_due: 25000,
      payment_intent: null,
    })

    await POST(buildWebhookRequest())

    expect(prismaMock.failedPayment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { relances: 2 },
      })
    )
  })

  it('invoice.payment_failed → désactive le secrétariat IA après 3 relances', async () => {
    // Simuler 2 relances existantes → la 3e désactive le secrétariat
    prismaMock.failedPayment.findFirst.mockResolvedValue({
      id: 'fp-existing',
      relances: 2,
      stripeInvoiceId: 'in_test_123',
    })

    // subscription.user est inclus dans le findFirst
    prismaMock.subscription.findFirst.mockResolvedValue({
      ...mockDbSubscription,
      user: { id: 'user-123', prenom: 'Jean', email: 'jean@example.com' },
    })

    mockConstructEvent('invoice.payment_failed', {
      id: 'in_test_123',
      subscription: 'sub_test_123',
      amount_due: 25000,
      payment_intent: null,
    })

    await POST(buildWebhookRequest())

    // Le secrétariat doit être désactivé (isActive=false) après 3 relances
    expect(prismaMock.aISecretaryConfig.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isActive: false },
      })
    )
  })

  // ─── customer.subscription.deleted ────────────────────────────────────────────

  it('customer.subscription.deleted → passe en CANCELED et désactive le secrétariat', async () => {
    mockConstructEvent('customer.subscription.deleted', {
      id: 'sub_test_123',
      status: 'canceled',
      current_period_end: Math.floor(Date.now() / 1000),
      trial_end: null,
    })

    const response = await POST(buildWebhookRequest())
    expect(response.status).toBe(200)

    // Statut → CANCELED
    expect(prismaMock.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'CANCELED' },
      })
    )

    // Secrétariat désactivé
    expect(prismaMock.aISecretaryConfig.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isActive: false },
      })
    )
  })

  it('customer.subscription.deleted → log l\'événement', async () => {
    mockConstructEvent('customer.subscription.deleted', {
      id: 'sub_test_123',
      status: 'canceled',
      current_period_end: Math.floor(Date.now() / 1000),
      trial_end: null,
    })

    await POST(buildWebhookRequest())

    expect(prismaMock.log.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'customer.subscription.deleted',
          userId: 'user-123',
        }),
      })
    )
  })

  // ─── customer.subscription.updated ────────────────────────────────────────────

  it('customer.subscription.updated ACTIVE → appelle syncSubscriptionActivated', async () => {
    mockConstructEvent('customer.subscription.updated', {
      id: 'sub_test_123',
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
      trial_end: null,
    })

    await POST(buildWebhookRequest())

    // Sync appelé de manière asynchrone (fire-and-forget), on vérifie via le mock
    await vi.waitFor(() => {
      expect(mockSyncActivated).toHaveBeenCalledWith('user-123')
    })
  })

  // ─── Événement inconnu ────────────────────────────────────────────────────────

  it('retourne 200 pour un événement non géré (pas d\'erreur)', async () => {
    mockConstructEvent('payment_intent.created', { id: 'pi_test' })

    const response = await POST(buildWebhookRequest())
    expect(response.status).toBe(200)
  })
})
