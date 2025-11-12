# 🗜️ Système de Compression PDF Automatique

**Date :** 2025-01-12  
**Version :** 1.2.0-dev-compress  
**Status :** ✅ Activé

---

## 🎯 Objectif

Compresser automatiquement les PDFs volumineux (>10 MB) AVANT l'upload pour :
- ✅ Réduire la bande passante upload (80-95%)
- ✅ Accélérer les opérations (upload, extraction, affichage)
- ✅ Économiser l'espace R2 Cloudflare
- ✅ Améliorer l'expérience utilisateur
- ✅ Permettre le batch upload de gros fichiers

---

## 🏗️ Architecture

### Compression Côté Client (Frontend)

**Pourquoi côté client ?**
- Cloudflare Workers ne supporte pas les binaires (ghostscript, imagemagick)
- Réduit immédiatement la bande passante upload
- Utilise `pdf.js` + `pdf-lib` déjà chargés
- Aucune charge serveur

### Workflow

```
1. Utilisateur sélectionne PDF (147 MB)
   ↓
2. JavaScript détecte taille > 10 MB
   ↓
3. Compression automatique:
   - Render avec pdf.js @ 150 DPI
   - Convert to JPEG quality 0.8
   - Rebuild PDF avec pdf-lib
   ↓
4. Nouveau PDF compressé (~15 MB)
   ↓
5. Upload du fichier compressé
   ↓
6. Stockage R2
```

---

## 🛠️ Implémentation Technique

### Fonction Principale : `compressPDF()`

**Signature :**
```javascript
async function compressPDF(file, progressCallback = null)
```

**Paramètres :**
- `file`: File object (PDF original)
- `progressCallback`: Function(message, percent) - optionnel

**Retour :**
```javascript
{
    compressedFile: File,      // Nouveau PDF compressé
    originalSize: number,      // Taille originale (bytes)
    compressedSize: number,    // Taille compressée (bytes)
    compressionRatio: number,  // % de réduction
    error: string              // Message d'erreur (si échec)
}
```

### Algorithme

```javascript
1. Charger PDF avec pdf.js
2. Créer nouveau PDF avec pdf-lib
3. Pour chaque page:
   a. Render page à 150 DPI (scale 1.5)
   b. Canvas → JPEG quality 0.8
   c. Embed JPEG dans nouvelle page PDF
4. Sauvegarder nouveau PDF
5. Retourner File compressé
```

### Paramètres de Compression

| Paramètre | Valeur | Justification |
|-----------|--------|---------------|
| **Résolution** | 150 DPI | Parfait pour affichage web (vs 300 DPI print) |
| **Scale** | 1.5 | Équivalent 150 DPI |
| **Format image** | JPEG | Meilleur ratio taille/qualité pour photos |
| **Qualité JPEG** | 0.8 | Balance optimale qualité/taille |
| **Seuil compression** | 10 MB | Fichiers < 10 MB = pas de compression |

---

## 📊 Performances Attendues

### Gains de Compression

| Type PDF | Taille Originale | Taille Compressée | Ratio |
|----------|------------------|-------------------|-------|
| Storybook (images 300 DPI) | 147 MB | ~15 MB | **90%** |
| Présentation PowerPoint | 75 MB | ~8 MB | **89%** |
| Scan haute résolution | 80 MB | ~10 MB | **87%** |
| PDF bureautique texte | 5 MB | 5 MB | **0%** (pas compressé) |

### Temps de Traitement

| Pages | Temps Compression | Temps Upload (avant) | Temps Upload (après) | Gain Total |
|-------|-------------------|----------------------|----------------------|------------|
| 10 | ~5s | ~60s (147 MB) | ~6s (15 MB) | **49s** |
| 20 | ~10s | ~60s | ~6s | **44s** |
| 50 | ~25s | ~60s | ~6s | **29s** |

**Note :** Temps upload calculés pour 20 Mbps upload (moyenne France)

---

## 🔍 Intégration dans le Workflow

### Single Upload

```javascript
// Dans handleUpload() - Single file
let file = files[0];

if (shouldCompressPDF(file)) {  // > 10 MB ?
    // Show compression progress UI
    progressDiv.innerHTML = `Compression en cours...`;
    
    const { compressedFile, compressionRatio } = await compressPDF(
        file, 
        (message, percent) => {
            statusSpan.textContent = message;
        }
    );
    
    file = compressedFile;  // Use compressed file
    
    // Show compression results
    detailsDiv.innerHTML = `✅ Compressed: -${compressionRatio}%`;
}

// Upload (compressed) file
formData.append('file', file);
await fetch('/api/admin/upload', { body: formData });
```

### Batch Upload

```javascript
// Dans handleUpload() - Batch
const processedFiles = [];

for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (shouldCompressPDF(file)) {
        statusSpan.textContent = `Compression ${i+1}/${files.length}...`;
        
        const { compressedFile } = await compressPDF(file, progressCallback);
        processedFiles.push(compressedFile);
    } else {
        processedFiles.push(file);
    }
}

// Upload processed (compressed) files
processedFiles.forEach(f => formData.append('files', f));
await fetch('/api/admin/batch-upload', { body: formData });
```

---

## 🎨 UI/UX

### Messages de Progress

```
📖 Chargement du PDF...             (5%)
🗜️ Page 1/10...                     (15%)
🗜️ Page 5/10...                     (55%)
🗜️ Page 10/10...                    (95%)
💾 Finalisation...                   (95%)
✅ Compression terminée !            (100%)
```

### Affichage Résultats

**Single upload :**
```
🗜️ Fichier volumineux détecté (147.76 MB)
✅ Compression terminée: 147.76 MB → 15.23 MB (-89.7%)
💾 Économisé: 132.53 MB
```

**Batch upload :**
```
🗜️ Compression: fichier1.pdf (147.76 MB)
✅ fichier1.pdf: 147.76 MB → 15.23 MB (-89.7%)
✓ fichier2.pdf: 2.45 MB (aucune compression nécessaire)
🗜️ Compression: fichier3.pdf (80.64 MB)
✅ fichier3.pdf: 80.64 MB → 9.12 MB (-88.7%)
💾 Espace économisé: 219.05 MB
```

---

## 🔍 Logs de Debug

### Console Output

```javascript
🗜️ COMPRESS PDF: document.pdf
  🔵 [PDF-COMPRESS] Original size: 147.76 MB
  PDF-COMPRESS-load-pdfjsLib: 234.56ms
  🔵 [PDF-COMPRESS] Pages: 10
  PDF-COMPRESS-create-new-pdf: 12.34ms
  PDF-COMPRESS-process-pages: 4567.89ms
  🔍 [PDF-COMPRESS] Page 1: 2480x3508
  🔍 [PDF-COMPRESS] Page 2: 2480x3508
  ...
  PDF-COMPRESS-save: 890.12ms
  ⏱️ [PDF-COMPRESS] document.pdf completed in 5704ms
  ✅ [PDF-COMPRESS] Compressed: 147.76 MB → 15.23 MB (-89.7%)
```

---

## ⚙️ Configuration

### Seuil de Compression

**Actuel :** 10 MB

**Modifier :** Dans `shouldCompressPDF()`
```javascript
function shouldCompressPDF(file) {
    const threshold = 10 * 1024 * 1024;  // 10 MB
    return file.size > threshold;
}
```

**Recommandations :**
- **5 MB** : Plus agressif, compresse plus de fichiers
- **10 MB** : Balance optimal (défaut)
- **20 MB** : Moins agressif, garde plus de fichiers originaux

### Qualité JPEG

**Actuelle :** 0.8 (80%)

**Modifier :** Dans `compressPDF()`, ligne ~canvas.toDataURL
```javascript
const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.8);
//                                                   ^^^
//                                                  0.5 - 1.0
```

**Recommandations :**
- **0.7** : Plus de compression, qualité légèrement réduite
- **0.8** : Balance optimal (défaut)
- **0.9** : Moins de compression, meilleure qualité

### Résolution (DPI)

**Actuelle :** 150 DPI (scale 1.5)

**Modifier :** Dans `compressPDF()`, ligne ~const scale
```javascript
const scale = 1.5;  // 150 DPI
//            ^^^
//            1.0 = 100 DPI
//            1.5 = 150 DPI (défaut)
//            2.0 = 200 DPI
```

**Recommandations :**
- **1.0** : Max compression, qualité réduite
- **1.5** : Balance optimal (défaut)
- **2.0** : Moins de compression, meilleure qualité

---

## 🐛 Gestion d'Erreurs

### Fallback Automatique

Si la compression échoue :
```javascript
catch (error) {
    DEBUG.error('PDF-COMPRESS', 'Compression failed', error);
    
    // Return original file
    return {
        compressedFile: file,  // Original, non compressé
        compressionRatio: 0,
        error: error.message
    };
}
```

### Scénarios d'Échec

1. **PDF corrompu** : Retourne original
2. **Mémoire insuffisante** : Retourne original
3. **PDF protégé** : Retourne original
4. **Timeout** : Retourne original (après 30s)

**→ L'upload continue toujours, même en cas d'échec de compression**

---

## 📊 Monitoring

### Métriques à Surveiller

```javascript
// Dans les logs
DEBUG.perf('PDF-COMPRESS', filename, duration);
DEBUG.success('PDF-COMPRESS', `Ratio: -${compressionRatio}%`);
```

**Indicateurs de santé :**
- ✅ **Temps < 10s** pour 10 pages : Normal
- ⚠️ **Temps 10-30s** : Acceptable
- ❌ **Temps > 30s** : Problème (PDF trop gros ou complexe)

**Ratios typiques :**
- ✅ **80-95%** : Storybooks, présentations (images)
- ⚠️ **50-80%** : PDFs mixtes
- ❌ **< 50%** : PDFs déjà compressés ou texte pur

---

## 🔮 Améliorations Futures

### V1.3

1. **Compression adaptative**
   - Analyser contenu PDF (texte vs images)
   - Ajuster qualité selon type

2. **Compression différée**
   - Uploader original d'abord
   - Compresser en background
   - Remplacer version R2

3. **Options utilisateur**
   - Checkbox "Compresser" (opt-in/opt-out)
   - Slider qualité

4. **Worker backend**
   - Utiliser Cloudflare Durable Objects
   - Compression serveur pour très gros fichiers

---

## ✅ Checklist d'Utilisation

### Pour Tester

- [ ] Sélectionne un PDF > 10 MB
- [ ] Upload (single ou batch)
- [ ] Observe la compression dans l'UI
- [ ] Vérifie les logs console (F12)
- [ ] Confirme la réduction de taille
- [ ] Vérifie la qualité du PDF uploadé

### Résultat Attendu

**Avant :**
- Upload 147 MB en ~60 secondes
- Extraction PDF lente (>10s)
- Affichage page lent

**Après :**
- Compression 147→15 MB en ~5s
- Upload 15 MB en ~6s
- **Total : ~11s** (vs 60s avant) ✅
- Extraction rapide (<2s)
- Affichage instantané

---

**🎯 La compression est maintenant ACTIVE ! Teste avec tes 4 gros PDFs ! 🚀**
