import { vi, describe, it, expect, beforeEach } from 'vitest'

// ─── Mocks hoistés ────────────────────────────────────────────────────────────

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    businessProfile: { findUnique: vi.fn() },
    log: { create: vi.fn() },
  },
}))

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))

// Mock global fetch — aucun appel réseau réel
const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

import {
  syncToExternalServer,
  syncSecretaryConfig,
  syncSubscriptionActivated,
  syncSubscriptionDeactivated,
} from '@/lib/syncServer'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockFetchSuccess() {
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
  } as Response)
}

function mockFetchFailure(status = 500) {
  fetchMock.mockResolvedValue({
    ok: false,
    status,
    statusText: 'Internal Server Error',
  } as Response)
}

const mockBusinessProfile = {
  id: 'bp-123',
  userId: 'user-123',
  metier: 'SERRURIER',
  horaires: 'Lun-Ven 8h-18h',
  tarifs: 'Dès 60€',
  telephoneATransferer: '0612345678',
  aiSecretaryConfig: {
    consignes: 'Ne pas transférer les appels le dimanche',
    messageAccueil: 'Bonjour, Dupont Serrurerie, comment puis-je vous aider ?',
    isActive: true,
  },
}

describe('syncToExternalServer', () => {
  beforeEach(() => {
    prismaMock.log.create.mockResolvedValue({})
  })

  // ─── Header Authorization ─────────────────────────────────────────────────

  it('envoie le header Authorization avec Bearer token', async () => {
    mockFetchSuccess()

    await syncToExternalServer({
      action: 'subscription_activated',
      userId: 'user-123',
      data: { activatedAt: '2024-01-01T00:00:00.000Z' },
    })

    const [, options] = fetchMock.mock.calls[0]
    expect(options.headers['Authorization']).toBe(
      `Bearer ${process.env.EXTERNAL_SERVER_API_KEY}`
    )
  })

  it('envoie les données en JSON avec Content-Type application/json', async () => {
    mockFetchSuccess()

    await syncToExternalServer({
      action: 'secretary_config_updated',
      userId: 'user-123',
      data: { metier: 'SERRURIER' },
    })

    const [, options] = fetchMock.mock.calls[0]
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(options.method).toBe('POST')
  })

  it('cible l\'URL du serveur externe configurée dans EXTERNAL_SERVER_URL', async () => {
    mockFetchSuccess()

    await syncToExternalServer({
      action: 'subscription_deactivated',
      userId: 'user-123',
      data: { reason: 'canceled' },
    })

    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe(process.env.EXTERNAL_SERVER_URL)
  })

  it('retourne true en cas de succès et false en cas d\'échec', async () => {
    mockFetchSuccess()
    const ok = await syncToExternalServer({
      action: 'subscription_activated',
      userId: 'user-123',
      data: {},
    })
    expect(ok).toBe(true)

    vi.clearAllMocks()
    prismaMock.log.create.mockResolvedValue({})
    mockFetchFailure()
    const fail = await syncToExternalServer({
      action: 'subscription_activated',
      userId: 'user-123',
      data: {},
    })
    expect(fail).toBe(false)
  })

  it('log chaque tentative de sync dans la base', async () => {
    mockFetchSuccess()

    await syncToExternalServer({
      action: 'subscription_activated',
      userId: 'user-123',
      data: {},
    })

    expect(prismaMock.log.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-123',
          action: 'sync.subscription_activated',
        }),
      })
    )
  })
})

describe('syncSecretaryConfig', () => {
  beforeEach(() => {
    prismaMock.log.create.mockResolvedValue({})
    prismaMock.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile)
  })

  it('le payload contient métier, horaires, tarifs et téléphone', async () => {
    mockFetchSuccess()

    await syncSecretaryConfig('user-123')

    const [, options] = fetchMock.mock.calls[0]
    const payload = JSON.parse(options.body)

    expect(payload.data).toMatchObject({
      metier: 'SERRURIER',
      horaires: 'Lun-Ven 8h-18h',
      tarifs: 'Dès 60€',
      telephoneATransferer: '0612345678',
    })
  })

  it('utilise l\'action secretary_config_updated', async () => {
    mockFetchSuccess()

    await syncSecretaryConfig('user-123')

    const [, options] = fetchMock.mock.calls[0]
    const payload = JSON.parse(options.body)
    expect(payload.action).toBe('secretary_config_updated')
  })

  it('retourne false si le businessProfile n\'existe pas', async () => {
    prismaMock.businessProfile.findUnique.mockResolvedValue(null)

    const result = await syncSecretaryConfig('user-inexistant')
    expect(result).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('syncSubscriptionActivated', () => {
  beforeEach(() => {
    prismaMock.log.create.mockResolvedValue({})
  })

  it('envoie l\'action subscription_activated avec le userId', async () => {
    mockFetchSuccess()

    await syncSubscriptionActivated('user-123')

    const [, options] = fetchMock.mock.calls[0]
    const payload = JSON.parse(options.body)

    expect(payload.action).toBe('subscription_activated')
    expect(payload.userId).toBe('user-123')
    expect(payload.data).toHaveProperty('activatedAt')
  })
})

describe('syncSubscriptionDeactivated', () => {
  beforeEach(() => {
    prismaMock.log.create.mockResolvedValue({})
  })

  it('envoie l\'action subscription_deactivated avec la raison', async () => {
    mockFetchSuccess()

    await syncSubscriptionDeactivated('user-123', 'canceled')

    const [, options] = fetchMock.mock.calls[0]
    const payload = JSON.parse(options.body)

    expect(payload.action).toBe('subscription_deactivated')
    expect(payload.userId).toBe('user-123')
    expect(payload.data.reason).toBe('canceled')
  })

  it('fonctionne avec la raison past_due', async () => {
    mockFetchSuccess()

    await syncSubscriptionDeactivated('user-456', 'past_due')

    const [, options] = fetchMock.mock.calls[0]
    const payload = JSON.parse(options.body)
    expect(payload.data.reason).toBe('past_due')
  })
})
