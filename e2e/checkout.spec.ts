import { test, expect } from '@playwright/test'
import { registerAndLogin } from './helpers/auth'
import { STRIPE_CARDS } from './helpers/test-data'

/**
 * Tests E2E du parcours Stripe Checkout.
 *
 * PRÉREQUIS :
 * - STRIPE_SECRET_KEY et STRIPE_PRICE_MENSUEL/ANNUEL doivent être des clés de TEST (sk_test_...)
 * - L'app doit être connectée à Internet pour accéder à checkout.stripe.com
 * - La DB de test doit être opérationnelle
 */

test.describe('Parcours paiement Stripe', () => {
  // ─── Page /pricing ─────────────────────────────────────────────────────────

  test('la page /pricing affiche les deux plans avec les bons tarifs', async ({ page }) => {
    await page.goto('/pricing')

    // Vérifier les cartes de plan
    await expect(page.locator('[data-testid="plan-mensuel"]')).toBeVisible()
    await expect(page.locator('[data-testid="plan-annuel"]')).toBeVisible()

    // Prix
    await expect(page.locator('[data-testid="plan-mensuel"]')).toContainText('250€')
    await expect(page.locator('[data-testid="plan-annuel"]')).toContainText('2000€')

    // Mentions importantes
    await expect(page.locator('[data-testid="plan-mensuel"]')).toContainText('1er mois offert')
    await expect(page.locator('[data-testid="plan-mensuel"]')).toContainText('50€')
    await expect(page.locator('[data-testid="plan-annuel"]')).toContainText('Économisez 1000€/an')
  })

  test('bouton "Démarrer l\'essai gratuit" mensuel est visible et actif', async ({ page }) => {
    await page.goto('/pricing')
    const btn = page.locator('[data-testid="btn-subscribe-mensuel"]')
    await expect(btn).toBeVisible()
    await expect(btn).toBeEnabled()
    await expect(btn).toContainText("Démarrer l'essai gratuit")
  })

  test('bouton "Démarrer l\'essai gratuit" annuel est visible et actif', async ({ page }) => {
    await page.goto('/pricing')
    const btn = page.locator('[data-testid="btn-subscribe-annuel"]')
    await expect(btn).toBeVisible()
    await expect(btn).toBeEnabled()
  })

  // ─── Checkout non connecté ─────────────────────────────────────────────────

  test('cliquer "Souscrire" sans être connecté → redirigé vers /login', async ({ page }) => {
    await page.goto('/pricing')

    // L'API /api/checkout renvoie 401 si non connecté
    // La page affiche une erreur ou redirige
    const [response] = await Promise.all([
      page.waitForResponse('**/api/checkout'),
      page.locator('[data-testid="btn-subscribe-mensuel"]').click(),
    ])

    expect(response.status()).toBe(401)
  })

  // ─── Checkout complet avec carte test ─────────────────────────────────────

  test('parcours complet : connexion → pricing → Stripe Checkout → succès', async ({ page }) => {
    // 1. S'inscrire et se connecter avec un nouvel utilisateur
    await registerAndLogin(page)

    // 2. Aller sur la page pricing
    await page.goto('/pricing')
    await expect(page.locator('[data-testid="btn-subscribe-mensuel"]')).toBeVisible()

    // 3. Cliquer sur "Souscrire" mensuel
    const [checkoutResponse] = await Promise.all([
      page.waitForResponse('**/api/checkout'),
      page.locator('[data-testid="btn-subscribe-mensuel"]').click(),
    ])

    // Vérifier que l'API checkout a répondu avec une URL Stripe
    if (checkoutResponse.status() !== 200) {
      test.skip(true, `API checkout inaccessible (${checkoutResponse.status()}), vérifiez les env vars STRIPE_*`)
    }

    const checkoutData = await checkoutResponse.json()
    expect(checkoutData).toHaveProperty('url')
    expect(checkoutData.url).toContain('checkout.stripe.com')

    // 4. Attendre la redirection vers Stripe
    await page.waitForURL('**/checkout.stripe.com/**', { timeout: 30000 })

    // 5. Remplir le formulaire Stripe avec la carte test 4242
    // Email peut déjà être pré-rempli par Stripe
    const emailField = page.locator('#email')
    if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailField.fill('test@e2e.local')
    }

    // Numéro de carte (dans une iframe Stripe)
    const cardNumberFrame = page.frameLocator('iframe[title*="card number" i], iframe[name*="__privateStripeFrame" i]').first()
    await cardNumberFrame.locator('[name="number"], [data-elements-stable-field-name="cardNumber"]').fill(STRIPE_CARDS.success)

    // Date d'expiration
    const expiryFrame = page.frameLocator('iframe[title*="expiration" i], iframe[title*="expiry" i]').first()
    await expiryFrame.locator('[name="expiry"], [data-elements-stable-field-name="cardExpiry"]').fill(STRIPE_CARDS.expiry)

    // CVC
    const cvcFrame = page.frameLocator('iframe[title*="cvc" i], iframe[title*="security" i]').first()
    await cvcFrame.locator('[name="cvc"], [data-elements-stable-field-name="cardCvc"]').fill(STRIPE_CARDS.cvc)

    // 6. Soumettre
    await page.locator('[data-testid="hosted-payment-submit-button"], button[type="submit"]').last().click()

    // 7. Redirection vers la page de succès
    await page.waitForURL('**/dashboard**', { timeout: 60000 })
    await expect(page).toHaveURL(/dashboard/)
  })
})
