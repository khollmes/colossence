# Tests E2E — Colossence

Suite de tests end-to-end avec [Playwright](https://playwright.dev/), simulant un utilisateur réel dans le navigateur jusqu'au checkout Stripe en mode test.

## Prérequis

- Node.js 20+
- PostgreSQL (base de données de test)
- Clés Stripe en mode **test** (`sk_test_...`)
- L'application Next.js en cours d'exécution (`npm run dev`)

## Installation

```bash
# 1. Installer les dépendances (déjà fait si `npm install` a été lancé)
npm install

# 2. Installer les navigateurs Playwright
npx playwright install

# ou uniquement Chromium pour aller vite :
npx playwright install chromium
```

## Configuration

Créez un fichier `.env.local` (ou `.env.test`) avec les variables suivantes :

```env
# Base de données (test séparée recommandée)
DATABASE_URL=postgresql://user:password@localhost:5432/colossence_test

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre-secret-32-caracteres-minimum

# Stripe TEST (obligatoire pour les tests checkout)
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX
STRIPE_PRICE_MENSUEL=price_XXXXXXXXXXXX
STRIPE_PRICE_ANNUEL=price_XXXXXXXXXXXX

# Serveur externe (peut être factice en test)
EXTERNAL_SERVER_URL=http://localhost:9999/mock
EXTERNAL_SERVER_API_KEY=test-api-key
```

> ⚠️ **N'utilisez jamais les clés de production (`sk_live_...`) pour les tests.**

## Seeder la base de données de test

Les tests d'authentification utilisent le compte admin créé par le seed :

```bash
npm run db:seed
# Crée : admin@colossence.com / Admin123!
```

## Lancer les tests

```bash
# Tous les tests E2E (headless, tous les navigateurs)
npm run test:e2e

# Mode UI interactif (recommandé pour le développement)
npm run test:e2e:ui

# Mode visible (pour déboguer)
npm run test:e2e:headed

# Navigateur spécifique
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
npx playwright test --project=mobile-pixel5
npx playwright test --project=mobile-iphone13

# Fichier spécifique
npx playwright test e2e/auth.spec.ts

# Un test spécifique
npx playwright test -g "connexion avec bons identifiants"
```

## Structure des tests

```
e2e/
├── helpers/
│   ├── auth.ts         ← Fonctions login/register/logout réutilisables
│   └── test-data.ts    ← Générateurs de données (email unique, cartes Stripe test)
├── landing.spec.ts     ← Page d'accueil, FAQ, footer, mobile
├── register.spec.ts    ← Formulaire d'inscription 3 étapes
├── auth.spec.ts        ← Connexion/déconnexion, protection des routes
├── checkout.spec.ts    ← Parcours Stripe avec carte 4242
├── payment-failed.spec.ts ← Carte refusée 4000 0002
└── dashboard.spec.ts   ← Config secrétariat, profil, navigation
```

## Tests Stripe

Les tests checkout utilisent les [cartes test Stripe](https://stripe.com/docs/testing#cards) :

| Carte | Comportement |
|-------|-------------|
| `4242 4242 4242 4242` | Paiement accepté |
| `4000 0000 0000 0002` | Paiement refusé (carte déclinée) |

Date d'expiration : toute date future (ex: `12/28`), CVC : `123`.

> Les tests Stripe nécessitent une connexion Internet vers `checkout.stripe.com`.
> Si les tests Stripe échouent en CI, vérifiez que `STRIPE_PRICE_MENSUEL` et `STRIPE_PRICE_ANNUEL` existent dans votre Dashboard Stripe test.

## Rapport de couverture

```bash
# Génère un rapport HTML dans playwright-report/
npx playwright show-report
```

## GitHub Actions

Le workflow `.github/workflows/e2e.yml` lance automatiquement les tests E2E sur chaque push/PR vers `main`.

Il faut configurer les **Secrets GitHub** suivants dans Settings > Secrets :
- `NEXTAUTH_SECRET`
- `STRIPE_TEST_SECRET_KEY`
- `STRIPE_TEST_WEBHOOK_SECRET`
- `STRIPE_TEST_PRICE_MENSUEL`
- `STRIPE_TEST_PRICE_ANNUEL`

## Dépannage

**Les tests échouent avec "ERR_CONNECTION_REFUSED"**
→ L'application n'est pas démarrée. Playwright lance `npm run dev` automatiquement. Vérifiez que le port 3000 est libre.

**Les tests de connexion échouent**
→ Vérifiez que la DB est seedée (`npm run db:seed`) et que `NEXTAUTH_SECRET` est défini.

**Les tests Stripe échouent**
→ Vérifiez que `STRIPE_SECRET_KEY` est une clé **test** (`sk_test_...`) et que les price IDs existent dans votre Dashboard Stripe test.

**Tests mobiles — menu burger invisible**
→ Normal en desktop. Les tests mobiles utilisent des viewports Pixel 5 ou iPhone 13.
