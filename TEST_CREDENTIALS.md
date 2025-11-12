# 🔐 Credentials de Test - Training Storybook

**Date :** 2025-01-12  
**Environnement :** Sandbox Development

---

## 🌐 Accès Application

**URL :** https://3000-ibxnbzmjo6elbal3asaap-5634da27.sandbox.novita.ai

---

## 👤 Compte Admin

**Mot de passe :** `BpYzBbXflUGAiM5cJKcB`

### Instructions de Connexion

1. **Ouvre l'URL** ci-dessus
2. **Clique sur** "🔑 Admin" (en haut à droite)
3. **Entre le mot de passe :** `BpYzBbXflUGAiM5cJKcB`
4. **Accès aux onglets :**
   - 📚 **Bibliothèque** : Upload batch + gestion documents
   - 🔄 **Convertisseur** : Conversion PDF (options de split)
   - ⚙️ **Paramètres** : Configuration IA Gemini

---

## 🧪 Tests à Effectuer

Une fois connecté :

### 1. Upload Batch (Onglet Bibliothèque)
- Sélectionne 3-5 PDFs en une fois
- Vérifie la prévisualisation
- Upload et vérifie le résumé

### 2. Analyse IA Batch (Onglet Bibliothèque)
- Clique "🤖 Analyse IA par Lot"
- Sélectionne 2-3 documents
- Lance l'analyse et observe le progress

### 3. Options Split (Onglets Bibliothèque + Convertisseur)
- Teste le toggle "Pages simples" ↔ "Pages doubles"
- Vérifie l'apparition/disparition de la checkbox

---

## 🔑 Configuration API Gemini

⚠️ **IMPORTANT : L'API Gemini doit être configurée avant de tester l'analyse IA batch !**

### Étapes de Configuration

1. **Va dans l'onglet "⚙️ Paramètres"**
2. **Section "Intelligence Artificielle"**
3. **Active** : Coche "Activer l'analyse IA"
4. **API Key Gemini** : Entre ta clé API Gemini 2.5 Flash
   - Si tu n'en as pas : https://aistudio.google.com/apikey
   - C'est gratuit jusqu'à 15 requêtes/minute
5. **Clique "Enregistrer"**

### Vérification
- [ ] API Key Gemini configurée ?
- [ ] Analyse IA activée ?
- [ ] Message de confirmation affiché ?

**Sans cette config, l'analyse IA batch retournera une erreur "Clé API non configurée".**

---

## ⚠️ Note de Sécurité

**Ce mot de passe est pour l'environnement de développement/test uniquement.**

En production sur Cloudflare Pages, le mot de passe est différent et stocké comme secret Cloudflare.

---

## 📞 Support

Si tu rencontres un problème :
1. Note le message d'erreur exact
2. Décris les étapes pour le reproduire
3. Reviens vers moi avec ces infos

---

**Bon test ! 🚀**
