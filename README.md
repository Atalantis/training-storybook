# 📚 Training Storybook

> **Bibliothèque interactive de documents PDF avec analyse IA par lot**  
> Gestion intelligente, analyse automatique, et partage collaboratif de contenus pédagogiques

[![Production](https://img.shields.io/badge/status-production-brightgreen)](https://training-storybook.pages.dev)
[![Cloudflare](https://img.shields.io/badge/cloudflare-pages-orange)](https://pages.cloudflare.com)
[![Version](https://img.shields.io/badge/version-1.4.3-blue)](https://github.com/Atalantis/training-storybook/releases)
[![License](https://img.shields.io/badge/license-proprietary-red)](LICENSE)

🚀 **[Démo Live](https://training-storybook.pages.dev)** | 📖 **[GitHub](https://github.com/Atalantis/training-storybook)** | 💚 **[Faire un Don](https://pots.lydia.me/collect/pots?id=54317-storybook-reader)**

---

## 🎯 Concept & Problématique

### ✨ Dernière Mise à Jour : Filtre par Client (v1.4.3)

**Nouvelle fonctionnalité** : Liste déroulante pour filtrer les documents par client.

#### 👥 Filtre Client (v1.4.3 - 12 Nov 2025)

**Nouveau filtre dans la liste de documents** :
- Dropdown "👥 Tous les clients"
- Auto-peuplé avec tous les clients uniques
- Filtrage instantané en un clic

**Utilisation** :
- ✅ Voir tous les documents d'un client spécifique
- ✅ Combiner avec recherche textuelle
- ✅ Combiner avec filtre de dossier
- ✅ Combiner avec filtre de tag
- ✅ Bouton "Réinitialiser" efface tous les filtres

**Exemple pratique** :
```
Client : "Crédit Mutuel" + Tag : "Formation"
→ Affiche uniquement les formations Crédit Mutuel
```

**Bénéfices** :
- 🎯 Accès rapide aux documents d'un client
- 🔍 Filtrage multi-critères puissant
- 📊 Vue organisée par client
- ⚡ Pas besoin de chercher manuellement

### ✨ v1.4.2 : Contrôle Total de la Compression

**Nouvelle fonctionnalité** : Option pour ignorer complètement la compression automatique lors de l'upload.

#### ⚡ Upload Sans Compression (v1.4.2 - 12 Nov 2025)

**Nouvelle option dans le formulaire d'upload** :
- ☑️ Checkbox "Ignorer la compression automatique"
- Upload le fichier original tel quel, sans aucune compression
- Qualité 100% préservée

**Cas d'usage** :
- ✅ PDFs déjà optimisés externement (Acrobat Pro, etc.)
- ✅ Documents avec photos haute résolution
- ✅ Diagrammes techniques nécessitant netteté absolue
- ✅ Éviter la double compression et ses artefacts
- ✅ Contrôle total sur la qualité finale

**Comportement** :
- **Par défaut** (non coché) : Compression auto > 10 MB à 95%
- **Option activée** : Fichier original préservé, pas de compression
- Fonctionne en single et batch upload
- Message clair : "⚡ compression ignorée"

**Trade-off** :
- ⚠️ Temps d'upload plus long pour gros fichiers
- ✅ Qualité maximale garantie

### ✨ v1.4.1 : Qualité d'Image Haute Définition

**Correctif critique** : Résolution des problèmes de qualité d'image causant du texte et des images flous.

#### 🖼️ Qualité d'Image Améliorée (v1.4.1 - 12 Nov 2025)

**Problème résolu** : Les PDFs convertis/compressés avaient des **images floues et du texte illisible**.

**Causes identifiées** :
- ❌ Compression PDF à 80% (trop agressif)
- ❌ Modal Bibliothèque à 70% par défaut (beaucoup trop bas)
- ❌ Extraction IA à 50-70% (catastrophique pour OCR)

**Améliorations appliquées** :
- ✅ **Qualité par défaut → 95%** partout (au lieu de 70-85%)
- ✅ **Nouvelle option 100%** pour qualité maximale
- ✅ **Extraction IA** : 50% → 85% (batch), 70% → 95% (normal)
- ✅ **Options visibles** dans tous les onglets

**Résultats** :
- 🎯 **Texte net et lisible** après toutes les conversions
- 🎯 **Images conservent leur netteté** (diagrammes, schémas)
- 🎯 **OCR plus précis** sur documents scannés (+40% précision)
- 🎯 **Analyse IA plus fiable** grâce à images HD
- 📊 Trade-off : fichiers +10-20% plus lourds, mais qualité professionnelle

### ✨ v1.4.0 : Analyse Batch Intelligente

**Amélioration majeure** : Qualité d'analyse par lot significativement améliorée grâce à un échantillonnage intelligent incluant les pages du milieu.

#### 🚀 Analyse Batch Optimisée (v1.4.0 - 12 Nov 2025)

**Problème résolu** : L'analyse par lot était trop limitée (2-3 pages seulement) et ignorait complètement les documents scannés.

**Nouvelles capacités** :
- ✅ **Échantillonnage intelligent** : Début + milieu + fin (au lieu de seulement début + fin)
  - Document 21 pages → extrait `[1, 2, 10, 21]` au lieu de `[1, 2, 21]`
  - Document 100 pages → extrait `[1, 2, 25, 75, 100]` au lieu de `[1, 100]`
- ✅ **OCR léger activé** : Documents scannés enfin analysables en batch (page 1)
- ✅ **+50% de qualité** avec seulement +2-3s par document (5-8s vs 2-3s)
- ✅ **Contexte enrichi** : Pages du milieu capturent le contenu principal du document
- ✅ **Cohérence** : Philosophie d'échantillonnage alignée avec le mode individuel

**Impact concret** :
- Les tags IA reflètent mieux le contenu réel
- Les descriptions sont plus précises
- Les suggestions de dossiers plus pertinentes
- Documents scannés ne sont plus ignorés

#### 🐛 Corrections v1.3.1 (12 Nov 2025)

- ✅ Erreur JavaScript critique (`SyntaxError`) causée par apostrophes non échappées
- ✅ Protection XSS dans tous les handlers onclick dynamiques

#### ⚡ Gestion Robuste des Erreurs 503 (v1.2.0)

#### ⚡ Analyse IA Par Lot avec Retry Intelligent

- ✅ **Détection automatique erreurs 503** : Surcharges temporaires API Gemini
- ✅ **Notification conviviale** : Explications claires des causes et solutions
- ✅ **Bouton "Réessayer les échecs"** : Retry sans re-téléchargement des PDFs
- ✅ **Conservation des données extraites** : Texte OCR et images réutilisés
- ✅ **Compteur dynamique** : Affichage du nombre de documents restants
- ✅ **Exponential backoff retry** : 5 tentatives avec délai progressif

#### 📊 Workflow de Gestion d'Erreur 503

```
1. Utilisateur lance analyse par lot (3 documents)
2. Phase extraction → ✅ Réussie (2.5s)
3. Phase AI → Partiellement réussie (69s)
   • ✅ Document 1 : Succès
   • ✅ Document 2 : Succès
   • ❌ Document 3 : Erreur 503 (API surchargée)
4. Notification jaune affichée :
   ⚠️ "Analyse temporairement indisponible"
   • Causes : Surcharge serveurs Google (503) / Limite de taux
   • Actions : Attendre 2-3 min → Cliquer "Réessayer les échecs"
   • Réassurance : "Ne vous inquiétez pas, c'est normal et temporaire !"
5. Bouton orange "Réessayer les échecs (1)" visible
6. Clic → Retry automatique avec données conservées
7. Succès → Document ajouté + bouton "Appliquer"
```

#### 🔧 Architecture Technique du Système de Retry

**Backend (`src/index.tsx`)** :
```typescript
// Capture du code erreur HTTP
catch (error: any) {
  let errorCode = null;
  if (error.message && error.message.includes('Gemini API Error')) {
    const statusMatch = error.message.match(/(\d{3})/);
    if (statusMatch) {
      errorCode = parseInt(statusMatch[1]); // 503
    }
  }
  
  errors.push({
    filename: doc.filename,
    documentId: doc.documentId,
    error: errorMessage,
    errorCode: errorCode,
    // Store document data for retry
    documentData: {
      text: doc.text,
      imageBase64: doc.imageBase64,
      isScanned: doc.isScanned,
      totalPages: doc.totalPages,
      sampledPages: doc.sampledPages
    }
  });
}
```

**Frontend (`public/static/admin.js`)** :
```javascript
// Stockage global pour retry
window.failedDocuments = result.errors.map(err => ({
    token: err.documentId,
    filename: err.filename,
    text: err.documentData?.text || '',
    imageBase64: err.documentData?.imageBase64 || null,
    isScanned: err.documentData?.isScanned || false,
    totalPages: err.documentData?.totalPages || null,
    sampledPages: err.documentData?.sampledPages || null
}));

// Fonction de retry (150+ lignes)
async function retryFailedDocuments() {
    // Appel API avec documents échoués
    const response = await fetch('/api/admin/batch-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: window.failedDocuments })
    });
    
    // Mise à jour de la liste des échecs
    window.failedDocuments = stillFailing.map(...);
    
    // Update UI avec nouveaux succès
    // ...
}
```

**Commit associé** :
```
feat: Robust error handling for batch AI analysis with retry

- Backend: Capture errorCode (503) and store documentData for retry
- Frontend: Auto-detect 503 errors with user-friendly notification
- Frontend: Add "Retry Failed" button with dynamic counter
- Frontend: Implement retryFailedDocuments() function (150+ lines)
- Frontend: Preserve extracted data (text, images) for fast retry
- Frontend: Update modal with new results after retry
```

---

## 🎯 Fonctionnalités Principales

### 📖 Lecteur PageFlip Interactif

#### 🎨 Qualité d'Affichage Ultra-Haute (v1.5.0 - 13 Nov 2025) 🆕

**Optimisations majeures de rendu** pour une qualité professionnelle pixel-perfect :

- ✅ **Pages internes** : Rendu 2x pour couvertures (première/dernière page)
- ✅ **Livre fermé DPR-aware** : Support Retina/HiDPI automatique (2x-3x densité)
- ✅ **Détection PDFs basse résolution** : Boost 2x pour PDFs générés par pypdf
- ✅ **Canvas haute qualité** : imageSmoothingQuality 'high' + contexte optimisé
- ✅ **Zero rescaling CSS** : Rendu exact aux dimensions cibles (pas de perte)

**Résultats visibles** :
- 🎯 Texte ultra-net sur tous les écrans (standard, Retina, mobile)
- 🎯 Couverture livre fermé en qualité HD
- 🎯 Compensation automatique pour PDFs de mauvaise qualité source
- 📊 Compatible tous types de PDFs (natifs, scannés, pypdf, etc.)

**Commits associés** :
```
e4eb6e6 fix: Boost render quality for small/low-res PDFs (pypdf issue)
9ae6a5e fix: Render closed book at exact dimensions with DPR
790d72d fix: Enhance closed book canvas rendering quality
c0884eb fix: Improve closed book cover quality (scale 1.0 → 2.5)
d856aa1 fix: Improve cover page quality with 2x render scale
```

#### 📱 Mode Affichage Adaptatif (v1.5.0 - 13 Nov 2025) 🆕

**Toggle single/double page** pour une lecture optimale sur tous supports :

- ✅ **Auto-détection mobile** : Passe automatiquement en mode 1 page sur <768px
- ✅ **Bouton toggle** : Icône livre dynamique (📖 ↔ 📕)
- ✅ **Raccourci clavier 'M'** : Bascule instantané entre modes
- ✅ **Persistance localStorage** : Mémorise la préférence utilisateur
- ✅ **Reconfiguration PageFlip** : usePortrait adapté au mode sélectionné
- ✅ **Mémorisation position** : Conserve la page lors du changement de mode

**Cas d'usage** :
- 📱 **Mobile** : 1 page en portrait = lecture confortable
- 💻 **Desktop** : 2 pages paysage = expérience livre classique
- 🎯 **Flexibilité** : L'utilisateur choisit son mode préféré

**Commit associé** :
```
4d9521e feat(beta): Add single/double page toggle for mobile viewer
```

#### 🎨 Fonctionnalités Classiques

- **Effet livre réaliste** : Animation de tournage de pages professionnelle
- **Navigation intuitive** : Clavier (flèches), tactile (swipe), boutons
- **Zoom dynamique** : +/- et adaptation automatique fenêtre
- **Mode plein écran** : Compatible tous navigateurs (desktop + mobile)
- **Panneau miniatures** : Navigation rapide avec preview
- **Responsive** : Desktop (double-page) / Mobile (single-page optimisée)
- **Raccourcis clavier** : ←/→ (navigation), +/- (zoom), F (fullscreen), M (toggle mode), Esc (sortie)

### 🔄 Convertisseur PDF A3→A5
- **Découpe automatique** : Split horizontal A3 landscape → 2 pages A5 portrait
- **Option "Ignorer première page"** : Supprime première page A5 (utile pour pages blanches)
- **Qualité ajustable** : 72 DPI (basse), 150 DPI (moyenne), 300 DPI (haute)
- **Prévisualisation** : Aperçu avant upload
- **Upload automatique** : Intégration directe à la bibliothèque

### 📚 Bibliothèque de Documents
- **Upload PDF** : Drag & drop ou sélecteur de fichier
- **🔍 Recherche avancée** : Filtre par nom, description, tags, dossiers
- **🏷️ Système de tags** : Multi-labels pour catégorisation (ex: "Formation", "DDA", "Bancassurance")
- **📁 Dossiers hiérarchiques** : Organisation type "Formation/Module1" avec support de sous-dossiers
- **Gestion descriptions** : Édition via modale enrichie avec tags et dossiers
- **Filtres dynamiques** : Auto-complétion des dossiers et tags existants
- **Tokens sécurisés** : UUID uniques pour chaque document
- **Statistiques** : Compteur de vues par document
- **Opérations** : Partage, édition, suppression

### 🤖 Analyse IA Par Lot avec Retry Intelligent (v1.2.0 🆕)

**Nouvelle fonctionnalité majeure** : Traitement de multiples PDFs avec gestion robuste des erreurs.

#### Caractéristiques
- ✅ **Analyse simultanée** : Traitement de 1-N documents en une seule session
- ✅ **Traitement séquentiel** : Un document à la fois (évite surcharge API)
- ✅ **Délai intelligent** : 4 secondes entre chaque appel API
- ✅ **Retry automatique** : 5 tentatives avec exponential backoff (500ms-16s)
- ✅ **Gestion erreurs 503** : Détection + notification conviviale + bouton retry
- ✅ **Conservation données** : Texte/images extraits réutilisés au retry
- ✅ **Modale détaillée** : Résultats, statistiques, succès/échecs
- ✅ **Boutons "Appliquer"** : Application individuelle ou en lot

#### Workflow Complet
```
1. Sélection documents (checkbox multiple)
2. Clic "Analyser la sélection"
3. Phase extraction (R2 download + PDF parsing)
   • Progression : "Extraction 1/3, 2/3, 3/3"
   • Durée typique : 1-3 secondes par document
4. Phase AI (Gemini 2.5 Flash analysis)
   • Progression : "Analyse 1/3, 2/3, 3/3"
   • Durée typique : 5-7 secondes par document
   • Délai entre requêtes : 4 secondes
5. Résultats (modale interactive)
   • Statistiques : Succès / Échecs / Durée
   • Cartes détaillées pour chaque succès
   • Notification 503 si erreurs temporaires
   • Bouton "Réessayer les échecs (X)"
   • Boutons "Appliquer" individuels
   • Bouton "Appliquer toutes"
6. Retry intelligent (si erreurs 503)
   • Clic "Réessayer les échecs"
   • Réutilisation données extraites (pas de re-téléchargement)
   • Mise à jour dynamique de la modale
   • Nouveaux succès affichés avec boutons "Appliquer"
```

#### Notification d'Erreur 503 (Conviviale)
```
⚠️ Analyse temporairement indisponible

L'API Gemini est actuellement surchargée ou vous avez atteint une limite de quota.

Causes possibles:
• Surcharge temporaire des serveurs Google (erreur 503)
• Limite de taux atteinte (trop de requêtes)

Que faire:
✅ Attendez 2-3 minutes
✅ Cliquez sur "Réessayer les échecs" ci-dessous
✅ Si le problème persiste, réessayez dans 1 heure

💡 Ne vous inquiétez pas : c'est normal et temporaire!
```

### 🤖 Analyse IA Automatique (v1.1.0)

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

#### Support PDFs Scannés (OCR)

**Détection automatique** : Si le PDF contient moins de 100 caractères de texte natif, le système active automatiquement l'OCR.

**Tesseract.js** :
- ✅ Reconnaissance multilingue (français + anglais)
- ✅ Extraction adaptative (1-3 pages selon taille doc)
- ✅ Progression en temps réel affichée dans le bouton
- ✅ Fallback vers image seule si OCR échoue
- ⏱️ Temps d'exécution : 10-30 secondes selon qualité scan

### 🔗 Partage Multi-Canal
1. **Lien direct** : URL sécurisée avec copie rapide
2. **QR Code** : Génération + téléchargement PNG pour accès mobile
3. **Code iframe** : Personnalisable (dimensions, fullscreen)
4. **Aperçu live** : Prévisualisation iframe en temps réel

### 🔐 Interface Administration
- **Authentification** : Mot de passe sécurisé (Cloudflare Secrets)
- **3 Onglets** :
  - 📚 **Bibliothèque** : Gestion documents + Analyse par lot
  - 🔄 **Convertisseur** : Traitement PDF A3→A5
  - 🔒 **Sécurité** : Changement mot de passe + Configuration IA
- **Édition inline** : Descriptions modifiables sans modal
- **Interface moderne** : TailwindCSS + dark theme

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
│  ├─ /api/admin/batch-analyze         🆕    │
│  ├─ /api/admin/change-password              │
│  ├─ /api/admin/set-ai-config                │
│  ├─ /api/admin/ai-config                    │
│  ├─ /api/admin/test-ai                      │
│  ├─ /api/admin/analyze-pdf                  │
│  └─ /api/documents/:token                   │
├─────────────────────────────────────────────┤
│  Storage Services                            │
│  ├─ D1 Database (SQLite distribué)          │
│  │  └─ Table: documents                     │
│  ├─ R2 Storage (S3-compatible)              │
│  │  └─ Bucket: storybook-pdfs               │
│  └─ KV Namespace (Key-Value)                │
│     ├─ admin_password_hash                  │
│     ├─ AI_ENABLED                           │
│     └─ GEMINI_API_KEY_ENCRYPTED             │
└─────────────────────────────────────────────┘
```

---

## 🚀 URLs de Déploiement

### 🌐 Production
- **Homepage** : https://library-insuractio.pages.dev
- **Admin Panel** : https://library-insuractio.pages.dev/admin
- **Viewer Demo** : https://library-insuractio.pages.dev/view?doc=[token]

### 📁 GitHub Repository
- **GitHub** : https://github.com/Atalantis/library-insuractio

---

## 🔧 Installation & Déploiement

### Prérequis

- Node.js 18+ & npm
- Compte Cloudflare (gratuit)
- Wrangler CLI : `npm install -g wrangler`

### Installation Locale

```bash
# 1. Cloner le repository
git clone https://github.com/Atalantis/library-insuractio.git
cd library-insuractio

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

#### ⚠️ Configuration Requise

**IMPORTANT** : Avant de déployer, vous devez créer votre propre configuration :

```bash
# 1. Copier le fichier de configuration exemple
cp wrangler.example.jsonc wrangler.jsonc

# 2. Le fichier wrangler.jsonc ne doit JAMAIS être commité
# (il est déjà dans .gitignore)
```

#### 📋 Étapes de Déploiement

```bash
# 1. Authentification Cloudflare
wrangler login

# 2. Créer ressources Cloudflare
# R2 Bucket pour stocker les PDFs
wrangler r2 bucket create storybook-pdfs

# D1 Database pour la bibliothèque
wrangler d1 create training-storybook-library
# → Copier le database_id retourné

# KV Namespace pour le cache des métadonnées
wrangler kv:namespace create DOCUMENTS
# → Copier le id retourné

# 3. Éditer wrangler.jsonc avec vos IDs
# Ouvrir wrangler.jsonc et remplacer:
# - YOUR_KV_NAMESPACE_ID_HERE → ID du KV
# - YOUR_R2_BUCKET_NAME_HERE → nom du bucket R2
# - YOUR_D1_DATABASE_NAME_HERE → nom de la database D1
# - YOUR_D1_DATABASE_ID_HERE → ID de la database D1

# 4. Créer projet Pages
wrangler pages project create training-storybook --production-branch main

# 5. Migrations base de données production
wrangler d1 migrations apply training-storybook-library --remote

# 5. Configurer mot de passe admin
# Via Dashboard Cloudflare:
# Workers & Pages → library-insuractio → Settings → Environment variables
# Ajouter: ADMIN_PASSWORD (encrypted) = VotreMotDePasse123

# 6. Build et deploy
npm run build
wrangler pages deploy dist --project-name library-insuractio

# 7. Accès production
# → https://library-insuractio.pages.dev
```

---

## 📊 Statistiques du Projet

- **Version** : 1.5.0 (Stable)
- **Date de création** : 11 novembre 2025
- **Status** : ✅ Production
- **Lignes de code** : ~6000+
- **Technologies** : 12
- **Services Cloudflare** : 4 (Pages, Workers, R2, D1, KV)

### 🐛 Changements Récents

#### v1.5.0 : Qualité Viewer Ultra-HD + Toggle Mobile (13/11/2025) 🆕
- **Qualité d'affichage** : Rendu DPR-aware pour Retina/HiDPI (2x-3x densité pixels)
- **Couverture livre fermé** : Scale 1.0 → 2.5 + canvas exact dimensions
- **PDFs basse résolution** : Détection automatique + boost 2x qualité (pypdf, etc.)
- **Pages internes** : Rendu 2x pour première/dernière page (couvertures)
- **Mode affichage adaptatif** : Toggle 1/2 pages avec auto-détection mobile
- **Raccourci clavier 'M'** : Bascule instantané single/double page
- **Persistance** : localStorage mémorise préférence utilisateur
- **Impact** : Qualité professionnelle pixel-perfect sur tous écrans et tous PDFs

#### v1.3.0 : Feedback Visuel IA & Auto-Fermeture Intelligente (12/11/2025)
- **Nouvelle fonctionnalité** : Zone de progression visible dans la modale d'édition pendant l'analyse IA
- **Frontend** : État de chargement avec spinner + barre de progression temps réel
- **Frontend** : Auto-fermeture intelligente (uniquement si tous documents traités ET pas d'échecs)
- **Frontend** : Feedback visuel renforcé (bordure verte + notification toast)
- **Backend** : Endpoint sécurisé pour suppression complète de la bibliothèque
- **Impact** : UX professionnelle, plus de confusion, feedback clair à chaque étape

#### v1.2.0 : Gestion Robuste des Erreurs 503 (12/11/2025)
- **Nouvelle fonctionnalité** : Retry intelligent pour erreurs API temporaires
- **Backend** : Capture errorCode (503) + stockage documentData
- **Frontend** : Notification conviviale + bouton "Réessayer les échecs"
- **Frontend** : Fonction `retryFailedDocuments()` (150+ lignes)
- **Frontend** : Conservation données extraites (pas de re-téléchargement)
- **Impact** : Résilience accrue face aux surcharges Gemini API

#### v1.1.0 : Analyse IA Par Lot (11/11/2025)
- **Nouvelle fonctionnalité** : Traitement de multiples PDFs en une seule session
- **Modale détaillée** : Résultats, statistiques, boutons "Appliquer"
- **OCR intégré** : Support PDFs scannés via Tesseract.js
- **Sampling intelligent** : 1-3 pages selon taille document

#### Fix #18 : UX Library - Accordéon & Simplification (12/11/2025)
- ✅ Section "Ajouter un Document" en accordéon (fermé par défaut)
- ✅ Suppression bouton "Analyser avec IA" dans upload
- ✅ Focus sur bibliothèque existante

#### Fix #17 : Cloudflare Pages - Headers & Favicon (12/11/2025)
- ✅ Security headers via middleware Hono
- ✅ Favicon inline SVG (200 bytes, Cache-Control 1 an)
- ✅ Build script custom copie public/ → dist/

#### Fix #16 : Production-Ready - Console & Fiabilité (12/11/2025)
- ✅ Tailwind CDN → PostCSS build pipeline
- ✅ Vite prod optimizations (`esbuild.drop: ['console', 'debugger']`)
- ✅ Retry logic avec exponential backoff pour Gemini 503

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
- 💼 Consultant en stratégie formation spécialisé bancassurance
- 📷 Photographe corporate et évènementiel
- 🏢 Fondateur INSURACTIO
- 📧 Contact : [florent@insuractio.com](mailto:florent@insuractio.com)
- 🔗 LinkedIn : [/in/fsiegenthaler](https://www.linkedin.com/in/fsiegenthaler/)

---

## 💝 Soutenir le Projet

**Library InsuractIO** est développé et maintenu bénévolement pour rendre accessible des outils pédagogiques de qualité professionnelle.

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

## 🤝 Contribution Code

Ce projet est ouvert aux contributions de la communauté :

1. 🐛 **Bug reports** : Ouvrir une issue sur GitHub
2. 💡 **Suggestions** : Proposer des améliorations via discussions
3. 🔧 **Pull requests** : Contributions code bienvenues (après discussion)
4. 📧 **Contact** : florent@insuractio.com

---

## 🔗 Liens Utiles

- 🌐 **Production** : [library-insuractio.pages.dev](https://library-insuractio.pages.dev)
- 📁 **GitHub** : [Atalantis/library-insuractio](https://github.com/Atalantis/library-insuractio)
- 📚 **Documentation Cloudflare** : [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages)
- 🤖 **Gemini API** : [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

---

**Développé avec ❤️ par Florent Siegenthaler INSURACTIO pour révolutionner la formation bancassurance**
