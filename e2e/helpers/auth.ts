import { Page, expect } from '@playwright/test'
import { buildRegisterData, RegisterData } from './test-data'

// ─── Connexion ────────────────────────────────────────────────────────────────

export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.locator('[data-testid="input-email"]').fill(email)
  await page.locator('[data-testid="input-password"]').fill(password)
  await page.locator('[data-testid="btn-login"]').click()
  await page.waitForURL('**/dashboard**', { timeout: 15000 })
}

// ─── Inscription complète (formulaire 3 étapes) ───────────────────────────────

export async function register(
  page: Page,
  data: RegisterData = buildRegisterData()
): Promise<RegisterData> {
  await page.goto('/register')

  // Étape 1 : Informations personnelles
  await page.getByPlaceholder('Jean').fill(data.prenom)
  await page.getByPlaceholder('Dupont').fill(data.nom)
  await page.getByPlaceholder('jean@exemple.fr').fill(data.email)
  await page.getByPlaceholder('06 12 34 56 78').fill(data.telephone)
  await page.getByPlaceholder('••••••••').fill(data.password)
  await page.locator('[data-testid="btn-next"]').click()

  // Étape 2 : Informations entreprise
  await expect(page.locator('[data-testid="btn-back"]')).toBeVisible()
  await page.getByPlaceholder('Dupont Plomberie').fill(data.nomEntreprise)
  await page.getByPlaceholder('12345678901234').fill(data.siret)
  await page.locator('select').selectOption(data.metier)
  await page.locator('[data-testid="btn-next"]').click()

  // Étape 3 : Configuration du secrétariat
  await expect(page.locator('[data-testid="btn-submit"]')).toBeVisible()
  await page.getByPlaceholder('Paris et Île-de-France').fill(data.zoneIntervention)
  await page.getByPlaceholder('Lun-Ven 8h-18h').fill(data.horaires)
  await page.getByPlaceholder(/Déplacement/).fill(data.tarifs)
  await page.getByPlaceholder('06 98 76 54 32').fill(data.telephoneATransferer)
  await page.locator('[data-testid="btn-submit"]').click()

  return data
}

// ─── Inscription puis connexion directe ───────────────────────────────────────

export async function registerAndLogin(
  page: Page,
  overrides?: Partial<RegisterData>
): Promise<RegisterData> {
  const data = buildRegisterData(overrides)
  await register(page, data)

  // Après inscription réussie → redirigé vers /login?registered=true
  await page.waitForURL('**/login**', { timeout: 15000 })
  await expect(page.locator('[data-testid="login-success"]')).toBeVisible()

  await login(page, data.email, data.password)
  return data
}

// ─── Déconnexion ──────────────────────────────────────────────────────────────

export async function logout(page: Page): Promise<void> {
  await page.locator('[data-testid="btn-logout"]').click()
  await page.waitForURL('**/login**', { timeout: 10000 })
}
