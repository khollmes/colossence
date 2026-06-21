import { vi, beforeEach } from 'vitest'

// Env vars requis avant tout import de module
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_secret'
process.env.STRIPE_PRICE_MENSUEL = 'price_mensuel_test'
process.env.STRIPE_PRICE_ANNUEL = 'price_annuel_test'
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-32chars!!!!'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.EXTERNAL_SERVER_URL = 'http://external.test/webhook'
process.env.EXTERNAL_SERVER_API_KEY = 'test-api-key-12345'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

beforeEach(() => {
  vi.clearAllMocks()
})
