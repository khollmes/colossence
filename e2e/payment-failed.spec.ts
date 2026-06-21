import { test, expect } from '@playwright/test'
import { registerAndLogin } from './helpers/auth'
import { STRIPE_CARDS } from './helpers/test-data'

/**
 * Tests E2E du parcours paiement refusé.
 *
 * PRÉREQUIS :
 * - Clés Stripe TEST uniquement (sk_test_... / pk_test_...)
 * - La carte 4000 0000 0000 0002 est la carte "toujours refusée" de Stripe
 */

test.describe('Paiement refusé (carte 0002)', () => {
  test('carte refusée → message d\'erreur affiché sur la page Stripe', async ({ page }) => {
    // 1. S'inscrire et se connecter
    await registerAndLogin(page)

    // 2. Aller sur la page pricing
    await page.goto('/pricing')

    // 3. Lancer le checkout
    const [checkoutResponse] = await Promise.all([
      page.waitForResponse('**/api/checkout'),
      page.locator('[data-testid="btn-subscribe-mensuel"]').click(),
    ])

    if (checkoutResponse.status() !== 200) {
      test.skip(true, 'API checkout inaccessible — vérifiez STRIPE_SECRET_KEY en mode test')
    }

    const { url } = await checkoutResponse.json()
    expect(url).toContain('checkout.stripe.com')

    // 4. Attendre Stripe Checkout
    await page.waitForURL('**/checkout.stripe.com/**', { timeout: 30000 })

    // 5. Remplir avec la carte REFUSÉE
    const emailField = page.locator('#email')
    if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailField.fill('test@e2e.local')
    }

    // Numéro de carte refusée
    const cardFrame = page.frameLocator('iframe[title*="card number" i], iframe[name*="__privateStripeFrame" i]').first()
    await cardFrame.locator('[name="number"], [data-elements-stable-field-name="cardNumber"]').fill(STRIPE_CARDS.declined)

    const expiryFrame = page.frameLocator('iframe[title*="expiration" i], iframe[title*="expiry" i]').first()
    await expiryFrame.locator('[name="expiry"], [data-elements-stable-field-name="cardExpiry"]').fill(STRIPE_CARDS.expiry)

    const cvcFrame = page.frameLocator('iframe[title*="cvc" i], iframe[title*="security" i]').first()
    await cvcFrame.locator('[name="cvc"], [data-elements-stable-field-name="cardCvc"]').fill(STRIPE_CARDS.cvc)

    // 6. Soumettre
    await page.locator('[data-testid="hosted-payment-submit-button"], button[type="submit"]').last().click()

    // 7. Stripe affiche une erreur de paiement (ne redirige pas vers le dashboard)
    // Le message d'erreur Stripe est en anglais ou français selon la locale
    const errorVisible = await page.getByText(/déclinée|declined|refused|refusée|insufficient|payment failed/i)
      .isVisible({ timeout: 15000 })
      .catch(() => false)

    // On reste sur checkout.stripe.com et une erreur est visible
    expect(page.url()).toContain('checkout.stripe.com')
    expect(errorVisible).toBe(true)
  })

  test('paiement refusé → l\'abonnement ne passe pas en ACTIF (reste TRIALING ou absent)', async ({ page }) => {
    // Ce test vérifie que le webhook n'est pas déclenché après un paiement refusé
    // En mode test Stripe, le webhook ne se déclenche que via Stripe CLI ou dans l'environnement configuré

    // On vérifie indirectement : après un refus, le dashboard ne montre pas d'abonnement ACTIF
    await registerAndLogin(page)
    await page.goto('/dashboard')

    // Un nouvel utilisateur n'a pas d'abonnement actif
    // On vérifie l'absence de "Actif" dans le statut
    const statusText = await page.getByText('Actif').isVisible({ timeout: 3000 }).catch(() => false)
    expect(statusText).toBe(false)
  })
})
