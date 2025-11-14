# 🚀 Guide de Déploiement - Training Storybook

Ce guide vous accompagne pas à pas pour déployer votre propre instance de Training Storybook.

---

## 📋 Prérequis

- ✅ Compte Cloudflare (gratuit) : https://dash.cloudflare.com/sign-up
- ✅ Node.js 18+ installé : https://nodejs.org/
- ✅ Git installé : https://git-scm.com/
- ✅ 10 minutes de votre temps ⏱️

---

## 🔐 Étape 1 : Configuration Locale

### 1.1 Cloner le Repository

```bash
git clone https://github.com/Atalantis/training-storybook.git
cd training-storybook
```

### 1.2 Installer les Dépendances

```bash
npm install
```

### 1.3 Créer votre Configuration Cloudflare

```bash
# Copier le template de configuration
cp wrangler.example.jsonc wrangler.jsonc
```

⚠️ **IMPORTANT** : Le fichier `wrangler.jsonc` est dans `.gitignore` et ne doit **JAMAIS** être commité !

### 1.4 Configuration Locale (Optionnel)

Si vous voulez tester localement :

```bash
# Créer fichier de variables locales
echo "ADMIN_PASSWORD=VotreMotDePasseLocal123" > .dev.vars

# Lancer les migrations D1 locales
npx wrangler d1 migrations apply training-storybook-library --local

# Builder le projet
npm run build

# Démarrer avec PM2
pm2 start ecosystem.config.cjs

# Accéder à l'application
# → http://localhost:3000
```

---

## ☁️ Étape 2 : Configuration Cloudflare

### 2.1 Authentification

```bash
npx wrangler login
```

Cela ouvrira votre navigateur pour autoriser Wrangler à accéder à votre compte Cloudflare.

### 2.2 Créer les Ressources Cloudflare

#### A) Créer le Bucket R2 (Stockage PDF)

```bash
npx wrangler r2 bucket create storybook-pdfs
```

✅ **Résultat attendu** :
```
Created bucket 'storybook-pdfs' with default storage class set to Standard.
```

**👉 Action** : Notez le nom du bucket : `storybook-pdfs`

---

#### B) Créer la Database D1 (Bibliothèque)

```bash
npx wrangler d1 create training-storybook-library
```

✅ **Résultat attendu** :
```
✅ Successfully created DB 'training-storybook-library'!

[[d1_databases]]
binding = "DB"
database_name = "training-storybook-library"
database_id = "869c11f2-93d0-48f9-b6b3-2a95e143a494"
```

**👉 Action** : Copiez les deux valeurs :
- `database_name` : `training-storybook-library`
- `database_id` : `869c11f2-93d0-48f9-b6b3-2a95e143a494` (votre ID sera différent)

---

#### C) Créer le KV Namespace (Cache)

```bash
npx wrangler kv:namespace create DOCUMENTS
```

✅ **Résultat attendu** :
```
🌀 Creating namespace with title "training-storybook-DOCUMENTS"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "DOCUMENTS", id = "1af656db33824e62be7ab9ceb9a8f12b" }
```

**👉 Action** : Copiez l'ID : `1af656db33824e62be7ab9ceb9a8f12b` (votre ID sera différent)

---

### 2.3 Éditer `wrangler.jsonc`

Ouvrez le fichier `wrangler.jsonc` et remplacez les placeholders :

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "training-storybook",
  "compatibility_date": "2025-11-09",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  
  "kv_namespaces": [
    {
      "binding": "DOCUMENTS",
      "id": "1af656db33824e62be7ab9ceb9a8f12b"  // ← REMPLACER par votre KV ID
    }
  ],
  
  "r2_buckets": [
    {
      "binding": "PDFS",
      "bucket_name": "storybook-pdfs"  // ← REMPLACER si vous avez choisi un autre nom
    }
  ],
  
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "training-storybook-library",  // ← REMPLACER si différent
      "database_id": "869c11f2-93d0-48f9-b6b3-2a95e143a494"  // ← REMPLACER par votre D1 ID
    }
  ]
}
```

---

## 🗄️ Étape 3 : Migrations Database

Appliquer le schéma de base de données en production :

```bash
npx wrangler d1 migrations apply training-storybook-library --remote
```

✅ **Résultat attendu** :
```
Migrations to be applied:
┌────┬────────────────────────────────┬────────┐
│ id │ name                           │ status │
├────┼────────────────────────────────┼────────┤
│ 1  │ 0001_initial_schema.sql        │ new    │
│ 2  │ 0002_add_tags_and_folders.sql  │ new    │
│ 3  │ 0003_add_client_tags.sql       │ new    │
└────┴────────────────────────────────┴────────┘

✔ About to apply 3 migration(s)
Your database may not be available to serve requests during the migration, continue? … yes
🌀 Applying migrations...
✅ Successfully applied 3 migration(s)!
```

---

## 🔨 Étape 4 : Build & Deploy

### 4.1 Build du Projet

```bash
npm run build
```

✅ **Résultat attendu** :
```
🏗️  Starting build process...
✅ Tailwind CSS built successfully
✅ Vite build completed
✅ Public assets copied to dist/
🎉 Build completed successfully!
```

### 4.2 Créer le Projet Cloudflare Pages

```bash
npx wrangler pages project create training-storybook --production-branch main
```

### 4.3 Déployer

```bash
npx wrangler pages deploy dist --project-name training-storybook
```

✅ **Résultat attendu** :
```
✨ Success! Uploaded 13 files
🌎 Deploying...
✨ Deployment complete!
✨ https://xxxxxx.training-storybook.pages.dev
```

**👉 Notez votre URL de déploiement !**

---

## 🔐 Étape 5 : Configuration du Mot de Passe Admin

### Via Dashboard Cloudflare (Recommandé)

1. Aller sur https://dash.cloudflare.com/
2. Workers & Pages → `training-storybook`
3. Settings → Environment variables
4. Production → Add variable
   - **Name** : `ADMIN_PASSWORD`
   - **Type** : Encrypted
   - **Value** : VotreMotDePasseSecurise123
5. Save

### Via Wrangler CLI

```bash
npx wrangler pages secret put ADMIN_PASSWORD --project-name training-storybook
# Entrer votre mot de passe quand demandé
```

---

## 🎉 Étape 6 : Premier Accès

1. **Ouvrir votre URL** : `https://xxxxxx.training-storybook.pages.dev`
2. **Cliquer sur "Admin"** dans le menu
3. **Se connecter** avec votre `ADMIN_PASSWORD`
4. **Upload votre premier PDF** !

---

## 🔧 Configuration Avancée

### Domaine Personnalisé

1. Dashboard Cloudflare → Workers & Pages → training-storybook
2. Custom domains → Set up a custom domain
3. Ajouter : `storybook.votre-domaine.com`
4. DNS configuré automatiquement par Cloudflare

### Configuration IA (Gemini)

1. Se connecter à l'admin : `/admin`
2. Cliquer sur "⚙️ Configuration" en haut à droite
3. Section "🤖 Intelligence Artificielle"
4. Entrer votre clé API Gemini (chiffrée automatiquement)
5. Enregistrer

---

## 🐛 Dépannage

### Erreur "Database not configured"

➡️ Vérifiez que `wrangler.jsonc` contient les bons IDs  
➡️ Vérifiez que les migrations ont été appliquées

### Erreur "R2 bucket not found"

➡️ Vérifiez le nom du bucket dans `wrangler.jsonc`  
➡️ Créez le bucket : `npx wrangler r2 bucket create storybook-pdfs`

### Erreur "KV namespace not found"

➡️ Vérifiez l'ID du KV dans `wrangler.jsonc`  
➡️ Créez le namespace : `npx wrangler kv:namespace create DOCUMENTS`

### Impossible de se connecter à l'admin

➡️ Vérifiez que `ADMIN_PASSWORD` est bien configuré  
➡️ Dashboard Cloudflare → Workers & Pages → training-storybook → Settings → Environment variables

---

## 📚 Ressources

- **Documentation Cloudflare Pages** : https://developers.cloudflare.com/pages/
- **Documentation Wrangler** : https://developers.cloudflare.com/workers/wrangler/
- **Support** : Ouvrir une issue sur GitHub

---

## ✅ Checklist Finale

Avant de considérer votre déploiement comme terminé :

- [ ] Resources Cloudflare créées (R2, D1, KV)
- [ ] `wrangler.jsonc` édité avec vos IDs
- [ ] Migrations D1 appliquées (--remote)
- [ ] Projet buildé (`npm run build`)
- [ ] Déployé sur Cloudflare Pages
- [ ] `ADMIN_PASSWORD` configuré
- [ ] Accès admin fonctionnel
- [ ] Premier PDF uploadé avec succès

**🎉 Félicitations ! Votre instance Training Storybook est opérationnelle !**
