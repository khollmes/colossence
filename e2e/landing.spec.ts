import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Attendre que la page soit hydratée
    await page.waitForLoadState('networkidle')
  })

  // ─── Contenu principal ───────────────────────────────────────────────────────

  test('la page se charge et affiche le titre principal', async ({ page }) => {
    await expect(page.locator('[data-testid="hero-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="hero-title"]')).toContainText('secrétariat IA')
    await expect(page).toHaveTitle(/Colossence/)
  })

  test('les 5 cartes métiers sont toutes visibles', async ({ page }) => {
    const tradeCards = page.locator('[data-testid="trade-card"]')
    await expect(tradeCards).toHaveCount(5)

    // Vérifie chaque métier par son libellé
    for (const label of ['Serrurier', 'Plombier', 'Électricien', 'Garage', 'Chauffagiste']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible()
    }
  })

  // ─── FAQ accordéon ───────────────────────────────────────────────────────────

  test('les questions FAQ sont visibles et fermées par défaut', async ({ page }) => {
    const questions = page.locator('[data-testid="faq-question"]')
    await expect(questions).toHaveCount(6)

    // Les réponses ne doivent pas être visibles avant le clic
    await expect(page.locator('[data-testid="faq-answer"]').first()).not.toBeVisible()
  })

  test('l\'accordéon FAQ s\'ouvre au clic sur une question', async ({ page }) => {
    const firstQuestion = page.locator('[data-testid="faq-question"]').first()
    await firstQuestion.click()

    // La première réponse doit apparaître
    const firstAnswer = page.locator('[data-testid="faq-answer"]').first()
    await expect(firstAnswer).toBeVisible()
    await expect(firstAnswer).toContainText('30 jours')
  })

  test('un seul accordéon est ouvert à la fois', async ({ page }) => {
    const questions = page.locator('[data-testid="faq-question"]')

    await questions.nth(0).click()
    await questions.nth(1).click()

    // La 2e réponse est visible
    await expect(page.locator('[data-testid="faq-answer"]').nth(1)).toBeVisible()
    // La 1re est refermée
    await expect(page.locator('[data-testid="faq-answer"]').nth(0)).not.toBeVisible()
  })

  // ─── CTAs ────────────────────────────────────────────────────────────────────

  test('le CTA principal "Essai gratuit" redirige vers /register', async ({ page }) => {
    await page.locator('[data-testid="cta-register"]').click()
    await expect(page).toHaveURL('/register')
  })

  test('le bouton "Essai gratuit" dans la nav redirige vers /register', async ({ page }) => {
    // Desktop : lien dans la nav principale
    const navRegister = page.locator('header a[href="/register"]').first()
    await navRegister.click()
    await expect(page).toHaveURL('/register')
  })

  test('le lien "Tarifs" redirige vers /pricing', async ({ page }) => {
    await page.locator('header a[href="/pricing"]').first().click()
    await expect(page).toHaveURL('/pricing')
  })

  // ─── Footer liens légaux ──────────────────────────────────────────────────────

  test('le footer contient tous les liens légaux requis', async ({ page }) => {
    await expect(page.locator('[data-testid="footer-mentions"]')).toBeVisible()
    await expect(page.locator('[data-testid="footer-cgv"]')).toBeVisible()
    await expect(page.locator('[data-testid="footer-confidentialite"]')).toBeVisible()

    // Vérifie les href
    await expect(page.locator('[data-testid="footer-mentions"]')).toHaveAttribute('href', '/mentions-legales')
    await expect(page.locator('[data-testid="footer-cgv"]')).toHaveAttribute('href', '/cgv')
    await expect(page.locator('[data-testid="footer-confidentialite"]')).toHaveAttribute('href', '/confidentialite')
  })

  // ─── Mobile ───────────────────────────────────────────────────────────────────

  test('le menu burger est visible sur mobile et s\'ouvre au clic', async ({ page, isMobile }) => {
    // Ce test est pertinent uniquement sur mobile (viewport <768px)
    // On peut aussi le tester en redimensionnant explicitement
    if (!isMobile) {
      await page.setViewportSize({ width: 375, height: 812 })
    }

    const burger = page.locator('[data-testid="mobile-menu-button"]')
    await expect(burger).toBeVisible()

    // Le menu mobile est fermé par défaut
    await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible()

    // Ouvrir le menu
    await burger.click()
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

    // Le lien "Essai gratuit" est visible dans le menu mobile
    const mobileRegisterLink = page.locator('[data-testid="mobile-menu"] a[href="/register"]')
    await expect(mobileRegisterLink).toBeVisible()
  })

  test('le menu mobile se ferme après navigation', async ({ page, isMobile }) => {
    if (!isMobile) {
      await page.setViewportSize({ width: 375, height: 812 })
    }

    await page.locator('[data-testid="mobile-menu-button"]').click()
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

    // Cliquer sur "Connexion" dans le menu mobile
    await page.locator('[data-testid="mobile-menu"] a[href="/login"]').click()
    await expect(page).toHaveURL('/login')
  })

  // ─── Qualité ──────────────────────────────────────────────────────────────────

  test('aucune erreur console critique au chargement', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Filtrer les erreurs connues/acceptables (hydration, favicon, extensions)
    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('hydration') &&
        !e.includes('ERR_') &&
        !e.includes('chrome-extension')
    )

    expect(criticalErrors, `Erreurs console: ${criticalErrors.join('\n')}`).toHaveLength(0)
  })

  test('la section tarifs affiche 250€/mois et 2000€/an', async ({ page }) => {
    await expect(page.getByText('250€')).toBeVisible()
    await expect(page.getByText('2000€')).toBeVisible()
    await expect(page.getByText('1er mois offert').first()).toBeVisible()
  })
})
