# 🧪 Plan de Test - Fonctionnalités Batch

**Date :** 2025-01-12  
**Version :** 1.2.0-dev  
**Testeur :** Florent  
**URL App :** https://3000-ibxnbzmjo6elbal3asaap-5634da27.sandbox.novita.ai

---

## ✅ Fonctionnalités Implémentées à Tester

### 1. 📤 Batch Upload (Upload Multiple de PDFs)

**Localisation :** Onglet "Bibliothèque" → Section Upload

**Ce qui a été implémenté :**
- ✅ Attribut `multiple` sur l'input file
- ✅ Prévisualisation des fichiers sélectionnés (nom + taille)
- ✅ Backend `/api/admin/batch-upload` avec gestion d'erreurs individuelles
- ✅ Logique frontend `handleUpload()` détectant batch vs single
- ✅ Affichage résumé : "X fichiers uploadés, Y échecs"

**Tests à effectuer :**

#### Test 1.1 : Upload simple (1 fichier) - Régression
- [ ] Sélectionner 1 PDF
- [ ] Vérifier que le comportement reste identique (pas de régression)
- [ ] Upload doit fonctionner normalement

#### Test 1.2 : Upload multiple (3-5 fichiers)
- [ ] Sélectionner 3-5 PDFs différents
- [ ] Vérifier l'affichage de la prévisualisation avec noms et tailles
- [ ] Cliquer "Uploader"
- [ ] Vérifier le message de succès : "✅ X fichiers uploadés"
- [ ] Vérifier que tous les fichiers apparaissent dans la bibliothèque

#### Test 1.3 : Upload avec fichiers invalides (mixed)
- [ ] Sélectionner 2 PDFs valides + 1 fichier .txt ou .jpg
- [ ] Uploader
- [ ] Vérifier que les PDFs sont uploadés
- [ ] Vérifier le message d'erreur pour le fichier invalide

#### Test 1.4 : Métadonnées batch (dossier + tags)
- [ ] Sélectionner 3 PDFs
- [ ] Remplir "Dossier" : `Test Batch`
- [ ] Ajouter tags : `test`, `batch`, `pdf`
- [ ] Uploader
- [ ] Vérifier que TOUS les fichiers ont le même dossier et les mêmes tags

---

### 2. 🤖 Batch AI Analysis

**Localisation :** Onglet "Bibliothèque" → Bouton "🤖 Analyse IA par Lot"

**Ce qui a été implémenté :**
- ✅ Modal de sélection de documents avec checkboxes
- ✅ Backend `/api/admin/batch-analyze` avec rate limiting (4s/requête)
- ✅ Extraction de contenu PDF (texte + images)
- ✅ Appel Gemini 2.5 Flash avec prompt structuré
- ✅ Progress tracking temps réel : "Analyse X/Y"
- ✅ Application automatique des suggestions (nom, description, tags, dossier)

**Tests à effectuer :**

#### Test 2.1 : Analyse batch de 2 documents
- [ ] Cliquer "🤖 Analyse IA par Lot"
- [ ] Vérifier l'ouverture du modal avec liste de documents
- [ ] Sélectionner 2 documents
- [ ] Cliquer "Lancer l'analyse"
- [ ] Observer le progress tracking : "Analyse 1/2", "Analyse 2/2"
- [ ] Vérifier le délai de 4 secondes entre les 2 analyses
- [ ] Vérifier l'affichage des résultats (filename, description, tags, folder)

#### Test 2.2 : Application des suggestions
- [ ] Après l'analyse, cliquer "Appliquer les suggestions" sur un document
- [ ] Vérifier la mise à jour dans la bibliothèque :
  - [ ] Nouveau nom de fichier
  - [ ] Description mise à jour
  - [ ] Tags ajoutés
  - [ ] Dossier assigné

#### Test 2.3 : Gestion d'erreurs (document vide ou illisible)
- [ ] Uploader un PDF quasiment vide (1 page blanche)
- [ ] Lancer l'analyse batch sur ce document
- [ ] Vérifier le message d'erreur : "Pas de contenu analysable"

#### Test 2.4 : Rate Limiting (5+ documents)
- [ ] Sélectionner 5 documents ou plus
- [ ] Lancer l'analyse
- [ ] **Mesurer le temps total** : Devrait être ~20 secondes (5 docs × 4s)
- [ ] Vérifier qu'aucune erreur de rate limit ne survient

---

### 3. 📄 Options de Split de Pages (UI seulement)

**Localisation :** 
- Onglet "Bibliothèque" → Section Upload
- Onglet "Convertisseur"

**Ce qui a été implémenté (UI uniquement) :**
- ✅ Radio buttons : "Pages simples" vs "Pages doubles"
- ✅ Checkbox conditionnelle : "Supprimer partie gauche 1ère page"
- ✅ Fonction `toggleSplitOptions()` et `toggleUploadSplitOptions()`

**⚠️ LOGIQUE NON IMPLÉMENTÉE** : Les options sont visibles mais non fonctionnelles

**Tests à effectuer (UI uniquement) :**

#### Test 3.1 : Affichage des options (Upload)
- [ ] Aller dans l'onglet Bibliothèque → Upload
- [ ] Vérifier la présence de :
  - [ ] Radio "📄 Pages simples" (cochée par défaut)
  - [ ] Radio "📖 Pages doubles"
- [ ] Cocher "Pages doubles"
- [ ] Vérifier l'apparition de la checkbox "✂️ Supprimer partie gauche 1ère page"

#### Test 3.2 : Affichage des options (Convertisseur)
- [ ] Aller dans l'onglet Convertisseur
- [ ] Vérifier la même interface de split
- [ ] Tester le toggle (cocher "Pages doubles" → checkbox apparaît)

---

## 📊 Résultats Attendus

### Backend
- ✅ Route `/api/admin/batch-upload` fonctionnelle
- ✅ Route `/api/admin/batch-analyze` fonctionnelle
- ✅ Rate limiting Gemini respecté (4s entre requêtes)
- ✅ Gestion d'erreurs individualisée par fichier

### Frontend
- ✅ Upload multiple avec prévisualisation
- ✅ Modal batch analyze avec sélection multiple
- ✅ Progress tracking temps réel
- ✅ Application des suggestions IA
- ✅ UI split options (non fonctionnelle côté logique)

---

## 🐛 Bugs Potentiels à Surveiller

### Upload Batch
- [ ] Mémoire : Problème avec upload de 10+ gros PDFs (>5MB chacun) ?
- [ ] Race conditions : Tous les fichiers bien enregistrés en DB ?
- [ ] UI : Prévisualisation disparaît après upload ?

### Batch AI
- [ ] Gemini API : Erreur 429 (Too Many Requests) si délai insuffisant ?
- [ ] Extraction PDF : Documents scannés mal extraits ?
- [ ] Modal : Ne se ferme pas correctement après analyse ?
- [ ] Progress bar : Reste bloquée à X% ?

### Split Options
- [ ] Toggle : Checkbox ne s'affiche/disparaît pas correctement ?
- [ ] État : Radio sélection non conservée après refresh ?

---

## 📝 Notes de Test

**Environnement :**
- Service : PM2 (webapp, id=0, online)
- Port : 3000
- Status : ✅ Online (uptime 12m, 9 restarts)

**Configuration AI :**
- Modèle : Gemini 2.5 Flash
- Rate Limit : 15 RPM (Requests Per Minute)
- Délai inter-requêtes : 4 secondes

**Fichiers Modifiés :**
- `src/index.tsx` : Routes batch ajoutées (lignes 303, 2896)
- `public/static/admin.js` : UI batch + split options
- `public/static/pdf-converter.js` : ⚠️ Logique split NON implémentée

---

## ✅ Checklist Finale

Après tests réussis :
- [ ] Commit les changements avec message détaillé
- [ ] Mettre à jour le README.md (section "Fonctionnalités")
- [ ] Implémenter la logique de split conditionnelle
- [ ] Tester avec les 2 PDFs exemples fournis
- [ ] Push vers GitHub
- [ ] Deploy vers Cloudflare Pages

---

**Instructions pour Florent :**

1. **Ouvre l'application** : https://3000-ibxnbzmjo6elbal3asaap-5634da27.sandbox.novita.ai
2. **Teste dans l'ordre** : Upload batch → Batch AI → UI Split
3. **Note les bugs** dans ce fichier (section "Bugs Potentiels")
4. **Donne-moi ton feedback** : Qu'est-ce qui fonctionne ? Qu'est-ce qui ne marche pas ?

Ensuite, on pourra passer à l'implémentation de la logique de split conditionnelle ! 🚀
