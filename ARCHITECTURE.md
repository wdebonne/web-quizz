# Architecture technique

---

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────┐
│                  Navigateur client                  │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │  Créateur /  │  │ Participant  │  │Projection│  │
│  │    Admin     │  │    (mobile)  │  │ (écran)  │  │
│  └──────┬───────┘  └──────┬───────┘  └────┬─────┘  │
│         │  HTTP/WS        │  HTTP/WS       │ WS     │
└─────────┼─────────────────┼───────────────┼────────┘
          │                 │               │
┌─────────▼─────────────────▼───────────────▼────────┐
│                Container Docker: app                │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │           Node.js (port 3000)                │   │
│  │                                              │   │
│  │  ┌────────────┐   ┌────────────────────────┐ │   │
│  │  │  Express   │   │      Socket.io         │ │   │
│  │  │  REST API  │   │    Game Handler        │ │   │
│  │  │  /api/*    │   │  (temps réel)          │ │   │
│  │  └─────┬──────┘   └──────────┬─────────────┘ │   │
│  │        │                     │               │   │
│  │  ┌─────▼─────────────────────▼─────────────┐ │   │
│  │  │           Sequelize ORM                 │ │   │
│  │  └─────────────────────┬───────────────────┘ │   │
│  │                        │                     │   │
│  │  ┌─────────────────────▼───────────────────┐ │   │
│  │  │      React (SPA buildé → /public)       │ │   │
│  │  └─────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  Volumes: /uploads (avatars, médias)                │
└─────────────────────────┬───────────────────────────┘
                          │ TCP 5432
┌─────────────────────────▼───────────────────────────┐
│             Container Docker: db                    │
│                                                     │
│              PostgreSQL 15                          │
│                                                     │
│  Volume: /var/lib/postgresql/data                   │
└─────────────────────────────────────────────────────┘
```

---

## Structure des fichiers

```
quizzapp/
│
├── Dockerfile                   # Build multi-stage
├── docker-compose.yml           # Orchestration 2 containers
├── .env.example                 # Variables d'env (template)
├── .gitignore
│
├── backend/                     # Serveur Node.js
│   ├── package.json
│   ├── server.js                # Point d'entrée, setup Express + Socket.io
│   └── src/
│       ├── config/
│       │   ├── database.js      # Connexion Sequelize/PostgreSQL
│       │   └── setup.js         # Données par défaut (admin, settings)
│       │
│       ├── models/              # Modèles Sequelize (tables PostgreSQL)
│       │   ├── index.js         # Associations entre modèles
│       │   ├── User.js
│       │   ├── Quiz.js
│       │   ├── Question.js
│       │   ├── GameSession.js
│       │   ├── Participant.js
│       │   ├── Team.js
│       │   ├── Message.js
│       │   ├── Bonus.js
│       │   ├── GameHistory.js
│       │   └── AppSetting.js
│       │
│       ├── routes/              # Contrôleurs API REST
│       │   ├── auth.js          # Login, refresh, MDP
│       │   ├── quizzes.js       # CRUD quiz + questions + bonus
│       │   ├── games.js         # Sessions de jeu, historique
│       │   ├── admin.js         # Gestion users, settings
│       │   ├── uploads.js       # Upload avatars et médias
│       │   └── settings.js      # Paramètres publics
│       │
│       ├── middleware/
│       │   └── auth.js          # Vérification JWT, contrôle des rôles
│       │
│       ├── socket/
│       │   └── gameHandler.js   # Toute la logique temps réel
│       │
│       └── utils/
│           ├── helpers.js       # generateCode, shuffle, avatars par défaut
│           ├── qrcode.js        # Génération QR code (base64)
│           └── mailer.js        # Emails via Nodemailer (SMTP configuré en DB)
│
└── frontend/                    # Application React
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx             # Point d'entrée React
        ├── App.jsx              # Routeur React Router v6
        ├── index.css            # Tailwind + classes utilitaires custom
        ├── api.js               # Instance Axios + intercepteurs JWT
        ├── socket.js            # Helpers connexion Socket.io
        │
        ├── contexts/
        │   ├── AuthContext.jsx       # Utilisateur connecté, login/logout
        │   └── AppSettingsContext.jsx # Paramètres publics (nom, couleurs)
        │
        ├── components/               # Composants réutilisables
        │   ├── Layout.jsx            # En-tête, navigation, responsive
        │   ├── AvatarPicker.jsx      # Sélecteur + upload avatar
        │   ├── QRCodeDisplay.jsx     # Affichage QR code + bouton télécharger
        │   ├── ChatPanel.jsx         # Chat temps réel (global/équipe/ciblé)
        │   ├── BonusCard.jsx         # Carte bonus + sélecteur de cible
        │   └── QuestionEditor.jsx    # Éditeur complet de question (tous types)
        │
        └── pages/
            ├── Login.jsx             # Connexion + mot de passe oublié
            ├── ResetPassword.jsx     # Réinitialisation via token email
            ├── Dashboard.jsx         # Liste des quiz du créateur
            ├── QuizEditor.jsx        # Édition quiz, questions, bonus
            ├── GameLobby.jsx         # Lobby avant démarrage (créateur)
            ├── GameControl.jsx       # Contrôle en cours de partie (créateur)
            ├── GameProjection.jsx    # Page plein écran (projection + race)
            ├── GameFinished.jsx      # Résultats finaux avec confettis
            ├── History.jsx           # Historique des parties terminées
            ├── Admin.jsx             # Panneau d'administration
            ├── ParticipantJoin.jsx   # Rejoindre (code → pseudo → avatar → équipe)
            ├── ParticipantWaiting.jsx# Salle d'attente participant
            └── ParticipantPlay.jsx   # Interface de jeu participant
```

---

## Modèle de données (PostgreSQL)

```
users
├── id (UUID PK)
├── username, email, password
├── role (admin | creator)
├── isActive, mustChangePassword
├── lastLogin, resetToken, resetTokenExpiry
└── createdAt, updatedAt

quizzes
├── id (UUID PK)
├── userId → users.id
├── title, description, coverImage
├── defaultPoints, penaltyPercent
├── defaultTimeLimit, globalTimeLimit
├── isPublished, tags[]
└── createdAt, updatedAt

questions
├── id (UUID PK)
├── quizId → quizzes.id (CASCADE DELETE)
├── order, type (enum 11 types)
├── content, mediaUrl, mediaType
├── options (JSONB), correctAnswer (JSONB)
├── points, timeLimit
├── explanation, hint
├── isBonus, bonusReward (JSONB)
└── createdAt, updatedAt

bonuses
├── id (UUID PK)
├── quizId → quizzes.id (nullable — bonus global si NULL)
├── type, name, icon, description, category
├── config (JSONB), isBuiltin
└── createdAt, updatedAt

game_sessions
├── id (UUID PK)
├── quizId → quizzes.id
├── creatorId → users.id
├── code (UNIQUE, 6-8 chars)
├── status (lobby | active | paused | finished)
├── mode (projection | device)
├── currentQuestionIndex, questionStartedAt
├── teamsEnabled, maxParticipants
├── settings (JSONB)
├── startedAt, finishedAt
└── createdAt, updatedAt

participants
├── id (UUID PK)
├── sessionId → game_sessions.id (CASCADE DELETE)
├── teamId → teams.id (nullable)
├── name, avatar
├── avatarPendingApproval
├── score, streak, maxStreak
├── answers (JSONB array)
├── bonuses (JSONB array — actifs)
├── bonusHistory (JSONB array)
├── socketId, isConnected, isCaptain
├── joinedAt
└── createdAt, updatedAt

teams
├── id (UUID PK)
├── sessionId → game_sessions.id (CASCADE DELETE)
├── name, color, avatar
├── code (UNIQUE dans la session)
├── score, isSharedDevice
├── bonuses (JSONB), bonusHistory (JSONB)
└── createdAt, updatedAt

messages
├── id (UUID PK)
├── sessionId → game_sessions.id (CASCADE DELETE)
├── fromType (creator | participant | system)
├── fromId, fromName
├── toType (all | team | participant | creator)
├── toId, toName
├── content, type (text | system | bonus_alert)
└── createdAt

game_histories
├── id (UUID PK)
├── sessionId → game_sessions.id (UNIQUE)
├── creatorId → users.id
├── quizTitle, mode, teamsEnabled
├── participantCount, questionCount
├── leaderboard (JSONB)
├── results (JSONB — snapshot complet)
├── startedAt, finishedAt, durationSeconds
└── createdAt

app_settings
├── id (UUID PK)
├── key (UNIQUE)
├── value (TEXT)
└── updatedAt
```

---

## Flux de jeu

```
CRÉATEUR                    SERVEUR                    PARTICIPANT
    │                          │                            │
    ├── Créer quiz ────────────►│                            │
    ├── Ajouter questions ─────►│                            │
    ├── POST /games ───────────►│ Génère code + QR           │
    │◄── {code, qrCode} ────────┤                            │
    │                          │                            │
    ├── WS: join_session ──────►│                            │
    │                          │◄── participant:join ────────┤
    │◄── participant:new ───────┤──► participant:joined ──────┤
    │                          │                            │
    ├── WS: start_game ────────►│──► game:started ───────────►│
    │                          │──► game:question ───────────►│
    │◄── game:question_full ────┤                            │
    │                          │                            │
    │  [timer]                 │◄── participant:answer ──────┤
    │◄── participant:answered ──┤──► answer:result ──────────►│
    │◄── scores:update ─────────┤──► scores:update ───────────►│
    │                          │                            │
    ├── WS: next_question ─────►│ (répéter N fois)           │
    │                          │                            │
    │  (dernière question)     │                            │
    ├── WS: next_question ─────►│──► game:finished ───────────►│
    │◄── game:finished ─────────┤                            │
    │                          │ Sauvegarde GameHistory      │
```

---

## Sécurité

| Mécanisme | Implémentation |
|-----------|----------------|
| Authentification | JWT (access 7j + refresh 30j) |
| Hachage MDP | bcrypt (cost 12) |
| CORS | Configuré sur `APP_URL` |
| En-têtes HTTP | Helmet.js |
| Rate limiting | 500 req / 15 min par IP |
| Validation | express-validator sur toutes les routes |
| Uploads | Whitelist MIME types, limite 50 MB |
| XSS | React gère l'échappement automatiquement |
| SQL injection | Sequelize ORM avec requêtes paramétrées |
| Autorisation | Vérification `userId` ou rôle `admin` sur chaque ressource |
