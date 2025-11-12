# ✅ Checklist Rapide de Test - Fonctionnalités Batch

**URL App :** https://3000-ibxnbzmjo6elbal3asaap-5634da27.sandbox.novita.ai

---

## 🎯 Test Rapide (5 minutes)

### 1. Upload Batch (2 min)
```
Onglet : Bibliothèque
Action :
  1. Cliquer sur le bouton "Parcourir" (upload)
  2. Sélectionner 3 PDFs (CTRL+clic ou SHIFT+clic)
  3. ✅ VÉRIFIER : Prévisualisation affichée avec 3 fichiers
  4. Cliquer "Uploader"
  5. ✅ VÉRIFIER : Message "✅ 3 fichiers uploadés"
  6. ✅ VÉRIFIER : Les 3 PDFs apparaissent dans la bibliothèque
```

### 2. Batch AI Analysis (2 min)
```
Onglet : Bibliothèque
Action :
  1. Cliquer bouton "🤖 Analyse IA par Lot"
  2. ✅ VÉRIFIER : Modal s'ouvre avec liste de documents
  3. Cocher 2 documents
  4. Cliquer "Lancer l'analyse"
  5. ✅ VÉRIFIER : Progress "Préparation 1/2", "Préparation 2/2"
  6. ✅ VÉRIFIER : Progress "Analyse 1/2" (4s pause), "Analyse 2/2"
  7. ✅ VÉRIFIER : Résultats affichés avec suggestions
  8. Cliquer "Appliquer les suggestions" sur 1 doc
  9. ✅ VÉRIFIER : Document mis à jour dans la liste
```

### 3. UI Split Options (1 min)
```
Onglet : Bibliothèque → Upload
Action :
  1. Scroller jusqu'à "Format des pages PDF"
  2. ✅ VÉRIFIER : "📄 Pages simples" coché par défaut
  3. Cocher "📖 Pages doubles"
  4. ✅ VÉRIFIER : Checkbox "✂️ Supprimer partie gauche" apparaît
  5. Décocher "Pages doubles"
  6. ✅ VÉRIFIER : Checkbox disparaît

Onglet : Convertisseur
Action :
  1. Même test que ci-dessus
  2. ✅ VÉRIFIER : Toggle fonctionne identiquement
```

---

## 🐛 Bugs à Reporter

Si tu rencontres un problème, note ici :

```
[ ] Bug 1 : _____________________________________________
    Étapes : 
    Erreur : 
    
[ ] Bug 2 : _____________________________________________
    Étapes : 
    Erreur : 
```

---

## ✅ Test Complet

Une fois les tests rapides OK :
- Ouvrir `BATCH_TEST_PLAN.md` pour tests détaillés
- Lire `BATCH_FEATURES_SUMMARY.md` pour comprendre l'implémentation

---

**Feedback attendu :**
1. Est-ce que tout fonctionne comme attendu ?
2. Y a-t-il des bugs ou comportements inattendus ?
3. L'UX est-elle claire et intuitive ?

**Ensuite :** On implémentera la logique de split conditionnelle ! 🚀
