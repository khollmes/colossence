# Colossence

Secrétariat IA pour artisans du dépannage (serruriers, plombiers, électriciens, garagistes, chauffagistes).

## Stack technique

- **Framework** : Next.js 16 (App Router)
- **Base de données** : PostgreSQL + Prisma ORM
- **Paiement** : Stripe (abonnements + frais de mise en ligne)
- **Auth** : NextAuth.js (JWT + Credentials)
- **UI** : Tailwind CSS + Framer Motion
- **Déploiement** : Vercel

---

## Déploiement sur Vercel

### 1. Connecter le repo GitHub

1. Allez sur [vercel.com](https://vercel.com), créez un projet et importez le repo `khollmes/colossence`.
2. Vercel détecte automatiquement Next.js. **Avant de déployer**, configurez la commande de build :
   - Dans **Vercel → Project → Settings → General → Build & Development Settings**
   - **Build Command** : `prisma migrate deploy && next build`
   - Cela exécute les migrations Prisma en production à chaque déploiement.

### 2. Variables d'environnement

Configurez les variables suivantes dans **Vercel → Project → Settings → Environment Variables** :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL de connexion PostgreSQL | `******host:5432/db?sslmode=require` |
| `NEXTAUTH_URL` | URL publique du site | `https://colossence.com` |
| `NEXTAUTH_SECRET` | Secret JWT (générer avec `openssl rand -base64 32`) | `random-secret-string` |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (commence par `sk_`) | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe (commence par `pk_`) | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Secret du webhook Stripe (commence par `whsec_`) | `whsec_...` |
| `STRIPE_PRICE_MENSUEL` | ID du prix mensuel Stripe | `price_...` |
| `STRIPE_PRICE_ANNUEL` | ID du prix annuel Stripe | `price_...` |
| `STRIPE_SETUP_FEE_PRICE` | ID du prix des frais de mise en ligne | `price_...` |
| `EXTERNAL_SERVER_URL` | URL du serveur externe de sync | `https://api.votre-serveur.com/sync` |
| `EXTERNAL_SERVER_API_KEY` | Clé API pour le serveur externe | `votre-cle-api` |
| `EMAIL_SERVER_HOST` | Serveur SMTP | `smtp.resend.com` |
| `EMAIL_SERVER_PORT` | Port SMTP | `587` |
| `EMAIL_SERVER_USER` | Utilisateur SMTP | `resend` |
| `EMAIL_SERVER_PASSWORD` | Mot de passe SMTP / API key | `re_...` |
| `EMAIL_FROM` | Adresse expéditeur | `Colossence <noreply@colossence.com>` |

> ⚠️ **Sécurité** : Toutes ces variables sont exclusivement côté serveur (pas de préfixe `NEXT_PUBLIC_`). Copiez `.env.example` en `.env` pour le développement local.
>
> Pour générer `NEXTAUTH_SECRET` : `openssl rand -base64 32`

### 3. Connecter une base PostgreSQL

Trois options recommandées :

#### Option A : Railway
1. Créez un projet sur [railway.app](https://railway.app)
2. Ajoutez un service PostgreSQL
3. Copiez la `DATABASE_URL` depuis l'onglet "Variables"
4. Collez dans Vercel (ajouter `?sslmode=require` si nécessaire)

#### Option B : Neon
1. Créez un projet sur [neon.tech](https://neon.tech)
2. Copiez la connection string (pooled recommended)
3. Format : `******ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

#### Option C : Render
1. Créez une base PostgreSQL sur [render.com](https://render.com)
2. Copiez l'External Database URL
3. Format : `******host/db?sslmode=require`

Après avoir configuré la base, exécutez les migrations :
```bash
npx prisma migrate deploy
```

### 4. Configurer le webhook Stripe en production

1. Allez dans le [Dashboard Stripe → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Cliquez "Add endpoint"
3. **URL du webhook** : `https://votre-domaine.com/api/webhooks/stripe`
4. **Événements à écouter** :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Une fois créé, copiez le **Signing secret** (`whsec_...`)
6. Ajoutez-le comme variable `STRIPE_WEBHOOK_SECRET` sur Vercel

> 💡 **En développement** : Utilisez `stripe listen --forward-to localhost:3000/api/webhooks/stripe` pour recevoir les webhooks localement.

---

## Développement local

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Remplir les variables dans .env

# Générer le client Prisma
npm run db:generate

# Exécuter les migrations
npm run db:migrate

# Seed de la base (compte admin de test)
npm run db:seed

# Lancer le serveur de dev
npm run dev
```

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run db:generate` | Générer le client Prisma |
| `npm run db:migrate` | Exécuter les migrations (dev) |
| `npm run db:migrate:deploy` | Exécuter les migrations (prod) |
| `npm run db:seed` | Seeder la base avec un admin de test |
| `npm run db:studio` | Interface Prisma Studio |

---

## Sécurité

- Variables sensibles exclusivement côté serveur (jamais préfixées `NEXT_PUBLIC_`)
- Headers HTTP de sécurité : `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `HSTS`, `Permissions-Policy`
- Rate limiting sur `/api/register` et `/api/checkout` (10 requêtes/minute par IP)
  - ⚠️ En serverless (Vercel), chaque instance a sa propre mémoire — la limite s'applique par instance. Pour une protection globale, migrer vers [Upstash Redis](https://github.com/upstash/ratelimit)
- Mots de passe hashés avec bcrypt (12 rounds)
- Sessions JWT signées avec `NEXTAUTH_SECRET`
- Webhook Stripe vérifié par signature cryptographique (`STRIPE_WEBHOOK_SECRET`)
- API externe protégée par clé API

