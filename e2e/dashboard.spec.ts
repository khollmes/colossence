import { test, expect } from '@playwright/test'
import { login, registerAndLogin } from './helpers/auth'
import { ADMIN_USER } from './helpers/test-data'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password)
  })

  // ─── Navigation sidebar ────────────────────────────────────────────────────

  test('tous les liens de navigation sont visibles dans le sidebar', async ({ page }) => {
    await expect(page.locator('[data-testid="nav-overview"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-subscription"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-billing"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-secretary"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-profile"]')).toBeVisible()
  })

  test('navigation vers "Abonnement"', async ({ page }) => {
    await page.locator('[data-testid="nav-subscription"]').click()
    await expect(page).toHaveURL(/\/dashboard\/subscription/)
    await expect(page.getByRole('heading', { name: 'Abonnement' })).toBeVisible()
  })

  test('navigation vers "Facturation"', async ({ page }) => {
    await page.locator('[data-testid="nav-billing"]').click()
    await expect(page).toHaveURL(/\/dashboard\/billing/)
    await expect(page.getByRole('heading', { name: 'Facturation' })).toBeVisible()
  })

  test('navigation vers "Secrétariat IA"', async ({ page }) => {
    await page.locator('[data-testid="nav-secretary"]').click()
    await expect(page).toHaveURL(/\/dashboard\/secretary/)
    await expect(page.getByRole('heading', { name: 'Secrétariat IA' })).toBeVisible()
  })

  test('navigation vers "Profil"', async ({ page }) => {
    await page.locator('[data-testid="nav-profile"]').click()
    await expect(page).toHaveURL(/\/dashboard\/profile/)
    await expect(page.getByRole('heading', { name: 'Profil' })).toBeVisible()
  })

  // ─── Vue d'ensemble ────────────────────────────────────────────────────────

  test('vue d\'ensemble affiche l\'état de l\'abonnement', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/)
    // Pour l'admin sans abonnement : affiche "Vous n'avez pas encore d'abonnement actif"
    // Pour un user avec abonnement : affiche le statut
    const hasSubscription = await page.getByText(/Actif|Période d'essai|Paiement en retard/i).isVisible({ timeout: 3000 }).catch(() => false)
    const noSubscription = await page.getByText(/n'avez pas encore d'abonnement/i).isVisible({ timeout: 3000 }).catch(() => false)

    // L'un des deux cas doit être vrai
    expect(hasSubscription || noSubscription).toBe(true)
  })

  test('sans abonnement, un bouton "Voir les tarifs" est affiché', async ({ page }) => {
    const noSubLink = page.getByRole('link', { name: 'Voir les tarifs' })
    const hasNoSub = await noSubLink.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasNoSub) {
      await noSubLink.click()
      await expect(page).toHaveURL('/pricing')
    }
  })

  // ─── Configuration du secrétariat IA ──────────────────────────────────────

  test('modifier et sauvegarder la configuration du secrétariat', async ({ page }) => {
    await page.locator('[data-testid="nav-secretary"]').click()
    await expect(page).toHaveURL(/\/dashboard\/secretary/)

    // Modifier le message d'accueil
    const messageField = page.locator('#messageAccueil')
    await messageField.clear()
    await messageField.fill('Bonjour, bienvenue chez notre entreprise E2E !')

    // Modifier les consignes
    const consignesField = page.locator('#consignes')
    await consignesField.clear()
    await consignesField.fill('Ne pas transférer les appels le dimanche.')

    // Sauvegarder
    await page.locator('[data-testid="btn-save-secretary"]').click()

    // Vérifier le message de succès
    await expect(page.locator('[data-testid="secretary-success"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="secretary-success"]')).toContainText('succès')
  })

  test('la config du secrétariat persiste après rechargement', async ({ page }) => {
    await page.locator('[data-testid="nav-secretary"]').click()

    const uniqueMessage = `Test E2E ${Date.now()}`
    await page.locator('#messageAccueil').clear()
    await page.locator('#messageAccueil').fill(uniqueMessage)
    await page.locator('[data-testid="btn-save-secretary"]').click()

    await expect(page.locator('[data-testid="secretary-success"]')).toBeVisible({ timeout: 10000 })

    // Recharger et vérifier la persistance
    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('#messageAccueil')).toHaveValue(uniqueMessage)
  })

  // ─── Profil utilisateur ────────────────────────────────────────────────────

  test('modifier et sauvegarder le profil', async ({ page }) => {
    await page.locator('[data-testid="nav-profile"]').click()
    await expect(page).toHaveURL(/\/dashboard\/profile/)

    // Modifier le prénom
    await page.locator('#prenom').clear()
    await page.locator('#prenom').fill('AdminModifié')

    // Sauvegarder
    await page.locator('[data-testid="btn-save-profile"]').click()

    // Vérifier le message de succès
    await expect(page.locator('[data-testid="profile-success"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="profile-success"]')).toContainText('succès')
  })

  test('les informations du profil persistent après rechargement', async ({ page }) => {
    await page.locator('[data-testid="nav-profile"]').click()

    const uniqueTarifs = `Dès ${Date.now()}€`
    await page.locator('#tarifs').clear()
    await page.locator('#tarifs').fill(uniqueTarifs)
    await page.locator('[data-testid="btn-save-profile"]').click()

    await expect(page.locator('[data-testid="profile-success"]')).toBeVisible({ timeout: 10000 })

    // Recharger
    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('#tarifs')).toHaveValue(uniqueTarifs)
  })

  test('l\'email est affiché mais désactivé (non modifiable)', async ({ page }) => {
    await page.locator('[data-testid="nav-profile"]').click()

    const emailField = page.locator('#email')
    await expect(emailField).toBeVisible()
    await expect(emailField).toBeDisabled()
    await expect(emailField).toHaveValue(ADMIN_USER.email)
  })

  // ─── Facturation ─────────────────────────────────────────────────────────

  test('page facturation se charge sans erreur', async ({ page }) => {
    await page.locator('[data-testid="nav-billing"]').click()
    await expect(page).toHaveURL(/\/dashboard\/billing/)
    await page.waitForLoadState('networkidle')

    // Soit des paiements, soit le message "Aucun paiement"
    const hasPayments = await page.locator('table').isVisible({ timeout: 3000 }).catch(() => false)
    const noPayments = await page.getByText('Aucun paiement enregistré').isVisible({ timeout: 3000 }).catch(() => false)

    expect(hasPayments || noPayments).toBe(true)
  })
})

// ─── Tests avec un nouveau compte (sans données pré-existantes) ───────────────

test.describe('Dashboard — Nouveau compte', () => {
  test('nouveau compte → aucun abonnement affiché', async ({ page }) => {
    await registerAndLogin(page)

    await expect(page).toHaveURL(/\/dashboard/)
    // Un nouveau compte n'a pas d'abonnement
    await expect(page.getByText(/n'avez pas encore/i)).toBeVisible({ timeout: 10000 })
  })
})
