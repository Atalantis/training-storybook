# 🚀 START HERE - Guide de Test Rapide

**Pour :** Florent  
**Objectif :** Tester les nouvelles fonctionnalités batch  
**Durée :** 10 minutes

---

## 📍 Étape 1 : Connexion (30 secondes)

1. **Ouvre cette URL :**
   ```
   https://3000-ibxnbzmjo6elbal3asaap-5634da27.sandbox.novita.ai
   ```

2. **Clique sur "🔑 Admin"** (en haut à droite)

3. **Entre le mot de passe :**
   ```
   BpYzBbXflUGAiM5cJKcB
   ```

4. **✅ Tu es connecté !** Tu devrais voir 3 onglets : Bibliothèque, Convertisseur, Paramètres

---

## 📍 Étape 2 : Configuration Gemini (2 minutes)

⚠️ **OBLIGATOIRE pour tester l'analyse IA batch**

1. **Va dans l'onglet "⚙️ Paramètres"**

2. **Section "Intelligence Artificielle" :**
   - Coche ✅ "Activer l'analyse IA"
   - Entre ta **clé API Gemini** (ou génère-en une : https://aistudio.google.com/apikey)
   - Clique **"Enregistrer"**

3. **✅ Confirmation affichée** : "Configuration enregistrée"

**Si tu n'as pas de clé API :** Tu peux tester l'upload batch (Étape 3) mais pas l'analyse IA (Étape 4)

---

## 📍 Étape 3 : Test Upload Batch (2 minutes)

1. **Va dans l'onglet "📚 Bibliothèque"**

2. **Section Upload :**
   - Clique sur **"Parcourir"**
   - Sélectionne **3-5 PDFs** (CTRL+clic ou SHIFT+clic)
   - ✅ Vérifie qu'une **prévisualisation** apparaît avec la liste des fichiers

3. **Remplis les champs (optionnel) :**
   - Dossier : `Test Batch`
   - Tags : `test`, `batch` (tape + Enter)

4. **Clique "Uploader"**

5. **✅ Vérifie :**
   - Message de succès : "✅ X fichiers uploadés"
   - Les fichiers apparaissent dans la liste de la bibliothèque

**🐛 Bug trouvé ?** → Note-le et continue

---

## 📍 Étape 4 : Test Analyse IA Batch (3 minutes)

⚠️ **Nécessite l'API Gemini configurée (Étape 2)**

1. **Dans l'onglet "📚 Bibliothèque"**

2. **Clique sur le bouton "🤖 Analyse IA par Lot"**
   - ✅ Un modal s'ouvre avec la liste de tes documents

3. **Coche 2-3 documents** (pas plus pour le premier test)

4. **Clique "Lancer l'analyse"**

5. **Observe le progress :**
   - "Préparation 1/3" → "Préparation 2/3" → "Préparation 3/3"
   - "Analyse 1/3" → **pause de 4 secondes** → "Analyse 2/3" → etc.

6. **✅ Vérifie les résultats :**
   - Chaque document affiche : nom suggéré, description, tags, dossier
   - Clique **"Appliquer les suggestions"** sur un document
   - Le document se met à jour dans la liste

**🐛 Bug trouvé ?** → Note-le et continue

---

## 📍 Étape 5 : Test UI Split Options (2 minutes)

⚠️ **Ces options sont visuelles uniquement (logique pas encore implémentée)**

### Dans l'Upload (Onglet Bibliothèque)

1. **Scrolle** jusqu'à la section "Format des pages PDF"

2. **Vérifie :**
   - ✅ "📄 Pages simples" est coché par défaut
   - ✅ "📖 Pages doubles" est disponible

3. **Coche "📖 Pages doubles"**
   - ✅ Une checkbox apparaît : "✂️ Supprimer partie gauche 1ère page"

4. **Décoche "Pages doubles"**
   - ✅ La checkbox disparaît

### Dans le Convertisseur (Onglet Convertisseur)

1. **Va dans l'onglet "🔄 Convertisseur"**

2. **Même test** que ci-dessus
   - ✅ Toggle fonctionne identiquement

**🐛 Bug trouvé ?** → Note-le

---

## 📍 Étape 6 : Feedback (2 minutes)

### Ce que j'ai besoin de savoir :

**✅ Fonctionnalités qui marchent :**
```
- Upload batch : OK / KO
- Prévisualisation fichiers : OK / KO
- Batch AI analysis : OK / KO (ou "pas testé - pas d'API key")
- Progress tracking : OK / KO
- Application suggestions : OK / KO
- Toggle split options : OK / KO
```

**❌ Bugs trouvés :**
```
Bug 1 : [Description]
  Étapes pour reproduire : 
  Message d'erreur (si applicable) : 

Bug 2 : [Description]
  Étapes pour reproduire : 
  Message d'erreur (si applicable) : 
```

**💡 Suggestions UX :**
```
- [Ex: Le bouton "Analyse IA par Lot" est peu visible]
- [Ex: Prévisualisation trop longue, limiter à 5 fichiers affichés]
```

---

## 📞 Ensuite ?

**Une fois ton feedback reçu :**
1. Je corrige les bugs éventuels
2. J'implémente la logique de split conditionnelle
3. On teste avec tes 2 PDFs exemples
4. Commit + Push + Deploy

---

## 🆘 Problèmes ?

**L'app ne charge pas ?**
```bash
pm2 list  # Vérifie que webapp est "online"
pm2 logs webapp --nostream  # Voir les logs
```

**Mot de passe refusé ?**
→ Copie-colle exactement : `BpYzBbXflUGAiM5cJKcB`

**Analyse IA échoue ?**
→ Vérifie que l'API Gemini est configurée dans Paramètres

**Autre problème ?**
→ Décris-moi exactement ce qui se passe, je t'aide !

---

**🎯 Prêt ? Go test ! 🚀**
