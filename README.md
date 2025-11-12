# 📚 Training Storybook

> **Solution complète de visualisation et partage de storybooks PDF interactifs**  
> Alternative libre et exportable à Gemini Storybook pour présentations pédagogiques autonomes

[![Production](https://img.shields.io/badge/status-production-brightgreen)](https://training-storybook.pages.dev)
[![Cloudflare](https://img.shields.io/badge/cloudflare-pages-orange)](https://pages.cloudflare.com)
[![Version](https://img.shields.io/badge/version-1.1.0-blue)](https://github.com/Atalantis/training-storybook/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

📖 **[Guide de Setup Complet](SETUP_GUIDE.md)** | 🚀 **[Démo Live](https://training-storybook.pages.dev)** | 💚 **[Faire un Don](https://pots.lydia.me/collect/pots?id=54317-storybook-reader)**

---

## 🎯 Concept & Problématique

### Gemini Storybook : Fonctionnalité Innovante mais Limitée

Google Gemini propose une fonctionnalité expérimentale **"Storybook"** ([gemini.google.com/gem/storybook](https://gemini.google.com/gem/storybook)) permettant de créer des livres illustrés personnalisés via IA :

![Gemini Storybook](https://page.gensparksite.com/v1/base64_upload/a2b1efd1852cdd9cc6bb401e04ae5779)

**Exemple de storybook généré** : [BRUT.pdf](https://page.gensparksite.com/get_upload_url/21441d2c5496065b8787b67c98bb53cdde8189e10893c684da0eb4363edbedd6/default/e6475bb4-37df-4513-9842-c3ed6d8a8322) (export brut depuis Gemini)

### ❌ Limitations de Gemini Storybook

1. **Non exportable** : Impossible de télécharger la visionneuse interactive
2. **Pas d'iframe** : Intégration impossible dans sites web, LMS, ou applications tierces
3. **Accès bloqué** : Nombreux environnements professionnels bloquent l'accès à `gemini.google.com`
4. **Pas autonome** : Nécessite connexion Google active
5. **Confidentialité** : Documents hébergés sur serveurs Google

### ✅ Notre Solution : Storybook Reader

**Storybook Reader** résout ces problèmes en offrant :

- ✅ **Exportation libre** : Hébergement autonome sur votre infrastructure Cloudflare
- ✅ **Iframe-ready** : Intégration fluide dans n'importe quel contexte web
- ✅ **Accès universel** : Fonctionne même dans environnements restreints
- ✅ **Autonome** : Pas de dépendance externe ni authentification requise
- ✅ **Confidentialité** : Vos données restent sous votre contrôle

---

## 🎬 Démonstration Live

### 🔗 Essayer Maintenant

**[► Ouvrir la Démo Interactive](https://training-storybook.pages.dev/view?doc=21edaf29-7fc6-4478-9e00-e63f8afccfe5)** *(s'ouvre dans un nouvel onglet)*

Cette démo montre toutes les fonctionnalités du viewer :
- ✅ Animation page-flip réaliste
- ✅ Navigation clavier/souris/tactile
- ✅ Miniatures et zoom
- ✅ Mode plein écran
- ✅ Responsive (desktop/tablette/mobile)

### 📦 Intégration Iframe (LMS, Sites Web)

```html
<iframe 
  src="https://training-storybook.pages.dev/view?doc=21edaf29-7fc6-4478-9e00-e63f8afccfe5" 
  width="100%" 
  height="800" 
  frameborder="0" 
  allowfullscreen 
  style="border: 1px solid #ccc; border-radius: 8px;">
</iframe>
```

### 🔐 Liens Utiles

- **Homepage** : [training-storybook.pages.dev](https://training-storybook.pages.dev)
- **Admin Panel** : [/admin](https://training-storybook.pages.dev/admin)
- **Setup Guide** : [SETUP_GUIDE.md](SETUP_GUIDE.md)

---

## 🎯 Fonctionnalités Principales

### 📖 Lecteur PageFlip Interactif
- **Effet livre réaliste** : Animation de tournage de pages professionnelle
- **Navigation intuitive** : Clavier (flèches), tactile (swipe), boutons
- **Zoom dynamique** : +/- et adaptation automatique fenêtre
- **Mode plein écran** : Compatible tous navigateurs (desktop + mobile)
- **Panneau miniatures** : Navigation rapide avec preview
- **Responsive** : Desktop (double-page) / Mobile (single-page optimisée)
- **Raccourcis clavier** : ←/→ (navigation), +/- (zoom), Esc (fullscreen)

### 🔄 Convertisseur PDF A3→A5
- **Découpe automatique** : Split horizontal A3 landscape → 2 pages A5 portrait
- **Option "Ignorer première page"** : Supprime première page A5 (utile pour pages blanches)
- **Qualité ajustable** : 72 DPI (basse), 150 DPI (moyenne), 300 DPI (haute)
- **Prévisualisation** : Aperçu avant upload
- **Upload automatique** : Intégration directe à la bibliothèque

### 📚 Bibliothèque de Documents (v1.1.0 🆕)
- **Upload PDF** : Drag & drop ou sélecteur de fichier
- **🔍 Recherche avancée** : Filtre par nom, description, tags, dossiers
- **🏷️ Système de tags** : Multi-labels pour catégorisation (ex: "Formation", "DDA", "Bancassurance")
- **📁 Dossiers hiérarchiques** : Organisation type "Formation/Module1" avec support de sous-dossiers
- **Gestion descriptions** : Édition via modale enrichie avec tags et dossiers
- **Filtres dynamiques** : Auto-complétion des dossiers et tags existants
- **Tokens sécurisés** : UUID uniques pour chaque document
- **Statistiques** : Compteur de vues par document
- **Opérations** : Partage, édition, suppression

### 🔗 Partage Multi-Canal
1. **Lien direct** : URL sécurisée avec copie rapide
2. **QR Code** : Génération + téléchargement PNG pour accès mobile
3. **Code iframe** : Personnalisable (dimensions, fullscreen)
4. **Aperçu live** : Prévisualisation iframe en temps réel

### 🔐 Interface Administration
- **Authentification** : Mot de passe sécurisé (Cloudflare Secrets)
- **3 Onglets** :
  - 📚 **Bibliothèque** : Gestion documents
  - 🔄 **Convertisseur** : Traitement PDF A3→A5
  - 🔒 **Sécurité** : Changement mot de passe + Configuration IA
- **Édition inline** : Descriptions modifiables sans modal
- **Interface moderne** : TailwindCSS + dark theme

### 🤖 Analyse IA Automatique (v1.1.0 🆕)

**Génération automatique de métadonnées PDF via Intelligence Artificielle**

#### Fonctionnalités
- ✨ **Auto-complétion intelligente** : Description, tags, dossiers générés automatiquement
- 🧠 **Gemini 2.5 Flash** : Analyse ultra-rapide par Google AI (gratuit jusqu'à 1500 req/jour)
- 🔐 **Sécurité maximale** : Clés API chiffrées AES-256-GCM avant stockage
- ⚡ **Analyse rapide** : Extraction intelligente + miniature en 5-7 secondes
- 🎯 **Contextuel** : Analyse adaptée au contenu (formation, documentation, marketing)
- 🔍 **OCR intégré** : Reconnaissance automatique de texte pour PDFs scannés via Tesseract.js (français + anglais)
- 📊 **Sampling intelligent** : Extraction adaptative 1-3 pages selon taille document (scalable jusqu'à 1000+ pages)
- 💡 **Indicateur clé API** : Badge visuel indiquant si une clé Gemini est enregistrée

#### Emplacements des Boutons "Analyser avec IA"

| Interface | Déclencheur | Pré-remplit |
|-----------|-------------|-------------|
| **📚 Upload Direct** | Après sélection fichier | Description, Tags, Dossier |
| **🔄 Convertisseur** | Après conversion PDF | Description, Tags, Dossier |
| **✏️ Modal Édition** | Bouton "🔄 Ré-analyser" | Filename, Description, Tags, Dossier |

#### Configuration

1. **Aller dans Sécurité > Configuration IA**
2. **Activer l'analyse IA** avec le toggle ON/OFF
3. **Obtenir une clé Gemini gratuite** : [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
4. **Coller la clé API** et **Enregistrer**
5. **Vérifier le badge de statut** : ✅ Clé enregistrée / ⚠️ Aucune clé
6. **Tester** avec le bouton "Tester la clé API"

#### Coûts Estimés

| Provider | Gratuit | Payant | Coût/analyse |
|----------|---------|--------|--------------|
| **Gemini 2.5 Flash** | ✅ 1500 req/jour | $0.075/1M tokens | ~$0.0001 |

**💡 Pourquoi Gemini 2.5 Flash ?**
- ⚡ **3-4x plus rapide** que Pro (5-7s vs 15-20s)
- 💰 **15x moins cher** que Pro ($0.0001 vs $0.0015)
- 🎯 **Qualité excellente** pour classification et tagging
- 🔒 **Zéro thinking tokens** : Pas de dépassement MAX_TOKENS
- 📈 **Scalable** : Gère 1-1000+ pages via sampling intelligent

#### Sécurité des Clés API

```
┌─────────────────────┐
│ Saisie Interface    │ (HTTPS)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Chiffrement Backend │ (AES-256-GCM)
│ Clé = PBKDF2(admin) │ (100k iterations)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Cloudflare KV       │ (Stockage chiffré)
│ jamais en clair     │
└─────────────────────┘
```

**Garanties** :
- ✅ Clés **jamais stockées en clair**
- ✅ Chiffrement **militaire** (AES-256-GCM)
- ✅ Clé dérivée du **mot de passe admin** (PBKDF2)
- ✅ **Impossible de relire** après enregistrement
- ✅ **Changement mot de passe** → nouvelle clé de chiffrement

#### Workflow d'Analyse

```
1. Utilisateur charge PDF → Clic "Analyser avec IA"
2. Sampling Intelligent → Stratégie adaptative selon taille
   • ≤5 pages   : Toutes les pages analysées
   • 6-20 pages : 3 premières pages
   • 21-50 pages: 2 premières pages
   • 50+ pages  : 1ère page uniquement
3. Extraction (PDF.js) → Texte échantillonné + Miniature
   ↓ Si texte < 100 caractères (PDF scanné détecté)
   3b. OCR (Tesseract.js) → Extraction texte depuis images (1-3 pages selon taille)
4. Envoi sécurisé → Backend déchiffre clé API depuis KV
5. Appel IA → Gemini 2.5 Flash analyse le contenu
6. Parsing JSON → { filename, description, tags, folder }
7. Pré-remplissage → Utilisateur valide ou modifie
8. Enregistrement → Métadonnées stockées en D1
```

#### Support PDFs Scannés (OCR)

**Détection automatique** : Si le PDF contient moins de 100 caractères de texte natif, le système active automatiquement l'OCR.

**Tesseract.js** :
- ✅ Reconnaissance multilingue (français + anglais)
- ✅ Extraction adaptative (1-3 pages selon taille doc)
- ✅ Progression en temps réel affichée dans le bouton
- ✅ Fallback vers image seule si OCR échoue
- ⏱️ Temps d'exécution : 10-30 secondes selon qualité scan

**Scalabilité** :
- 📄 **1-5 pages** : OCR sur 3 pages maximum (qualité maximale)
- 📄 **6-20 pages** : OCR sur 2 premières pages (équilibre)
- 📄 **21-50 pages** : OCR sur 1ère page uniquement (performance)
- 📄 **50+ pages** : OCR sur 1ère page (scalabilité)

**Exemples de PDFs compatibles** :
- 📄 Documents scannés (imprimantes/scanners)
- 📸 PDFs créés depuis photos
- 🖼️ Présentations exportées en images
- 📋 Formulaires scannés

#### Exemple de Suggestions IA

**PDF analysé** : Formation bancassurance module 1

```json
{
  "filename": "formation-bancassurance-module-1.pdf",
  "description": "Introduction aux produits d'assurance-vie et prévoyance en bancassurance",
  "tags": ["Formation", "Bancassurance", "Assurance-vie", "DDA"],
  "folder": "Formation/Bancassurance"
}
```

---

## 🏗️ Architecture Technique

### Stack Technologique

| Couche | Technologies |
|--------|-------------|
| **Backend** | Hono v4 (Cloudflare Workers) |
| **Frontend** | Vanilla JS + TailwindCSS v3 |
| **Viewer** | StPageFlip v2.0.7 + PDF.js v3.11 |
| **Converter** | pdf-lib v1.17 (client-side) |
| **QR Codes** | QRCode.js v1.0 |
| **AI Analysis** | Google Gemini 2.5 Flash |
| **OCR** | Tesseract.js v5.0.5 (français + anglais) |

### Infrastructure Cloudflare

```
┌─────────────────────────────────────────────┐
│          Cloudflare Pages                    │
│  (Edge Hosting + Workers Runtime)           │
├─────────────────────────────────────────────┤
│  Hono Backend (src/index.tsx)               │
│  ├─ /api/admin/login                        │
│  ├─ /api/admin/upload                       │
│  ├─ /api/admin/documents                    │
│  ├─ /api/admin/change-password              │
│  ├─ /api/admin/set-ai-config         🆕    │
│  ├─ /api/admin/ai-config             🆕    │
│  ├─ /api/admin/test-ai                🆕    │
│  ├─ /api/admin/analyze-pdf           🆕    │
│  └─ /api/documents/:token                   │
├─────────────────────────────────────────────┤
│  Storage Services                            │
│  ├─ D1 Database (SQLite distribué)          │
│  │  └─ Table: documents                     │
│  ├─ R2 Storage (S3-compatible)              │
│  │  └─ Bucket: storybook-pdfs               │
│  └─ KV Namespace (Key-Value)                │
│     ├─ admin_password_hash                  │
│     ├─ AI_ENABLED                    🆕    │
│     └─ GEMINI_API_KEY_ENCRYPTED     🆕    │
└─────────────────────────────────────────────┘
```

### Schéma Base de Données (D1)

```sql
CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,           -- UUID v4
  filename TEXT NOT NULL,
  description TEXT,
  r2_key TEXT NOT NULL,                 -- Clé R2 Storage
  size INTEGER NOT NULL,                -- Taille en octets
  views INTEGER DEFAULT 0,              -- Compteur consultations
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Sécurité

| Mécanisme | Implémentation |
|-----------|----------------|
| **Authentification admin** | Double mot de passe (personnalisé KV + master secret) |
| **Hashing** | SHA-256 + salt 32 hex (Web Crypto API) |
| **Tokens documents** | UUID v4 (impossible à énumérer) |
| **CORS** | Configuré pour accès API contrôlé |
| **Secrets** | Cloudflare Secrets (chiffrés) + KV |
| **Accès public** | Lecture seule via tokens |

---

## 🚀 Installation & Déploiement

### Prérequis

- Node.js 18+ & npm
- Compte Cloudflare (gratuit)
- Wrangler CLI : `npm install -g wrangler`

### Installation Locale

```bash
# 1. Cloner le repository
git clone https://github.com/Atalantis/training-storybook.git
cd training-storybook

# 2. Installer dépendances
npm install

# 3. Configuration locale
echo "ADMIN_PASSWORD=VotreMotDePasse123" > .dev.vars

# 4. Migrations base de données locale
npm run db:migrate:local

# 5. Build
npm run build

# 6. Démarrage local (PM2)
pm2 start ecosystem.config.cjs

# 7. Accès
# → http://localhost:3000
```

### Déploiement Production (Cloudflare Pages)

```bash
# 1. Authentification Cloudflare
wrangler login

# 2. Créer ressources Cloudflare
# R2 Bucket
wrangler r2 bucket create storybook-pdfs

# D1 Database
wrangler d1 create storybook-library
# → Copier database_id dans wrangler.jsonc

# KV Namespace
wrangler kv:namespace create DOCUMENTS
# → Copier id dans wrangler.jsonc

# 3. Créer projet Pages
wrangler pages project create training-storybook --production-branch main

# 4. Migrations base de données production
wrangler d1 migrations apply storybook-library --remote

# 5. Configurer mot de passe admin
# Via Dashboard Cloudflare:
# Workers & Pages → training-storybook → Settings → Environment variables
# Ajouter: ADMIN_PASSWORD (encrypted) = VotreMotDePasse123

# 6. Build et deploy
npm run build
wrangler pages deploy dist --project-name training-storybook

# 7. Accès production
# → https://training-storybook.pages.dev
```

### Variables d'Environnement

**Local (`.dev.vars`)** :
```env
ADMIN_PASSWORD=VotreMotDePasseSecurise123
```

**Production** : Configurer via Cloudflare Dashboard (chiffré)

---

## 📱 Responsive Design

### Desktop (> 768px)
```
┌─────────────────────────────────────────────┐
│  Header (horizontal)                         │
├────────────────────────────┬────────────────┤
│                            │                 │
│   Double Page View         │   Thumbnails   │
│   (PageFlip Effect)        │   Panel        │
│                            │                 │
└────────────────────────────┴────────────────┘
```

### Mobile (< 768px)
```
┌───────────────────────┐
│  Header (vertical)    │
├───────────────────────┤
│                       │
│   Single Page View    │
│   (Optimized)         │
│                       │
├───────────────────────┤
│  Thumbnails           │
│  (Bottom Sheet)       │
└───────────────────────┘
```

**Fonctionnalités mobiles** :
- ✅ Swipe gauche/droite (navigation)
- ✅ Pinch-to-zoom
- ✅ Boutons tactiles 44x44px (accessibilité)
- ✅ Fullscreen iOS/Android compatible

---

## 🎓 Cas d'Usage Pédagogiques

### 1. Formation Présentielle
**Objectif** : Distribution rapide de supports à des stagiaires en salle

**Workflow** :
1. Upload storybook PDF via convertisseur
2. Génération QR Code
3. Projection QR sur écran
4. Scan par stagiaires → Accès mobile immédiat
5. Consultation autonome sur smartphones

**Avantages** :
- ⚡ Zéro installation app
- 📱 Compatible tous devices
- 🔒 Accès sécurisé par token
- 📊 Tracking consultations

### 2. E-Learning & LMS
**Objectif** : Intégration dans plateformes pédagogiques (Moodle, Claroline, etc.)

**Workflow** :
1. Upload storybook
2. Copie code iframe
3. Intégration dans module e-learning
4. Paramétrage dimensions (adaptative)
5. Publication

**Code exemple** :
```html
<div class="storybook-container">
  <iframe 
    src="https://votre-domain.pages.dev/view?doc=TOKEN" 
    width="100%" 
    height="800" 
    frameborder="0" 
    allowfullscreen 
    style="border: 1px solid #ddd; border-radius: 8px;">
  </iframe>
</div>
```

### 3. Email & Communication
**Objectif** : Envoi de contenus pédagogiques enrichis

**Workflow** :
1. Upload storybook
2. Copie lien direct sécurisé
3. Intégration dans email (HTML ou texte)
4. Envoi aux apprenants
5. Accès direct via clic

**Template email** :
```html
Bonjour,

Votre nouveau support de formation est disponible :
🔗 <a href="https://votre-domain.pages.dev/view?doc=TOKEN">
   Accéder au storybook
</a>

Bonne lecture !
```

### 4. Présentations Autonomes
**Objectif** : Kiosques, bornes interactives, événements

**Configuration** :
- Mode fullscreen par défaut
- Navigation tactile optimisée
- Autoplay optionnel
- Branding personnalisé

---

## 🛠️ Maintenance

### Commandes Utiles

```bash
# Base de données
npm run db:migrate:local      # Migrations locales (SQLite)
npm run db:migrate:prod       # Migrations production (D1)
npm run db:console:local      # Console D1 locale
npm run db:console:prod       # Console D1 distante

# Développement
npm run dev                   # Vite dev server
npm run build                 # Build production
pm2 logs webapp --nostream    # Logs PM2

# Déploiement
npm run deploy                # Deploy Cloudflare Pages
npm run deploy:prod           # Deploy production explicite

# Sécurité
npm run git:status            # Status git
npm run git:commit "message"  # Commit rapide
```

### Monitoring

**Métriques disponibles** :
- 📊 Compteur de vues par document
- 📁 Taille totale stockage R2
- 🕐 Date dernière consultation
- 📈 Tendances d'accès (via logs Cloudflare)

**Logs Cloudflare** :
```bash
# Logs temps réel
wrangler pages deployment tail

# Logs production
# → Dashboard Cloudflare → Analytics
```

---

## 📂 Structure du Projet

```
training-storybook/
├── src/
│   └── index.tsx                 # Backend Hono + API routes
├── public/
│   └── static/
│       ├── admin.js              # Interface admin (tabs)
│       ├── viewer.js             # Lecteur PageFlip
│       └── viewer.css            # Styles viewer
├── migrations/
│   └── 0001_create_documents.sql # Schema D1
├── .git/                         # Git repository
├── .gitignore                    # Fichiers ignorés
├── .dev.vars                     # Variables locales (git-ignored)
├── wrangler.jsonc                # Config Cloudflare
├── package.json                  # Dépendances
├── ecosystem.config.cjs          # Config PM2
├── README.md                     # Documentation FR
├── README.en.md                  # Documentation EN
├── SECURITY_GUIDE.md             # Guide sécurité
├── FIRST_LOGIN.md                # Guide première connexion
└── CREDENTIALS.txt               # Credentials (git-ignored)
```

---

## 🆘 Dépannage

### Problèmes Courants

#### 1. "Invalid password" en production
**Cause** : Variable `ADMIN_PASSWORD` non configurée sur Cloudflare  
**Solution** : Dashboard → Settings → Environment variables → Ajouter `ADMIN_PASSWORD` (encrypted)

#### 2. Iframe ne s'affiche pas
**Cause** : CORS ou X-Frame-Options  
**Solution** : Vérifier que l'URL de l'iframe est correcte et que `allowfullscreen` est présent

#### 3. PDF ne se charge pas dans le viewer
**Cause** : Token invalide ou document supprimé  
**Solution** : Vérifier le token dans la base D1 : `wrangler d1 execute storybook-library --command="SELECT * FROM documents WHERE token='...'" --remote`

#### 4. Convertisseur A3→A5 échoue
**Cause** : PDF protégé ou format non standard  
**Solution** : Utiliser un PDF non protégé et vérifier qu'il est bien A3 landscape

---

## 📄 Licence

**Propriétaire** : INSURACTIO  
**Usage** : Interne et clients INSURACTIO  
**Redistribution** : Non autorisée sans accord écrit

### Bibliothèques Tierces

Ce projet utilise des bibliothèques open-source sous licences permissives (MIT, Apache 2.0) :

- **StPageFlip v2.0.7** (MIT) - Effet PageFlip par Nodlik
- **PDF.js v3.11.174** (Apache 2.0) - Mozilla Foundation
- **pdf-lib v1.17.1** (MIT) - Andrew Dillon
- **QRCode.js v1.0.0** (MIT) - David Shim
- **Hono v4** (MIT) - Yusuke Wada
- **TailwindCSS v3** (MIT) - Tailwind Labs

Voir [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) pour les textes complets des licences.

---

## 👤 Auteur

**Florent Siegenthaler** (INSURACTIO)  
- 💼 Product Owner Senior (7 ans d'expérience)
- 🏦 Spécialiste Assurance & Fintech
- 🎯 Discovery → Design → Delivery
- 🏢 Fondateur INSURACTIO
- 📧 Contact : [florent@insuractio.com](mailto:florent@insuractio.com)
- 🔗 LinkedIn : [/in/fsiegenthaler](https://www.linkedin.com/in/fsiegenthaler/)

---

## 💝 Soutenir le Projet

**Storybook Reader** est développé et maintenu bénévolement pour rendre accessible des outils pédagogiques de qualité professionnelle.

Si ce projet vous aide dans vos formations ou présentations, vous pouvez soutenir son développement et sa mise à disposition publique :

[![Faire un don](https://img.shields.io/badge/💝_Faire_un_don-Lydia-blue?style=for-the-badge)](https://pots.lydia.me/collect/pots?id=54317-storybook-reader)

**[→ Soutenir via Lydia](https://pots.lydia.me/collect/pots?id=54317-storybook-reader)**

Votre soutien permet de :
- 🚀 Développer de nouvelles fonctionnalités
- 📚 Créer plus d'outils pédagogiques open-source
- 🔧 Maintenir et améliorer l'application
- 📖 Produire de la documentation de qualité
- 🎓 Rendre accessible la formation à tous

**Merci à tous les contributeurs ! 🙏**

---

## 💚 Soutenir le Projet

### Pourquoi Donner ?

Storybook Reader est un **projet pédagogique open source** développé bénévolement pour :
- 🎓 **Démocratiser l'accès** aux outils de présentation interactive
- 🆓 **Offrir une alternative libre** aux solutions propriétaires (Gemini, etc.)
- 🌍 **Partager les connaissances** avec la communauté edtech
- 🔓 **Rendre publics** des outils professionnels de qualité

### Faire un Don

Si ce projet vous est utile, vous pouvez soutenir son développement et la création de nouveaux outils pédagogiques :

[![Donate via Lydia](https://img.shields.io/badge/💚_Faire_un_Don-Lydia-00D66F?style=for-the-badge)](https://pots.lydia.me/collect/pots?id=54317-storybook-reader)

**🔗 Lien direct** : [https://pots.lydia.me/collect/pots?id=54317-storybook-reader](https://pots.lydia.me/collect/pots?id=54317-storybook-reader)

### Impact de Votre Don

Vos contributions permettent de :
- ⚡ **Accélérer le développement** de nouvelles fonctionnalités
- 📚 **Créer plus d'outils** pédagogiques open source
- 🐛 **Maintenir et améliorer** les projets existants
- 📖 **Produire de la documentation** de qualité
- 🎓 **Former la communauté** via tutoriels et exemples

### Autres Façons de Contribuer

Pas les moyens de donner ? Vous pouvez aussi :
- ⭐ **Star le projet** sur GitHub (visibilité++)
- 🐦 **Partager** sur LinkedIn/Twitter
- 📝 **Écrire un article** sur votre utilisation
- 🎤 **Présenter** le projet dans votre organisation
- 🤝 **Contribuer au code** (voir section ci-dessous)

---

## 🤝 Contribution Code

Ce projet est ouvert aux contributions de la communauté :

1. 🐛 **Bug reports** : Ouvrir une issue sur GitHub
2. 💡 **Suggestions** : Proposer des améliorations via discussions
3. 🔧 **Pull requests** : Contributions code bienvenues (après discussion)
4. 📧 **Contact** : florent@insuractio.com

---

## 🔗 Liens Utiles

- 🌐 **Production** : [training-storybook.pages.dev](https://training-storybook.pages.dev)
- 📁 **GitHub** : [Atalantis/training-storybook](https://github.com/Atalantis/training-storybook)
- 📚 **Documentation Cloudflare** : [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages)
- 🤖 **Gemini Storybook** : [gemini.google.com/gem/storybook](https://gemini.google.com/gem/storybook)

---

## 📊 Statistiques du Projet

- **Version** : 1.1.0-beta
- **Date** : Novembre 2025
- **Status** : 🧪 Beta Testing (v1.1.0 en cours de validation)
- **Lignes de code** : ~4700
- **Technologies** : 12
- **Services Cloudflare** : 4 (Pages, Workers, R2, D1)

### 🐛 Bugs Résolus Récemment (v1.1.0-beta)

#### Fix #18 : UX Library - Accordéon & Simplification (12/11/2025)
- **Problème** : Section "Ajouter un Document" trop prominente, bouton "Analyser IA" en doublon
- **Solutions** :
  - ✅ Section "Ajouter un Document" transformée en accordéon collapsible (fermé par défaut)
  - ✅ Suppression du bouton "Analyser avec IA" dans l'upload (déjà dans Batch Analyze)
  - ✅ Focus sur la bibliothèque existante (fonctionnalité principale)
  - ✅ Chevron animé pour indiquer l'état ouvert/fermé
- **Impact** : UI plus claire, moins de clutter, accent sur la consultation des documents

#### Fix #17 : Cloudflare Pages - Headers & Favicon (12/11/2025)
- **Problème** : _headers file et favicon.svg pas déployés (Cloudflare Pages avec Workers bypass _headers)
- **Solutions** :
  - ✅ Security headers via middleware Hono (Permissions-Policy, X-Frame-Options, X-Content-Type-Options)
  - ✅ Favicon inline SVG (200 bytes, Cache-Control 1 an)
  - ✅ Build script custom copie public/ → dist/
  - ✅ Cache-Control headers pour static assets (1 an) et API (no-cache)
- **Impact** : Headers sécurisés sur toutes les routes, favicon fonctionnel, console propre en production

#### Fix #16 : Production-Ready - Console & Fiabilité (12/11/2025)
- **Problème** : Console polluée (Tailwind CDN warning, Permissions-Policy errors, favicon 404, Gemini 503 failures)
- **Solutions** :
  - ✅ Tailwind CDN → PostCSS build pipeline (23KB minified, pas de warning en prod)
  - ✅ Vite prod optimizations (`esbuild.drop: ['console', 'debugger']`)
  - ✅ Retry logic avec exponential backoff pour Gemini 503 (5 retries, 500ms-16s delay + jitter)
- **Impact** : Console propre, robustesse accrue face aux surcharges Gemini API, build production optimisé

#### Fix #15 : Compteur "Annuler" dynamique (12/11/2025)
- **Problème** : Le compteur de suggestions appliquées/restantes affichait toujours "Applied: 0"
- **Cause racine** : Le comptage était figé au moment de la création du bouton, avant toute application
- **Solution** : Recalcul dynamique du compteur au moment du clic sur "Annuler"
- **Impact** : Modale de confirmation affiche maintenant les bons comptes en temps réel

#### Fix #14 : Bouton "Fermer" désactivé (11/11/2025)
- **Problème** : Le bouton "Fermer" restait désactivé après analyse, forçant l'usage du 'X'
- **Solution** : Ajout de `button.disabled = false` avant de transformer le bouton en "Fermer"

#### Fix #13 : Reset du bouton dans `finally` (11/11/2025)
- **Problème** : Le bouton "Fermer" se réinitialisant incorrectement en "Lancer l'analyse"
- **Solution** : Suppression du bloc `finally` qui écrasait l'état du bouton

#### Fix #12 : Métadonnées non appliquées (11/11/2025)
- **Problème** : Le PATCH backend recevait `undefined` pour description, tags et folder
- **Cause racine** : Mauvaise extraction des suggestions imbriquées (`suggestions.suggestions.*`)
- **Solution** : Correction de l'extraction dans `applyBatchSuggestions` pour utiliser la structure imbriquée

#### Fix #11 : Extraction de texte PDF scannés (10/11/2025)
- **Problème** : "Insufficient text" pour PDFs scannés (première page vide)
- **Solution** : Smart sampling jusqu'à 5 pages avec seuil de 300 caractères et arrêt anticipé

#### Fix #10 : Modale de résultats persistante (10/11/2025)
- **Problème** : Modale se fermait automatiquement avant lecture/application des suggestions
- **Solution** : Remplacement de l'auto-close par modale persistante avec cartes détaillées et boutons "Appliquer"

---

**Développé avec ❤️ par INSURACTIO pour révolutionner la formation bancassurance**
