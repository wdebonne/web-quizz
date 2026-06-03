# Guide de contribution

Merci de contribuer à QuizzApp ! Ce guide explique comment mettre en place l'environnement de développement et les conventions à respecter.

---

## Environnement de développement

### Prérequis

- Node.js 20 LTS
- PostgreSQL 15 (ou Docker)
- Git

### Installation

```bash
# 1. Cloner
git clone <url-depot> quizzapp
cd quizzapp

# 2. Backend
cd backend
npm install
cp ../.env.example .env.local
# Éditer .env.local avec vos paramètres locaux

# 3. Frontend
cd ../frontend
npm install
```

### Lancer en développement

**Terminal 1 — Base de données (Docker)**
```bash
docker run -d \
  --name quizz-dev-db \
  -e POSTGRES_DB=quizz \
  -e POSTGRES_USER=quizz \
  -e POSTGRES_PASSWORD=quizz_dev \
  -p 5432:5432 \
  postgres:15-alpine
```

**Terminal 2 — Backend**
```bash
cd backend
# Créer src/.env si pas fait :
# DB_HOST=localhost, DB_PASSWORD=quizz_dev, JWT_SECRET=dev_secret_32chars...
npm run dev
# → http://localhost:3000
```

**Terminal 3 — Frontend**
```bash
cd frontend
npm run dev
# → http://localhost:5173 (proxy → backend :3000)
```

---

## Conventions de code

### Nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Fichiers React | PascalCase | `GameLobby.jsx` |
| Fichiers JS utilitaires | camelCase | `gameHandler.js` |
| Composants React | PascalCase | `function ChatPanel()` |
| Hooks React | camelCase avec `use` | `useAuth()` |
| Variables/fonctions | camelCase | `handleSendMessage` |
| Constantes | SCREAMING_SNAKE | `BONUS_TYPES` |
| Routes API | kebab-case | `/api/game-sessions` |
| Événements Socket.io | `namespace:action` | `creator:start_game` |

### Structure des composants React

```jsx
// 1. Imports
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// 2. Constantes locales
const COLORS = [...];

// 3. Composant
export default function MonComposant({ prop1, prop2 }) {
  // 3a. State
  const [value, setValue] = useState(null);

  // 3b. Effects
  useEffect(() => { ... }, []);

  // 3c. Handlers
  const handleClick = () => { ... };

  // 3d. Render
  return <div>...</div>;
}
```

### Routes Express

```js
// Ordre recommandé dans un fichier de route :
// GET (liste), GET (détail), POST (créer), PUT (modifier), DELETE (supprimer)

router.get('/', authenticate, requireCreator, async (req, res) => {
  try {
    // logique
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});
```

### Messages de commit (Conventional Commits)

```
<type>(<scope>): <description courte en français>

Types :
  feat      Nouvelle fonctionnalité
  fix       Correction de bug
  refactor  Refactoring sans changement de comportement
  style     Formatage, CSS uniquement
  docs      Documentation uniquement
  test      Ajout ou modification de tests
  chore     Maintenance, dépendances, CI

Exemples :
  feat(bonus): ajouter le type de bonus "Avalanche"
  fix(socket): corriger la déconnexion silencieuse du participant
  docs(api): documenter l'endpoint /games/join/:code
  refactor(gameHandler): extraire evaluateAnswer dans utils
```

---

## Ajouter un type de question

1. **Backend — `Question.js`** : ajouter la valeur dans l'enum `QUESTION_TYPES`
2. **Backend — `gameHandler.js`** : ajouter le cas dans `evaluateAnswer()`
3. **Frontend — `QuestionEditor.jsx`** : ajouter l'entrée dans `QUESTION_TYPES` et l'UI de configuration
4. **Frontend — `ParticipantPlay.jsx`** : ajouter l'interface de réponse dans le rendu conditionnel
5. **Frontend — `GameControl.jsx`** : s'assurer que les options s'affichent correctement
6. **Documentation — `API.md`** : documenter le format de `options` et `correctAnswer`

---

## Ajouter un type de bonus

1. **Backend — `Bonus.js`** : ajouter l'entrée dans `BONUS_TYPES`
2. **Backend — `gameHandler.js`** : implémenter l'effet dans `applyBonusToTarget()` et/ou `evaluateAnswer()`
3. **Frontend — `BonusCard.jsx`** : ajouter l'entrée dans `BONUS_INFO` (icône, nom, couleur, catégorie)
4. **Frontend — `ParticipantPlay.jsx`** : si l'effet est visible côté participant, ajouter le handler Socket.io

---

## Variables d'environnement en développement

Créer `backend/.env` (non versionné) :

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quizz
DB_USER=quizz
DB_PASSWORD=quizz_dev
JWT_SECRET=dev_secret_minimum_32_characters_here
JWT_REFRESH_SECRET=dev_refresh_secret_also_32_chars
APP_URL=http://localhost:5173
```

---

## Tests manuels — Checklist

Avant de soumettre une PR, vérifier :

### Partie créateur
- [ ] Créer un quiz avec au moins 3 types de questions différents
- [ ] Modifier et réordonner des questions
- [ ] Créer une partie (mode Projection et mode Appareils)
- [ ] Rejoindre le lobby avec 2 onglets en participant
- [ ] Démarrer la partie, avancer les questions, timer
- [ ] Mettre en pause et reprendre
- [ ] Rejeter un avatar
- [ ] Envoyer un message ciblé
- [ ] Terminer la partie, vérifier l'historique

### Participant
- [ ] Rejoindre via code, via QR code, via lien direct
- [ ] Sélectionner un avatar (DiceBear + upload)
- [ ] Rejoindre en équipe (créer + rejoindre via code d'équipe)
- [ ] Répondre à tous les types de questions
- [ ] Utiliser un bonus
- [ ] Recevoir un bonus d'attaque avec immunité
- [ ] Chat global et équipe

### Admin
- [ ] Créer un utilisateur
- [ ] Désactiver/réactiver un utilisateur
- [ ] Modifier les paramètres de l'application
- [ ] Vérifier que le nom de l'app s'affiche dans le titre
- [ ] Supprimer un historique
