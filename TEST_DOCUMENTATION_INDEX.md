# 📚 Index des Documents de Test

**Version :** 1.2.0-dev  
**Date :** 2025-01-12  
**Status :** Prêt pour tests

---

## 🎯 Par où commencer ?

### Pour un test rapide (10 min) :
👉 **[START_HERE.md](START_HERE.md)** - Guide étape par étape avec credentials

### Pour des tests approfondis (20-30 min) :
👉 **[BATCH_TEST_PLAN.md](BATCH_TEST_PLAN.md)** - Plan de test détaillé avec edge cases

---

## 📁 Liste Complète des Documents

### 1. **START_HERE.md** (4.7 KB) 🎯 ← **COMMENCE ICI**
**Objectif :** Guide de démarrage rapide en 6 étapes
**Contenu :**
- ✅ URL + mot de passe
- ✅ Configuration Gemini
- ✅ Tests upload batch
- ✅ Tests analyse IA batch
- ✅ Tests UI split options
- ✅ Template de feedback

**Quand l'utiliser :** Premier contact avec les nouvelles fonctionnalités

---

### 2. **TEST_CREDENTIALS.md** (2.3 KB) 🔐
**Objectif :** Credentials et accès rapide
**Contenu :**
- URL de l'application
- Mot de passe admin
- Instructions de connexion
- Configuration API Gemini
- Notes de sécurité

**Quand l'utiliser :** Référence rapide pour les credentials

---

### 3. **QUICK_TEST_CHECKLIST.md** (2.3 KB) ✅
**Objectif :** Checklist rapide de validation
**Contenu :**
- Test upload batch (2 min)
- Test batch AI (2 min)
- Test UI split (1 min)
- Espace pour noter les bugs

**Quand l'utiliser :** Validation rapide après corrections de bugs

---

### 4. **BATCH_TEST_PLAN.md** (6.9 KB) 📝
**Objectif :** Plan de test exhaustif
**Contenu :**
- Tests de régression (upload simple)
- Tests upload multiple (3-5, 10+ fichiers)
- Tests avec fichiers invalides
- Tests métadonnées batch
- Tests batch AI (2, 5, 10+ documents)
- Tests rate limiting
- Tests gestion d'erreurs
- Tests UI split options

**Quand l'utiliser :** Tests approfondis avant commit/deploy

---

### 5. **BATCH_FEATURES_SUMMARY.md** (13 KB) 📚
**Objectif :** Documentation technique complète
**Contenu :**
- Architecture backend/frontend
- Code source détaillé avec explications
- Routes API (/api/admin/batch-upload, /api/admin/batch-analyze)
- Fonctions JavaScript (handleFileSelection, startBatchAnalyze, etc.)
- Statistiques d'implémentation
- Prochaines étapes

**Quand l'utiliser :** Comprendre l'implémentation en profondeur

---

## 🔗 Ressources Additionnelles

### Documentation Projet
- **README.md** - Documentation générale du projet
- **SETUP_GUIDE.md** - Guide de setup complet

### Accès Application
- **URL Dev :** https://3000-ibxnbzmjo6elbal3asaap-5634da27.sandbox.novita.ai
- **Mot de passe :** `BpYzBbXflUGAiM5cJKcB`
- **API Gemini :** https://aistudio.google.com/apikey

---

## 📊 Workflow de Test Recommandé

```
1. START_HERE.md
   ↓
   Tests rapides (10 min)
   ↓
2. Feedback initial
   ↓
   Corrections de bugs (si nécessaire)
   ↓
3. BATCH_TEST_PLAN.md
   ↓
   Tests approfondis (20-30 min)
   ↓
4. Feedback détaillé
   ↓
   Implémentation split conditionnelle
   ↓
5. Tests finaux
   ↓
   Commit + Push + Deploy
```

---

## 🐛 Reporting de Bugs

**Format recommandé :**
```
Bug : [Titre court]
Étapes :
  1. [Action 1]
  2. [Action 2]
  3. [Résultat inattendu]
Attendu : [Comportement attendu]
Obtenu : [Comportement observé]
Console : [Messages d'erreur si applicable]
```

**Où reporter :**
- Directement dans la conversation
- Ou dans les fichiers de test (sections "Bugs à Reporter")

---

## ✅ Checklist Avant Deploy

Après tests réussis :
- [ ] Tous les tests du BATCH_TEST_PLAN.md passent
- [ ] Aucun bug bloquant identifié
- [ ] Logique de split conditionnelle implémentée et testée
- [ ] README.md mis à jour (section Fonctionnalités)
- [ ] Commit avec message détaillé
- [ ] Push vers GitHub
- [ ] Deploy vers Cloudflare Pages

---

## 📞 Support

**Problème technique ?**
- Vérifie les logs : `pm2 logs webapp --nostream`
- Vérifie le status : `pm2 list`

**Question sur l'implémentation ?**
- Consulte BATCH_FEATURES_SUMMARY.md
- Demande directement dans la conversation

**Bug trouvé ?**
- Note-le avec détails
- Continue les tests (ne bloque pas sur 1 bug)

---

**🚀 Prêt pour les tests ? Commence par START_HERE.md !**
