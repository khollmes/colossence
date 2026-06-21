import { test, expect } from '@playwright/test'
import { buildRegisterData, uniqueEmail, ADMIN_USER } from './helpers/test-data'

test.describe('Inscription - Formulaire multi-étapes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  // ─── Navigation entre étapes ───────────────────────────────────────────────

  test('affiche l\'étape 1 par défaut', async ({ page }) => {
    await expect(page.getByText('Étape 1 sur 3')).toBeVisible()
    await expect(page.getByText('Informations personnelles')).toBeVisible()
    await expect(page.locator('[data-testid="btn-next"]')).toBeVisible()
    // Pas de bouton Retour à l'étape 1
    await expect(page.locator('[data-testid="btn-back"]')).not.toBeVisible()
  })

  test('passe à l\'étape 2 après avoir cliqué "Suivant"', async ({ page }) => {
    const data = buildRegisterData()

    await page.getByPlaceholder('Jean').fill(data.prenom)
    await page.getByPlaceholder('Dupont').fill(data.nom)
    await page.getByPlaceholder('jean@exemple.fr').fill(data.email)
    await page.getByPlaceholder('06 12 34 56 78').fill(data.telephone)
    await page.getByPlaceholder('••••••••').fill(data.password)
    await page.locator('[data-testid="btn-next"]').click()

    await expect(page.getByText('Étape 2 sur 3')).toBeVisible()
    await expect(page.getByText('Informations entreprise')).toBeVisible()
    await expect(page.locator('[data-testid="btn-back"]')).toBeVisible()
  })

  test('le bouton Retour ramène à l\'étape précédente', async ({ page }) => {
    const data = buildRegisterData()

    // Aller en étape 2
    await page.getByPlaceholder('Jean').fill(data.prenom)
    await page.getByPlaceholder('Dupont').fill(data.nom)
    await page.getByPlaceholder('jean@exemple.fr').fill(data.email)
    await page.getByPlaceholder('06 12 34 56 78').fill(data.telephone)
    await page.getByPlaceholder('••••••••').fill(data.password)
    await page.locator('[data-testid="btn-next"]').click()

    await expect(page.getByText('Étape 2 sur 3')).toBeVisible()

    // Retour à l'étape 1
    await page.locator('[data-testid="btn-back"]').click()
    await expect(page.getByText('Étape 1 sur 3')).toBeVisible()
  })

  // ─── Parcours complet ──────────────────────────────────────────────────────

  test('inscription complète → redirigé vers /login avec message de succès', async ({ page }) => {
    const data = buildRegisterData()

    // Étape 1
    await page.getByPlaceholder('Jean').fill(data.prenom)
    await page.getByPlaceholder('Dupont').fill(data.nom)
    await page.getByPlaceholder('jean@exemple.fr').fill(data.email)
    await page.getByPlaceholder('06 12 34 56 78').fill(data.telephone)
    await page.getByPlaceholder('••••••••').fill(data.password)
    await page.locator('[data-testid="btn-next"]').click()

    // Étape 2
    await page.getByPlaceholder('Dupont Plomberie').fill(data.nomEntreprise)
    await page.getByPlaceholder('12345678901234').fill(data.siret)
    await page.locator('select').selectOption(data.metier)
    await page.locator('[data-testid="btn-next"]').click()

    // Étape 3
    await page.getByPlaceholder('Paris et Île-de-France').fill(data.zoneIntervention)
    await page.getByPlaceholder('Lun-Ven 8h-18h').fill(data.horaires)
    await page.getByPlaceholder(/Déplacement/).fill(data.tarifs)
    await page.getByPlaceholder('06 98 76 54 32').fill(data.telephoneATransferer)
    await page.locator('[data-testid="btn-submit"]').click()

    // Vérifier la redirection et le message de succès
    await page.waitForURL('**/login**', { timeout: 15000 })
    await expect(page.locator('[data-testid="login-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-success"]')).toContainText('succès')
  })

  // ─── Validation des erreurs ────────────────────────────────────────────────

  test('email invalide → affiche une erreur de validation côté API', async ({ page }) => {
    const data = buildRegisterData({ email: 'email-invalide' })

    await page.getByPlaceholder('Jean').fill(data.prenom)
    await page.getByPlaceholder('Dupont').fill(data.nom)
    await page.getByPlaceholder('jean@exemple.fr').fill(data.email)
    await page.getByPlaceholder('06 12 34 56 78').fill(data.telephone)
    await page.getByPlaceholder('••••••••').fill(data.password)
    await page.locator('[data-testid="btn-next"]').click()

    // Passer les étapes 2 et 3 rapidement
    await page.getByPlaceholder('Dupont Plomberie').fill(data.nomEntreprise)
    await page.getByPlaceholder('12345678901234').fill(data.siret)
    await page.locator('select').selectOption(data.metier)
    await page.locator('[data-testid="btn-next"]').click()

    await page.getByPlaceholder('Paris et Île-de-France').fill(data.zoneIntervention)
    await page.getByPlaceholder('Lun-Ven 8h-18h').fill(data.horaires)
    await page.getByPlaceholder(/Déplacement/).fill(data.tarifs)
    await page.getByPlaceholder('06 98 76 54 32').fill(data.telephoneATransferer)
    await page.locator('[data-testid="btn-submit"]').click()

    // L'erreur doit s'afficher (validation Zod côté API)
    await expect(page.locator('[data-testid="register-error"]')).toBeVisible({ timeout: 10000 })
    // On reste sur /register
    await expect(page).not.toHaveURL('/login')
  })

  test('mot de passe trop court → affiche une erreur', async ({ page }) => {
    const data = buildRegisterData({ password: 'court' })

    await page.getByPlaceholder('Jean').fill(data.prenom)
    await page.getByPlaceholder('Dupont').fill(data.nom)
    await page.getByPlaceholder('jean@exemple.fr').fill(data.email)
    await page.getByPlaceholder('06 12 34 56 78').fill(data.telephone)
    await page.getByPlaceholder('••••••••').fill('court')
    await page.locator('[data-testid="btn-next"]').click()

    await page.getByPlaceholder('Dupont Plomberie').fill(data.nomEntreprise)
    await page.getByPlaceholder('12345678901234').fill(data.siret)
    await page.locator('select').selectOption(data.metier)
    await page.locator('[data-testid="btn-next"]').click()

    await page.getByPlaceholder('Paris et Île-de-France').fill(data.zoneIntervention)
    await page.getByPlaceholder('Lun-Ven 8h-18h').fill(data.horaires)
    await page.getByPlaceholder(/Déplacement/).fill(data.tarifs)
    await page.getByPlaceholder('06 98 76 54 32').fill(data.telephoneATransferer)
    await page.locator('[data-testid="btn-submit"]').click()

    await expect(page.locator('[data-testid="register-error"]')).toBeVisible({ timeout: 10000 })
  })

  test('email déjà utilisé → affiche l\'erreur 409', async ({ page }) => {
    // L'admin est créé par le seed — son email est déjà dans la DB
    const data = buildRegisterData({ email: ADMIN_USER.email })

    await page.getByPlaceholder('Jean').fill(data.prenom)
    await page.getByPlaceholder('Dupont').fill(data.nom)
    await page.getByPlaceholder('jean@exemple.fr').fill(ADMIN_USER.email)
    await page.getByPlaceholder('06 12 34 56 78').fill(data.telephone)
    await page.getByPlaceholder('••••••••').fill(data.password)
    await page.locator('[data-testid="btn-next"]').click()

    await page.getByPlaceholder('Dupont Plomberie').fill(data.nomEntreprise)
    await page.getByPlaceholder('12345678901234').fill(data.siret)
    await page.locator('select').selectOption(data.metier)
    await page.locator('[data-testid="btn-next"]').click()

    await page.getByPlaceholder('Paris et Île-de-France').fill(data.zoneIntervention)
    await page.getByPlaceholder('Lun-Ven 8h-18h').fill(data.horaires)
    await page.getByPlaceholder(/Déplacement/).fill(data.tarifs)
    await page.getByPlaceholder('06 98 76 54 32').fill(data.telephoneATransferer)
    await page.locator('[data-testid="btn-submit"]').click()

    await expect(page.locator('[data-testid="register-error"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="register-error"]')).toContainText(/existe déjà/i)
  })

  test('lien "Se connecter" redirige vers /login', async ({ page }) => {
    await page.getByRole('link', { name: 'Se connecter' }).click()
    await expect(page).toHaveURL('/login')
  })
})
