# TCG Stringing — Guide de déploiement complet

De zéro à production en 6 étapes. Durée estimée : **30 à 45 minutes**.

---

## Prérequis

| Outil | Version minimale | Lien |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | inclus avec Node.js |
| Compte Supabase | — | https://supabase.com |
| Compte Vercel | — | https://vercel.com |
| Compte Resend | — | https://resend.com |

---

## Étape 1 — Cloner et installer

```bash
# Dans le dossier de votre choix
cd tcg-stringing
npm install
```

---

## Étape 2 — Configurer Supabase

### 2a. Créer un projet Supabase

1. Connectez-vous sur [supabase.com](https://supabase.com)
2. **New project** → nommez-le `tcg-stringing`
3. Choisissez une région proche (ex : `West EU - Paris`)
4. Notez votre mot de passe de base de données

### 2b. Exécuter le schéma SQL

1. Dans le Dashboard Supabase → **SQL Editor** → **New query**
2. Copiez-collez intégralement le contenu de `supabase/schema.sql`
3. Cliquez **Run** — vous devez voir `Success. No rows returned`

### 2c. Créer le compte cordeur

1. Dashboard → **Authentication** → **Users** → **Add user** → **Create new user**
   - Email : `cordeur@tcgarde.fr` (ou l'email de votre choix)
   - Password : choisissez un mot de passe fort
   - ✅ **Auto confirm user**
2. Une fois l'utilisateur créé, revenez dans le **SQL Editor** et exécutez :

```sql
UPDATE public.profiles
SET role = 'cordeur', full_name = 'Cordeur TCG'
WHERE email = 'cordeur@tcgarde.fr';
```

> ⚠️ Remplacez l'email si vous en avez utilisé un autre.

### 2d. Activer le Realtime

1. Dashboard → **Database** → **Replication**
2. Dans la section **Tables**, activez `stringing_orders`

### 2e. Récupérer les clés API

Dashboard → **Settings** → **API** — copiez :
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` *(gardez-la secrète)*

---

## Étape 3 — Configurer les notifications push (VAPID)

```bash
# Générer les clés VAPID (une seule fois)
npx web-push generate-vapid-keys
```

Vous obtenez :
```
Public Key:  Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Private Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- `Public Key`  → `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `Private Key` → `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` = `mailto:contact@tcgarde.fr`

> ⚠️ Ces clés sont liées à votre domaine. Si vous les régénérez, toutes les subscriptions push existantes deviennent invalides.

---

## Étape 4 — Configurer Resend (emails de fallback)

1. Créez un compte sur [resend.com](https://resend.com)
2. **API Keys** → **Create API Key** → copiez la clé
3. **Domains** → ajoutez votre domaine (ex: `tcgarde.fr`) et suivez les instructions DNS
4. Dans `lib/email.ts`, remplacez `noreply@tcgarde.fr` par votre adresse vérifiée

La clé → `RESEND_API_KEY`

> 💡 En développement, Resend autorise l'envoi vers votre propre email sans domaine vérifié.

---

## Étape 5 — Variables d'environnement

### Développement local

```bash
cp .env.local.example .env.local
```

Éditez `.env.local` avec les valeurs récupérées aux étapes 2, 3 et 4 :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

NEXT_PUBLIC_VAPID_PUBLIC_KEY=Bxxxxxxxxxxxxxxxx...
VAPID_PRIVATE_KEY=xxxxxxxxxx...
VAPID_SUBJECT=mailto:contact@tcgarde.fr

RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Tester en local

```bash
npm run dev
# → http://localhost:3000
```

---

## Étape 6 — Déploiement sur Vercel

### 6a. Pousser le code sur GitHub

```bash
git init
git add .
git commit -m "feat: TCG Stringing initial commit"
git remote add origin https://github.com/votre-compte/tcg-stringing.git
git push -u origin main
```

### 6b. Créer le projet Vercel

1. [vercel.com/new](https://vercel.com/new) → importer le repo GitHub
2. **Framework Preset** : Next.js (détecté automatiquement)
3. **Root Directory** : `.` (racine)

### 6c. Ajouter les variables d'environnement

Dans Vercel → **Settings** → **Environment Variables**, ajoutez :

| Nom | Valeur | Environnement |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production + Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Production + Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Production + Preview |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `Bxxx...` | Production + Preview |
| `VAPID_PRIVATE_KEY` | `xxx...` | Production + Preview |
| `VAPID_SUBJECT` | `mailto:contact@tcgarde.fr` | Production + Preview |
| `RESEND_API_KEY` | `re_xxx...` | Production + Preview |
| `NEXT_PUBLIC_APP_URL` | `https://tcg-stringing.vercel.app` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://preview-xxx.vercel.app` | Preview |

### 6d. Déployer

Cliquez **Deploy** — Vercel construit et déploie automatiquement.

Votre URL de production : `https://tcg-stringing.vercel.app`

### 6e. Mettre à jour SUPABASE_SITE_URL

Dans Supabase → **Authentication** → **URL Configuration** :
- **Site URL** : `https://tcg-stringing.vercel.app`
- **Redirect URLs** : `https://tcg-stringing.vercel.app/**`

---

## Étape 7 — Icônes PWA

Placez votre logo TCG (PNG, fond transparent, min 512×512px) ici :
```
public/icons/tcg-logo-source.png
```

Puis générez les 5 tailles :
```bash
npm install sharp --save-dev
node scripts/generate-icons.mjs
```

Cela crée :
- `public/icons/icon-72.png`
- `public/icons/icon-96.png`
- `public/icons/icon-128.png`
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`

> Sans cette étape, les icônes ne s'afficheront pas mais l'app fonctionnera quand même.

---

## Vérification du flow complet

Une fois déployé, testez dans cet ordre :

### ✅ Test 1 — Inscription client
1. Ouvrez l'URL de production
2. Cliquez **Créer un compte**, remplissez le formulaire
3. Vérifiez l'email de confirmation → cliquez le lien
4. Connectez-vous → vous arrivez sur `/dashboard`

### ✅ Test 2 — Notifications push
1. Sur le dashboard client, cliquez **Activer les notifications push**
2. Autorisez dans le navigateur
3. Le bouton devient vert "Notifications activées"

### ✅ Test 3 — Dépôt de raquette + notif cordeur
1. Client : cliquez **Déposer une raquette**, remplissez le formulaire
2. Cordeur : connectez-vous avec `cordeur@tcgarde.fr`
3. Le dashboard cordeur affiche la nouvelle demande **en temps réel**
4. Le cordeur doit recevoir une notification push (si activée) ou un email

### ✅ Test 4 — Raquette prête + notif client
1. Cordeur : cliquez **Commencer** puis **✓ Marquer prête**
2. Client : la carte passe au vert **"✓ Prête !"** en temps réel
3. Le client reçoit une notification push ou email

### ✅ Test 5 — Comptabilité
1. Cordeur : ajoutez un prix (ex : 18 €) et cliquez **Marquer livrée**
2. Allez sur `/cordeur/accounting`
3. Les KPIs et le graphique reflètent la commande

### ✅ Test 6 — PWA (optionnel)
1. Sur mobile Chrome, ouvrez l'URL
2. Menu → **Ajouter à l'écran d'accueil**
3. L'app s'ouvre en mode standalone (sans barre navigateur)

---

## Domaine personnalisé (optionnel)

Dans Vercel → **Settings** → **Domains** → ajoutez `cordage.tcgarde.fr`

Puis mettez à jour :
- `NEXT_PUBLIC_APP_URL` → `https://cordage.tcgarde.fr`
- Supabase **Site URL** → `https://cordage.tcgarde.fr`

---

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Redirections infinies en prod | `NEXT_PUBLIC_APP_URL` manquant | Vérifier les variables Vercel |
| Notifications push silencieuses | Clés VAPID incorrectes | Régénérer et redéployer |
| Emails non reçus | Domaine Resend non vérifié | Configurer les DNS Resend |
| Erreur 500 sur `/api/orders` | `SUPABASE_SERVICE_ROLE_KEY` manquante | Vérifier les variables Vercel |
| Realtime ne se déclenche pas | Table non activée | Supabase → Database → Replication → activer `stringing_orders` |
| `profiles` vide après inscription | Trigger non exécuté | Re-exécuter `schema.sql` entièrement |

---

## Variables d'environnement — récapitulatif

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # ne jamais exposer côté client

# Web Push VAPID
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=                  # ne jamais exposer côté client
VAPID_SUBJECT=mailto:contact@tcgarde.fr

# Email (Resend)
RESEND_API_KEY=                     # ne jamais exposer côté client

# App
NEXT_PUBLIC_APP_URL=https://tcg-stringing.vercel.app
```

---

*Guide rédigé pour TCG Stringing v0.1.0 — Tennis Club La Garde*
