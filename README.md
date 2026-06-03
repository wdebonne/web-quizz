# QuizzApp 🎮

Application de quiz interactive en temps réel, déployable sur Docker avec Portainer.

## Stack technique
- **Backend** : Node.js 20, Express, Socket.io, Sequelize, PostgreSQL
- **Frontend** : React 18, Vite, Tailwind CSS
- **Infrastructure** : Docker Compose (2 containers)

## Documentation

| Fichier | Description |
|---------|-------------|
| [README.md](README.md) | Présentation et démarrage rapide |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Guide de déploiement complet (local, production, Portainer, backup) |
| [API.md](API.md) | Documentation de toutes les routes REST |
| [WEBSOCKET.md](WEBSOCKET.md) | Documentation des événements Socket.io |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Architecture technique et schéma de base de données |
| [QUESTIONS.md](QUESTIONS.md) | Les 11 types de questions et leur configuration |
| [BONUSES.md](BONUSES.md) | Les 12 types de bonus et leurs effets |
| [GAME_MODES.md](GAME_MODES.md) | Modes Projection et Appareils, mode équipe |
| [ENVIRONMENT.md](ENVIRONMENT.md) | Référence complète des variables d'environnement |
| [SECURITY.md](SECURITY.md) | Checklist de sécurité et bonnes pratiques |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Guide pour contribuer au projet |
| [CHANGELOG.md](CHANGELOG.md) | Historique des versions |

---

## Installation rapide avec Git + Portainer

### 1. Cloner le dépôt

```bash
git clone <votre-repo> quizzapp
cd quizzapp
```

### 2. Configurer l'environnement

```bash
cp .env.example .env
```

Éditez `.env` et changez **obligatoirement** :
- `DB_PASSWORD` — mot de passe PostgreSQL
- `JWT_SECRET` — chaîne aléatoire longue (min 32 chars)
- `JWT_REFRESH_SECRET` — autre chaîne aléatoire longue
- `APP_URL` — URL publique de votre application (ex: `http://mon-serveur:3000`)

### 3. Déploiement Docker Compose

```bash
docker compose up -d --build
```

L'application sera accessible sur `http://localhost:3000`

---

## Déploiement via Portainer

1. Dans Portainer → **Stacks** → **Add stack**
2. Choisir **Repository** → entrer l'URL Git de votre dépôt
3. Portainer détectera automatiquement le `docker-compose.yml`
4. Ajouter les variables d'environnement dans l'interface Portainer :
   - `DB_PASSWORD`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `APP_URL`
5. Cliquer **Deploy the stack**

---

## Compte admin par défaut

Lors du premier démarrage, un compte administrateur est créé automatiquement :

| Champ | Valeur |
|-------|--------|
| Email | `admin@quizz.local` |
| Mot de passe | `Admin1234!` |

> ⚠️ Changez ce mot de passe immédiatement après la première connexion !

---

## Fonctionnalités

### 👨‍🏫 Créateur
- Créer des séries de quiz avec tous les types de questions
- Types : Choix unique, Choix multiple, Vrai/Faux, Texte libre, Image, Audio, Vidéo, Curseur, Sondage, Ordre, Association
- Configurer les points, pénalités, temps par question ou global
- Lancer une partie → génération QR code + lien de rejointe
- Gérer les participants (approuver/refuser les avatars)
- Envoyer des messages ciblés (tout le monde, équipe, participant)
- Mode Projection (questions sur grand écran, réponses sur appareils)
- Mode Appareils (tout sur l'appareil du participant)
- Tableau de bord en direct avec classement en temps réel
- Page de projection avec course animée des équipes

### 👥 Participants
- Rejoindre via QR code, lien ou code de saisie
- Choisir un avatar DiceBear parmi 30 avatars prédéfinis ou importer sa propre image
- Jouer en solo ou en équipe
- Mode équipe partagée (un seul appareil) ou individuel (chacun son appareil)
- Code QR d'équipe pour rejoindre facilement
- Chat entre membres d'équipe, avec le créateur, ou en global
- Affichage bonus, animations de résultats

### ⭐ Système de bonus
12 types de bonus récupérables via les questions bonus :
- 🛡️ **Immunité** — protège des attaques
- ✖️2 **Double Points** — double les points sur la prochaine question
- ⏰ **Temps Bonus** — +15 secondes
- 🎯 **Réponse Libre** — prochaine réponse toujours correcte
- 💸 **Vol de Points** — vole 10% des points d'une cible
- 🧊 **Gel** — accélère le timer de la cible
- ⏭️ **Passer** — passe une question sans pénalité
- 💡 **Indice** — révèle l'indice de la question
- 🔄 **Inversé** — la cible perd ses points gagnés
- ✅ **Erreur Gratuite** — une mauvaise réponse tolérée
- 🙈 **Aveugle** — cache les options à la cible
- 🔀 **Échange** — échange les scores

### 🔧 Admin
- Gestion des utilisateurs (créer, modifier, désactiver)
- Configuration SMTP pour emails (reset MDP, invitations)
- Personnalisation : nom, logo, favicon, couleurs
- Templates d'emails
- Historique global des parties

---

## Développement local

### Prérequis
- Node.js 20+
- PostgreSQL 15+ (ou Docker)

### Backend
```bash
cd backend
npm install
# Créer .env dans backend/ ou copier depuis la racine
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Le frontend se lance sur `http://localhost:5173` avec proxy vers le backend.

---

## Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `APP_PORT` | Port de l'application | `3000` |
| `APP_URL` | URL publique | `http://localhost:3000` |
| `APP_NAME` | Nom de l'app | `QuizzApp` |
| `DB_NAME` | Nom de la base PostgreSQL | `quizz` |
| `DB_USER` | Utilisateur PostgreSQL | `quizz` |
| `DB_PASSWORD` | Mot de passe PostgreSQL | — |
| `JWT_SECRET` | Secret JWT (access token) | — |
| `JWT_REFRESH_SECRET` | Secret JWT (refresh token) | — |
| `SMTP_HOST` | Hôte SMTP | — |
| `SMTP_PORT` | Port SMTP | `587` |
| `SMTP_SECURE` | TLS/SSL | `false` |
| `SMTP_USER` | Utilisateur SMTP | — |
| `SMTP_PASS` | Mot de passe SMTP | — |
| `SMTP_FROM` | Adresse expéditeur | — |

---

## Architecture

```
├── Dockerfile              # Build multi-stage (frontend + backend)
├── docker-compose.yml      # 2 services: app + db
├── backend/
│   ├── server.js           # Point d'entrée Express + Socket.io
│   └── src/
│       ├── config/         # DB + setup initial
│       ├── models/         # Modèles Sequelize
│       ├── routes/         # API REST
│       ├── middleware/      # Auth JWT
│       ├── socket/         # Logique temps réel
│       └── utils/          # QR code, mailer, helpers
└── frontend/
    └── src/
        ├── contexts/       # Auth, AppSettings
        ├── components/     # Layout, QR, Avatar, Chat, Bonus, QuestionEditor
        └── pages/          # Toutes les pages (créateur + participant)
```
