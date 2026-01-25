# 21 Booster - Application de Collection de Cartes

Bienvenue sur le projet **21 Booster**. Cette application est une plateforme de jeu de cartes à collectionner (TCG) développée avec **Vue 3**, **Vuetify** et **Firebase**. Elle permet aux utilisateurs d'ouvrir des boosters, de compléter leurs collections, de débloquer des succès et d'accéder à des statistiques détaillées.

## 📋 Fonctionnalités

- **Système de Boosters** : Ouverture de paquets de cartes avec animations.
- **Gestion de Collection** : Visualisation des cartes obtenues, tri et filtres.
- **Boutique** : Achat de boosters (fictif ou réel selon configuration).
- **Succès** : Système de progression et de récompenses (Achievements).
- **Statistiques** : Suivi de la progression de la collection.
- **Administration** : Interface de configuration pour les cartes, boosters et utilisateurs.

## 🚀 Installation

Suivez ces étapes pour installer et lancer le projet localement.

### Prérequis

- [Node.js](https://nodejs.org/) (version recommandée : LTS aka 18+)
- Un projet [Firebase](https://console.firebase.google.com/) configuré.

### 1. Cloner le projet

```bash
git clone https://github.com/pierreBocquillon/21Booster.git
cd 21TCG
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration Firebase

Le fichier de configuration Firebase n'est pas inclus dans le dépôt pour des raisons de sécurité. Vous devez le créer manuellement.

1.  Créez un fichier `firebase.js` dans le dossier `src/config/`.
2.  Ajoutez-y votre configuration Firebase (récupérée depuis la console Firebase) :

```javascript
// src/config/firebase.js
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_PROJECT_ID.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID",
    measurementId: "VOTRE_MEASUREMENT_ID"
}

export default firebaseConfig
```

### 4. Configuration des Assets (⚠️ Important)

**Les assets (images des cartes, illustrations des boosters, icônes, etc.) ne sont pas fournis avec ce dépôt.**

Pour que l'application s'affiche correctement, vous devez ajouter vos propres images dans le dossier `public/`. Voici la structure attendue :

-   `public/cards/` : Images des cartes (format recommandé : `.png` ou `.jpg`).
-   `public/boosters/` : Illustrations des paquets de boosters.
-   `public/collections_card/` : Images pour les miniatures de collections.
-   `public/achievements/` : Icônes des succès.
-   `public/nav/` : Icônes de navigation.

Un script (`scripts/generate-file-list.js`) est exécuté au lancement pour indexer automatiquement les fichiers présents dans ces dossiers.

## 🛠️ Commandes disponibles

### Lancer le serveur de développement
Compile l'application et la recharge à chaud lors des modifications.

```bash
npm run serve
```

### Compiler pour la production
Minifie le code et prépare les fichiers pour le déploiement dans le dossier `dist/`.

```bash
npm run build
```

### Déployer sur Firebase Hosting
Compile l'application et la déploie directement sur Firebase (nécessite d'être authentifié via `firebase login`).

```bash
npm run deploy
```