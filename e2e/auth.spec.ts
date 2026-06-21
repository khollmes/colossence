import { test, expect } from '@playwright/test'
import { login, registerAndLogin, logout } from './helpers/auth'
import { ADMIN_USER, buildRegisterData } from './helpers/test-data'

test.describe('Authentification', () => {
  // ─── Connexion réussie ────────────────────────────────────────────────────────

  test('connexion avec bons identifiants → accès au dashboard', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password)

    // L'URL doit contenir /dashboard
    await expect(page).toHaveURL(/\/dashboard/)
    // Le sidebar doit être visible
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
  })

  test('le dashboard affiche le nom de la section active', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password)
    await expect(page.locator('[data-testid="nav-overview"]')).toBeVisible()
  })

  // ─── Mauvais identifiants ──────────────────────────────────────────────────────

  test('mauvais mot de passe → message d\'erreur sur /login', async ({ page }) => {
    await page.goto('/login')
    await page.locator('[data-testid="input-email"]').fill(ADMIN_USER.email)
    await page.locator('[data-testid="input-password"]').fill('mauvais-mot-de-passe')
    await page.locator('[data-testid="btn-login"]').click()

    // Le message d'erreur doit apparaître
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="login-error"]')).toContainText(/incorrect/i)

    // On reste sur /login
    await expect(page).toHaveURL(/\/login/)
  })

  test('email inconnu → message d\'erreur', async ({ page }) => {
    await page.goto('/login')
    await page.locator('[data-testid="input-email"]').fill('email-inexistant@test.com')
    await page.locator('[data-testid="input-password"]').fill('n\'importe-quoi')
    await page.locator('[data-testid="btn-login"]').click()

    await expect(page.locator('[data-testid="login-error"]')).toBeVisible({ timeout: 10000 })
    await expect(page).toHaveURL(/\/login/)
  })

  // ─── Protection des routes ────────────────────────────────────────────────────

  test('accès direct à /dashboard sans session → redirigé vers /login', async ({ page }) => {
    // Navigation directe sans être connecté
    await page.goto('/dashboard')

    // Next.js middleware redirige vers /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('accès à /dashboard/profile sans session → redirigé vers /login', async ({ page }) => {
    await page.goto('/dashboard/profile')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('accès à /dashboard/secretary sans session → redirigé vers /login', async ({ page }) => {
    await page.goto('/dashboard/secretary')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  // ─── Déconnexion ─────────────────────────────────────────────────────────────

  test('déconnexion → retour sur /login', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password)
    await expect(page).toHaveURL(/\/dashboard/)

    await logout(page)
    await expect(page).toHaveURL(/\/login/)
  })

  test('après déconnexion, le dashboard est inaccessible', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password)
    await logout(page)

    // Tenter de revenir sur le dashboard
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  // ─── Inscription + Connexion ───────────────────────────────────────────────────

  test('inscription puis connexion → accès au dashboard', async ({ page }) => {
    const data = await registerAndLogin(page)

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
  })

  // ─── Persistance de session ───────────────────────────────────────────────────

  test('la session persiste après rechargement de page', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password)
    await expect(page).toHaveURL(/\/dashboard/)

    // Recharger la page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Toujours connecté
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
  })
})
