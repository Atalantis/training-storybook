# 🚀 Training Storybook - Guide de Setup Complet

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation Locale](#installation-locale)
3. [Configuration Cloudflare](#configuration-cloudflare)
4. [Déploiement Production](#déploiement-production)
5. [Troubleshooting](#troubleshooting)

---

## 🔧 Prérequis

### Comptes Nécessaires
- ✅ **Compte Cloudflare** (gratuit) : https://dash.cloudflare.com
- ✅ **Compte GitHub** (optionnel pour déploiement automatique)

### Outils à Installer
```bash
# Node.js v18+ et npm
node --version  # Doit être >= v18.0.0
npm --version

# Git
git --version
```

---

## 💻 Installation Locale

### 1. Cloner le Repository

```bash
git clone https://github.com/Atalantis/training-storybook.git
cd training-storybook
```

### 2. Installer les Dépendances

```bash
npm install
```

### 3. Configurer les Variables d'Environnement Locales

Créer le fichier `.dev.vars` (déjà dans `.gitignore`) :

```bash
cat > .dev.vars << 'EOF'
ADMIN_PASSWORD=VotreMotDePasseSecurise123
EOF
```

⚠️ **Important** : Remplacez `VotreMotDePasseSecurise123` par un mot de passe fort !

### 4. Créer les Ressources Cloudflare (Une Seule Fois)

#### 4.1. Authentification Wrangler

```bash
npx wrangler login
```

Cela ouvrira un navigateur pour autoriser Wrangler.

#### 4.2. Créer le Projet Pages

```bash
npx wrangler pages project create training-storybook \
  --production-branch main \
  --compatibility-date 2025-11-09
```

#### 4.3. Créer la Base de Données D1

```bash
npx wrangler d1 create training-storybook-library
```

📝 **Important** : Copie l'ID de la base de données (format : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

#### 4.4. Créer le Bucket R2

```bash
npx wrangler r2 bucket create training-storybook-pdfs
```

#### 4.5. Créer le Namespace KV

```bash
npx wrangler kv:namespace create DOCUMENTS
```

📝 **Important** : Copie l'ID du namespace KV

### 5. Mettre à Jour `wrangler.jsonc`

Édite le fichier `wrangler.jsonc` et remplace les IDs :

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
      "id": "VOTRE_KV_ID_ICI"  // ⬅️ Remplace avec ton KV ID
    }
  ],
  
  "r2_buckets": [
    {
      "binding": "PDFS",
      "bucket_name": "training-storybook-pdfs"
    }
  ],
  
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "training-storybook-library",
      "database_id": "VOTRE_D1_ID_ICI"  // ⬅️ Remplace avec ton D1 ID
    }
  ]
}
```

### 6. Initialiser la Base de Données

#### 6.1. Base de Données Locale

```bash
npx wrangler d1 execute training-storybook-library \
  --local \
  --file=./migrations/0001_initial_schema.sql
```

#### 6.2. Base de Données Production

```bash
npx wrangler d1 execute training-storybook-library \
  --remote \
  --file=./migrations/0001_initial_schema.sql
```

✅ **Vérification** :

```bash
# Local
npx wrangler d1 execute training-storybook-library \
  --local \
  --command="SELECT name FROM sqlite_master WHERE type='table'"

# Production
npx wrangler d1 execute training-storybook-library \
  --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table'"
```

Tu devrais voir : `documents`

### 7. Build et Test Local

```bash
# Build le projet
npm run build

# Démarrer le serveur de développement (mode pages)
npx wrangler pages dev dist --d1=training-storybook-library --local --port 3000
```

Ouvre : http://localhost:3000

---

## ☁️ Configuration Cloudflare Dashboard

### 1. Configurer les Bindings (CRITIQUE !)

Les bindings **ne sont PAS automatiquement liés** depuis `wrangler.jsonc`. Tu dois les configurer manuellement :

1. Va sur : https://dash.cloudflare.com
2. **Workers & Pages** → **training-storybook**
3. Onglet **Settings**
4. Section **Functions** → Scroll jusqu'à **"Bindings"**

#### Ajouter les 3 Bindings :

**Binding 1 : KV Namespace**
```
Type: KV Namespace
Variable name: DOCUMENTS
KV namespace: [Sélectionne ton namespace avec l'ID créé précédemment]
Environment: Production
```

**Binding 2 : R2 Bucket**
```
Type: R2 Bucket
Variable name: PDFS
R2 bucket: training-storybook-pdfs
Environment: Production
```

**Binding 3 : D1 Database**
```
Type: D1 Database
Variable name: DB
D1 database: training-storybook-library
Environment: Production
```

### 2. Configurer la Variable d'Environnement ADMIN_PASSWORD

Dans la même page **Settings** :

1. Section **Environment variables**
2. Clique **"Add variable"**
3. Configuration :
   ```
   Name: ADMIN_PASSWORD
   Value: VotreMotDePasseSecurise123
   Type: ✅ Encrypted
   Environment: Production
   ```
4. **Save**

⚠️ **Sans ces configurations, l'admin ne fonctionnera pas !**

---

## 🚀 Déploiement Production

### 1. Premier Déploiement

```bash
npm run build
npx wrangler pages deploy dist --project-name training-storybook
```

🎉 Tu recevras une URL comme : `https://xxxxxxxx.training-storybook.pages.dev`

### 2. Vérifier le Déploiement

Ouvre l'URL et teste :
- Homepage : Landing page avec démo
- Admin : `/admin` (login avec ton ADMIN_PASSWORD)

### 3. Déploiements Suivants

```bash
# Build + Deploy
npm run deploy

# Ou manuellement
npm run build
npx wrangler pages deploy dist --project-name training-storybook
```

### 4. URL de Production Finale

Une fois le premier déploiement réussi, ton site sera accessible à :

**https://training-storybook.pages.dev/**

---

## 🔐 Sécurité

### Changer le Mot de Passe Admin

**Option 1 : Depuis l'Admin Panel** (Recommandé)
1. Connecte-toi : https://training-storybook.pages.dev/admin
2. Onglet **"Sécurité"**
3. Entre le mot de passe actuel
4. Entre le nouveau mot de passe (12+ caractères)
5. Confirme et sauvegarde

Le nouveau mot de passe sera stocké hashé (SHA-256 + salt) dans Cloudflare KV.

**Option 2 : Via Dashboard Cloudflare** (Master Password)
1. Dashboard → Workers & Pages → training-storybook → Settings
2. Environment variables → Édite `ADMIN_PASSWORD`
3. Entre la nouvelle valeur
4. Save

### Système de Mot de Passe Dual

Le système utilise **deux mots de passe** (priorité) :

1. **Custom Password** (KV, prioritaire) :
   - Défini depuis l'admin panel
   - Stocké hashé dans Cloudflare KV
   - Changeable à tout moment

2. **Master Password** (Env var, fallback) :
   - Défini dans Dashboard Cloudflare
   - Utilisé si le custom password n'existe pas
   - Sert de récupération

---

## 🐛 Troubleshooting

### Erreur 500 sur `/api/admin/login`

**Cause** : Bindings pas configurés dans Dashboard

**Solution** :
1. Va dans Dashboard → training-storybook → Settings → Functions
2. Vérifie que les 3 bindings (KV, R2, D1) sont présents
3. Redéploie : `npm run deploy`

### Erreur 500 sur `/api/admin/documents`

**Cause** : Structure de table incorrecte

**Solution** :
```bash
# Réinitialise la base de données
npx wrangler d1 execute training-storybook-library \
  --remote \
  --file=./migrations/0001_initial_schema.sql
```

### Erreur "Database not configured"

**Cause** : Binding D1 manquant

**Solution** : Configure le binding `DB` dans Dashboard (voir section Configuration)

### Upload échoue avec "R2 bucket not found"

**Cause** : Binding R2 manquant ou nom incorrect

**Solution** :
1. Vérifie que le bucket existe : `npx wrangler r2 bucket list`
2. Configure le binding `PDFS` dans Dashboard

### Page blanche après login

**Cause** : JavaScript chargé incorrectement

**Solution** :
1. Vide le cache navigateur (Ctrl+Shift+R)
2. Vérifie la console JavaScript (F12)
3. Redéploie si nécessaire

---

## 📚 Commandes Utiles

### Build & Deploy
```bash
npm run build              # Build le projet
npm run deploy             # Build + Deploy
npm run dev                # Dev local avec Vite
```

### Database (D1)
```bash
# Exécuter une requête locale
npx wrangler d1 execute training-storybook-library \
  --local \
  --command="SELECT * FROM documents"

# Exécuter une requête production
npx wrangler d1 execute training-storybook-library \
  --remote \
  --command="SELECT COUNT(*) as total FROM documents"

# Réinitialiser la base
npx wrangler d1 execute training-storybook-library \
  --remote \
  --file=./migrations/0001_initial_schema.sql
```

### Storage (R2)
```bash
# Lister les fichiers
npx wrangler r2 object list training-storybook-pdfs

# Supprimer un fichier
npx wrangler r2 object delete training-storybook-pdfs/pdfs/uuid.pdf
```

### KV Namespace
```bash
# Lister les clés
npx wrangler kv:key list --namespace-id=VOTRE_KV_ID

# Voir une valeur
npx wrangler kv:key get "admin_password_hash" --namespace-id=VOTRE_KV_ID

# Supprimer une clé
npx wrangler kv:key delete "admin_password_hash" --namespace-id=VOTRE_KV_ID
```

---

## 🎓 Prochaines Étapes

Une fois le setup terminé :

1. ✅ Connecte-toi à l'admin : `/admin`
2. ✅ Change ton mot de passe (onglet Sécurité)
3. ✅ Upload ton premier storybook (onglet Bibliothèque)
4. ✅ Teste le viewer public : `/view?doc=TOKEN`
5. ✅ Génère un QR code pour partager

---

## 🆘 Support

**GitHub Issues** : https://github.com/Atalantis/training-storybook/issues

**Email** : florent@insuractio.com

**LinkedIn** : https://www.linkedin.com/in/fsiegenthaler/

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2025-11-10
