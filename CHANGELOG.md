# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [1.2.0] - 2025-01-12

### ✨ Ajouté

**Gestion Bulk des Documents :**
- Sélection multiple via checkboxes sur chaque document
- Shift+Click pour sélection en plage (sélectionner plusieurs docs d'un coup)
- Barre d'actions flottante avec compteur de sélection
- Actions bulk : suppression, édition tags/dossier, déplacement groupés
- Gestion d'erreurs robuste avec feedback utilisateur

**Conversion PDF Intégrée :**
- Convertir les PDFs directement depuis la bibliothèque
- Bouton orange de conversion sur chaque document
- Modal avec options : format de page, qualité, sauter des pages
- Remplacement automatique du fichier (supprimer ancien → upload nouveau → update DB)
- Barre de progression temps réel (0-100%) avec étapes détaillées
- Maintien des métadonnées du document (token, tags, dossier)

**Analyse IA Améliorée :**
- Bouton d'analyse individuel sur chaque document (gradient violet-rose)
- Logging d'erreurs amélioré avec préfixes emoji (🤖, 🔄, ✅, ❌)
- Messages d'erreur plus clairs et guidage de dépannage
- Support OCR pour documents scannés maintenu

**Améliorations UX :**
- Section upload en accordéon repliable (fermé par défaut)
- Interface bibliothèque plus propre
- Meilleur feedback visuel pour les opérations bulk
- Style de boutons cohérent entre fonctionnalités

### 🔧 Modifié

**Backend (src/index.tsx) :**
- Nouveau endpoint PUT `/api/admin/documents/:token/file` pour remplacement de fichier
- Logging amélioré pour opérations sur fichiers
- Maintien de la cohérence des clés R2 pendant le remplacement

**Frontend (public/static/admin.js) :**
- Système complet de sélection bulk avec Shift+Click
- Modal de conversion avec toutes les options
- Workflow de conversion en 6 étapes avec suivi de progression
- Parsing de tags robuste (gère formats string et array)
- Correction du bug double-stringify dans édition bulk

**Documentation :**
- CHANGELOG.md professionnel (format Keep a Changelog)
- README.en.md complet (traduction anglaise)
- README.md (français) mis à jour avec fonctionnalités v1.2.0
- Homepage mise à jour (FR + EN) avec nouvelles feature cards
- .gitignore amélioré (fichiers PM2, backups, OS-specific)

### 🐛 Corrigé

- Barre d'actions bulk ne réapparaissait pas après opérations
- Tags double-stringify dans édition bulk
- Erreurs undefined de modal de conversion
- Visibilité du bouton d'analyse IA
- CSS de l'accordéon (bg-gray-700 au lieu de bg-gray-750 inexistant)
- Problèmes de structure HTML dans vue bibliothèque

### 🗑️ Supprimé

- 20+ fichiers de documentation temporaires (BATCH_*.md, FIX*.md, DEBUG*.md)
- Fichiers de test et debug utilisés pendant développement beta

---

## [1.1.0] - 2025-01-11

### ✨ Ajouté

**Analyse IA Automatique :**
- Intégration Gemini 2.5 Flash pour analyse automatique des PDFs
- Suggestions intelligentes de métadonnées (titre, tags, description)
- Support OCR pour documents scannés
- Analyse rapide (5-7 secondes) et gratuite
- Batch upload avec analyse IA automatique

**Système de Tags et Dossiers :**
- Tags de contenu pour classification thématique
- Tags clients personnalisés (classification par projet/client)
- Dossiers hiérarchiques pour organisation
- Recherche avancée par tags, dossiers, nom de fichier
- Filtres puissants dans la bibliothèque

**Compression PDF Automatique :**
- Compression automatique des PDFs > 10 MB avant upload
- Réduction de 80-95% de la taille des fichiers
- Accélération des uploads et téléchargements
- Économie d'espace R2 Cloudflare

**Système de Logging Debug :**
- Logging complet avec préfixes emoji pour catégorisation
- Traçabilité des opérations (upload, analyse IA, conversion)
- Messages d'erreur détaillés pour debugging

### 🔧 Modifié

- Interface bibliothèque complètement redessinée
- Upload drag & drop amélioré
- Barre de progression pour uploads

---

## [1.0.0] - 2025-01-10

### ✨ Ajouté

**Viewer PDF Interactif :**
- Animation de page tournée basée sur StPageFlip
- Mode livre fermé avec overlay "Cliquer pour ouvrir"
- Contrôles de navigation (précédent/suivant/première/dernière page)
- Affichage du numéro de page actuel
- Design responsive (desktop, tablette, mobile)

**Infrastructure Cloudflare :**
- Déploiement sur Cloudflare Pages + Workers
- R2 object storage pour fichiers PDF
- D1 SQLite database pour métadonnées
- Architecture edge-first pour performance globale

**Partage de Documents :**
- Génération de liens publics uniques par document
- Partage via URL sécurisée avec token
- Compteur de vues pour chaque document
- Mode iframe pour intégration dans LMS/sites web

**Administration :**
- Interface admin sécurisée avec authentification
- Upload de PDFs avec métadonnées
- Gestion des documents (édition, suppression)
- Bibliothèque organisée

**Design & UX :**
- TailwindCSS pour styling moderne
- Font Awesome pour icônes
- Interface sombre élégante
- Animations fluides

### 🔧 Technique

- Hono framework sur Cloudflare Workers
- PDF.js pour rendu PDF côté client
- pdf-lib pour manipulation PDF côté serveur
- Architecture TypeScript complète
- Migrations D1 pour schéma database

---

## Notes de Version

- **[1.2.0]** : Version production avec gestion bulk et conversion intégrée
- **[1.1.0]** : Ajout analyse IA et organisation avancée
- **[1.0.0]** : Release initiale avec viewer interactif

[1.2.0]: https://github.com/Atalantis/training-storybook/releases/tag/v1.2.0
[1.1.0]: https://github.com/Atalantis/training-storybook/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Atalantis/training-storybook/releases/tag/v1.0.0
