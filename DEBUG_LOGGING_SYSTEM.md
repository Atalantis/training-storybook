# 🔍 Système de Logs de Debug

**Date :** 2025-01-12  
**Version :** 1.2.0-dev-debug  
**Status :** ✅ Activé

---

## 🎯 Objectif

Système de logging complet pour tracer précisément chaque étape des fonctionnalités en développement (batch upload, batch analyze, extraction PDF, etc.).

**Permet de :**
- 🔍 Identifier où le code bloque exactement
- ⏱️ Mesurer les performances de chaque opération
- 🐛 Debugger efficacement sans DevTools
- 📊 Analyser les goulots d'étranglement

**Nota :** Ces logs seront **supprimés en production** une fois le développement stabilisé.

---

## 🛠️ API du Système DEBUG

### Objet Global `window.DEBUG`

Disponible partout dans `admin.js` et accessible depuis la console navigateur.

### Méthodes Disponibles

#### 1. Logs Standard

```javascript
DEBUG.info('CATEGORY', 'message', optionalData);
DEBUG.success('CATEGORY', 'message', optionalData);
DEBUG.warn('CATEGORY', 'message', optionalData);
DEBUG.error('CATEGORY', 'message', optionalData);
DEBUG.debug('CATEGORY', 'message', optionalData);
```

**Exemple :**
```javascript
DEBUG.info('UPLOAD', 'Starting upload process', { fileCount: 3 });
// Console: 🔵 [12:34:56] [UPLOAD] Starting upload process {fileCount: 3}
```

#### 2. Logs de Performance

```javascript
DEBUG.perf('CATEGORY', 'operationName', durationMs);
```

**Exemple :**
```javascript
const startTime = performance.now();
// ... opération ...
const duration = performance.now() - startTime;
DEBUG.perf('PDF-EXTRACT', 'document.pdf', Math.round(duration));
// Console: ⏱️ [12:34:56] [PDF-EXTRACT] document.pdf completed in 1234ms
```

#### 3. Timers (mesure automatique)

```javascript
DEBUG.startTimer('LABEL');
// ... opération longue ...
DEBUG.endTimer('LABEL');
```

**Exemple :**
```javascript
DEBUG.startTimer('BATCH-UPLOAD-API');
await fetch('/api/admin/batch-upload', { ... });
DEBUG.endTimer('BATCH-UPLOAD-API');
// Console: BATCH-UPLOAD-API: 2345.67ms
```

#### 4. Groupes (hiérarchie visuelle)

```javascript
DEBUG.group('TITLE');
// ... logs imbriqués ...
DEBUG.groupEnd();
```

**Exemple :**
```javascript
DEBUG.group('📤 UPLOAD PROCESS');
DEBUG.info('UPLOAD', 'Files selected: 3');
DEBUG.success('UPLOAD', 'Upload completed');
DEBUG.groupEnd();
// Console affiche un groupe déroulant
```

---

## 📊 Catégories de Logs Implémentées

### UPLOAD
- Selection de fichiers
- Détection mode batch vs single
- Création FormData
- Appels API upload

### BATCH-UPLOAD
- Préparation FormData avec multiples fichiers
- Appels API `/api/admin/batch-upload`
- Mise à jour métadonnées par fichier
- Résumé succès/échecs

### PDF-EXTRACT
- Lecture ArrayBuffer
- Chargement PDF avec PDF.js
- Extraction texte page par page
- Rendering image de preview
- Détection PDF scanné
- OCR (si nécessaire)

### PDF-EXTRACT-OCR
- Lancement Tesseract
- Progression OCR par page
- Temps d'extraction OCR

### BATCH-ANALYZE
- Sélection documents
- Phase extraction (boucle sur tous les documents)
- Téléchargement PDF depuis R2
- Extraction contenu pour chaque doc
- Phase analyse IA (appel API)
- Traitement résultats

---

## 🔍 Exemple de Sortie Console

### Upload Batch

```
📤 UPLOAD PROCESS
  🔵 [12:34:56] [UPLOAD] Files selected: 3
    0: {name: "doc1.pdf", size: 1234567, type: "application/pdf"}
    1: {name: "doc2.pdf", size: 2345678, type: "application/pdf"}
    2: {name: "doc3.pdf", size: 3456789, type: "application/pdf"}
  🔵 [12:34:56] [UPLOAD] Upload mode: BATCH
  🔵 [12:34:57] [BATCH-UPLOAD] Starting batch upload process
  🔍 [12:34:57] [BATCH-UPLOAD] Adding file to FormData: doc1.pdf (1.18 MB)
  🔍 [12:34:57] [BATCH-UPLOAD] Adding file to FormData: doc2.pdf (2.24 MB)
  🔍 [12:34:57] [BATCH-UPLOAD] Adding file to FormData: doc3.pdf (3.29 MB)
  🔵 [12:34:57] [BATCH-UPLOAD] FormData prepared with 3 files
  BATCH-UPLOAD-API: 1234.56ms
  🔵 [12:34:58] [BATCH-UPLOAD] API response status: 200
  🔵 [12:34:58] [BATCH-UPLOAD] API response data {success: true, uploaded: 3, ...}
  ✅ [12:34:58] [BATCH-UPLOAD] Upload completed in 1234ms
  🔵 [12:34:58] [BATCH-UPLOAD] Results: 3 uploaded, 0 failed
```

### Extraction PDF

```
📄 EXTRACT PDF: document.pdf
  🔵 [12:35:00] [PDF-EXTRACT] Mode: BATCH (fast)
  🔵 [12:35:00] [PDF-EXTRACT] File size: 2.24 MB
  PDF-EXTRACT-arrayBuffer: 45.67ms
  🔍 [12:35:00] [PDF-EXTRACT] ArrayBuffer size: 2.24 MB
  PDF-EXTRACT-getDocument: 123.45ms
  🔵 [12:35:00] [PDF-EXTRACT] Total pages: 45
  🔵 [12:35:00] [PDF-EXTRACT] ⚡ BATCH MODE: 1 page, no OCR
  PDF-EXTRACT-text: 89.01ms
  🔍 [12:35:00] [PDF-EXTRACT] Page 1 text extracted in 89ms (1234 chars)
  🔵 [12:35:00] [PDF-EXTRACT] Total text extracted: 1234 characters
  PDF-EXTRACT-image: 234.56ms
  🔍 [12:35:00] [PDF-EXTRACT] Rendering image at scale 1.0 (800x1131)
  🔵 [12:35:01] [PDF-EXTRACT] Image size: 45.67 KB (quality: 0.5)
  🔵 [12:35:01] [PDF-EXTRACT] Text length: 1234 chars, isScanned: false
  🔵 [12:35:01] [PDF-EXTRACT] Final text length: 1234 chars (trimmed from 1234)
  ⏱️ [12:35:01] [PDF-EXTRACT] document.pdf completed in 456ms
  ✅ [12:35:01] [PDF-EXTRACT] Extraction completed in 456ms
```

### Batch Analyze

```
🤖 BATCH ANALYZE
  🔵 [12:35:05] [BATCH-ANALYZE] Documents selected: 3
  🔵 [12:35:05] [BATCH-ANALYZE] [1/3] Processing: doc1.pdf
  BATCH-download-0: 567.89ms
  ⏱️ [12:35:06] [BATCH-ANALYZE] Download doc1.pdf completed in 568ms
  📄 EXTRACT PDF: doc1.pdf
    ... (logs extraction détaillés) ...
  ⏱️ [12:35:06] [BATCH-ANALYZE] Extract doc1.pdf completed in 456ms
  🔵 [12:35:06] [BATCH-ANALYZE] [2/3] Processing: doc2.pdf
  ... (idem pour doc2 et doc3) ...
  BATCH-ANALYZE-extraction-phase: 2345.67ms
  ⏱️ [12:35:08] [BATCH-ANALYZE] Extraction phase completed in 2346ms
  🔵 [12:35:08] [BATCH-ANALYZE] Sending to AI API
    documentsCount: 3
    totalTextLength: 3702
  BATCH-ANALYZE-ai-phase: 12345.67ms
  ⏱️ [12:35:20] [BATCH-ANALYZE] AI analysis phase completed in 12346ms
  🔵 [12:35:20] [BATCH-ANALYZE] AI response {success: true, analyzed: 3, ...}
  ✅ [12:35:20] [BATCH-ANALYZE] Analysis completed: 3 success, 0 failed
  ⏱️ [12:35:20] [BATCH-ANALYZE] Total batch process completed in 14691ms
  ✅ [12:35:20] [BATCH-ANALYZE] Batch analysis completed in 14691ms
```

---

## 🧪 Comment Utiliser les Logs pour Debugger

### 1. Ouvre la Console DevTools

**Chrome/Edge :** `F12` → Onglet "Console"  
**Firefox :** `F12` → Onglet "Console"

### 2. Reproduis le Bug

Lance l'opération qui bloque (ex: batch analyze avec 3 documents)

### 3. Analyse les Logs

**Cherche les patterns :**

```
❌ Erreur (rouge) : Échec critique
⚠️  Warning (jaune) : Comportement inhabituel
⏱️  Performance : Temps anormalement long
🔍 Debug : Détails techniques
```

**Questions à se poser :**

1. **Où ça bloque ?**
   - Dernier log avant blocage ?
   - Timer qui ne finit jamais ?

2. **Combien de temps ça prend ?**
   - Extraction : Devrait être ~500ms/doc en batch
   - Download : Devrait être <1s/doc
   - AI API : Devrait être ~4s/doc + rate limiting

3. **Quelles sont les données ?**
   - Tailles de fichiers anormalement grandes ?
   - Texte extrait vide (PDF scanné) ?
   - Nombre de pages élevé ?

### 4. Partage les Logs

**Copie-colle la sortie console** complète dans le feedback :

```
Clic droit sur les logs → "Save as..." → Envoie le fichier
Ou
Sélectionne les logs → Copie → Colle dans un fichier texte
```

---

## 🎛️ Activation/Désactivation

### Désactiver les Logs (production)

Dans `admin.js`, ligne ~10 :

```javascript
const DEBUG = {
    enabled: false,  // ← Change true en false
    // ...
};
```

### Activer/Désactiver depuis Console

```javascript
// Désactiver temporairement
DEBUG.enabled = false;

// Réactiver
DEBUG.enabled = true;
```

---

## 📊 Temps de Référence Attendus

### Extraction PDF (mode batch)

| Pages | Temps Normal | Temps Slow | Action si Slow |
|-------|--------------|------------|----------------|
| 1-10  | 200-500ms | >1s | PDF trop lourd, compresser |
| 11-50 | 500-800ms | >2s | Idem |
| 51+   | 800-1000ms | >3s | Idem |

### Download depuis R2

| Taille | Temps Normal | Temps Slow | Action si Slow |
|--------|--------------|------------|----------------|
| <1MB   | 100-300ms | >1s | Connexion lente |
| 1-5MB  | 300-800ms | >2s | Idem |
| 5-10MB | 800-1500ms | >3s | Fichier trop lourd |

### AI Analysis (Gemini 2.5 Flash)

| Opération | Temps Normal | Note |
|-----------|--------------|------|
| 1 document | 1-3s | API rapide |
| Rate limiting | 4s | Délai imposé entre requêtes |
| 3 documents | ~12s | 3 × 4s |

---

## 🐛 Scénarios de Debug Typiques

### Scénario 1 : "Ça bloque pendant l'extraction"

**Logs à chercher :**
```
📄 EXTRACT PDF: document.pdf
  🔵 [PDF-EXTRACT] Mode: BATCH (fast)
  PDF-EXTRACT-arrayBuffer: 45.67ms
  PDF-EXTRACT-getDocument: 123.45ms
  🔵 [PDF-EXTRACT] Total pages: 450  ← ATTENTION : Trop de pages !
  PDF-EXTRACT-text: ???  ← Timer ne finit jamais
```

**Diagnostic :** PDF trop volumineux (450 pages), extraction bloque malgré mode batch

**Solution :** Réduire encore plus l'extraction (ex: 0.5 page, qualité 0.3)

---

### Scénario 2 : "Download très lent"

**Logs à chercher :**
```
BATCH-download-0: 5678.90ms  ← ATTENTION : >5 secondes !
⏱️ [BATCH-ANALYZE] Download doc1.pdf completed in 5679ms
```

**Diagnostic :** Connexion R2 lente ou fichier trop gros

**Solution :** Compresser les PDFs avant upload

---

### Scénario 3 : "AI API timeout"

**Logs à chercher :**
```
🔵 [BATCH-ANALYZE] Sending to AI API
BATCH-ANALYZE-ai-phase: 60000.00ms  ← ATTENTION : 60 secondes !
❌ [BATCH-ANALYZE] Batch analyze error after 60000ms
```

**Diagnostic :** Gemini API timeout (>30s par défaut)

**Solution :** Réduire nombre de documents ou texte envoyé

---

## 🔮 Prochaines Améliorations

### V1.3 (après stabilisation)
- ❌ **Supprimer les logs de debug** (mettre `enabled: false`)
- ✅ **Garder uniquement les logs d'erreur critiques**
- 📊 **Ajouter monitoring performance en production** (temps moyens)

### Logs à Conserver en Production
```javascript
// Erreurs critiques uniquement
console.error('Critical upload error:', error);
console.error('Critical API error:', error);
```

---

## 📞 Comment Reporter un Bug avec les Logs

**Format idéal :**

```
BUG : Batch analyze bloque après 2 documents

ÉTAPES :
1. Sélectionne 3 documents (10, 25, 50 pages)
2. Clique "Lancer l'analyse"
3. Bloque après extraction du 2ème document

LOGS CONSOLE :
[Copie-colle complète des logs depuis le début jusqu'au blocage]

TEMPS OBSERVÉS :
- Download doc1 : 234ms ✅
- Extract doc1 : 456ms ✅
- Download doc2 : 345ms ✅
- Extract doc2 : 5678ms ❌ SLOW
- Download doc3 : N/A (jamais atteint)

DIAGNOSTIC HYPOTHÈSE :
Doc2 a 250 pages, extraction prend trop de temps même en batch mode
```

---

**🎯 Les logs sont maintenant actifs ! Teste le batch analyze et envoie-moi les logs complets de la console ! 📊**
