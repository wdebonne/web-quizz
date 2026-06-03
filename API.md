# Documentation API REST

Base URL : `http://localhost:3000/api`

Toutes les requêtes nécessitant une authentification doivent inclure l'en-tête :
```
Authorization: Bearer <accessToken>
```

---

## Authentification

### POST `/auth/login`
Connexion et obtention des tokens.

**Corps**
```json
{
  "email": "admin@quizz.local",
  "password": "Admin1234!"
}
```

**Réponse 200**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@quizz.local",
    "role": "admin",
    "mustChangePassword": false
  }
}
```

---

### POST `/auth/refresh`
Renouveler l'access token avec le refresh token.

**Corps**
```json
{ "refreshToken": "eyJ..." }
```

**Réponse 200**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

### GET `/auth/me`
🔒 Profil de l'utilisateur connecté.

**Réponse 200**
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "role": "admin | creator",
  "mustChangePassword": false
}
```

---

### PUT `/auth/change-password`
🔒 Changer son mot de passe.

**Corps**
```json
{
  "currentPassword": "ancien",
  "newPassword": "nouveau8chars"
}
```

---

### POST `/auth/forgot-password`
Demander un email de réinitialisation.

**Corps**
```json
{ "email": "user@example.com" }
```

---

### POST `/auth/reset-password`
Réinitialiser le mot de passe avec le token reçu par email.

**Corps**
```json
{
  "token": "hex_token_32_bytes",
  "password": "nouveau8chars"
}
```

---

## Quiz

### GET `/quizzes`
🔒 Lister les quiz (les siens pour un créateur, tous pour un admin).

**Réponse 200**
```json
[
  {
    "id": "uuid",
    "title": "Mon Quiz",
    "description": "...",
    "questionCount": 10,
    "defaultPoints": 10,
    "penaltyPercent": 0,
    "defaultTimeLimit": 30,
    "globalTimeLimit": 0,
    "isPublished": false,
    "tags": ["culture", "histoire"],
    "createdAt": "2026-06-03T..."
  }
]
```

---

### GET `/quizzes/:id`
🔒 Détail d'un quiz avec toutes ses questions et bonus.

**Réponse 200**
```json
{
  "id": "uuid",
  "title": "string",
  "questions": [
    {
      "id": "uuid",
      "order": 0,
      "type": "single_choice",
      "content": "Quelle est la capitale ?",
      "mediaUrl": null,
      "mediaType": null,
      "options": [
        { "id": "a", "text": "Paris" },
        { "id": "b", "text": "Lyon" }
      ],
      "correctAnswer": "a",
      "points": null,
      "timeLimit": null,
      "explanation": "Paris est la capitale.",
      "isBonus": false,
      "bonusReward": null,
      "hint": null
    }
  ],
  "bonuses": []
}
```

---

### POST `/quizzes`
🔒 Créer un quiz.

**Corps**
```json
{
  "title": "Mon Quiz *",
  "description": "Description optionnelle",
  "defaultPoints": 10,
  "penaltyPercent": 0,
  "defaultTimeLimit": 30,
  "globalTimeLimit": 0,
  "tags": ["science"]
}
```

---

### PUT `/quizzes/:id`
🔒 Modifier un quiz.

**Corps** — mêmes champs que POST (tous optionnels).

---

### DELETE `/quizzes/:id`
🔒 Supprimer un quiz et toutes ses questions.

---

## Questions

### POST `/quizzes/:id/questions`
🔒 Ajouter une question au quiz.

**Corps**
```json
{
  "type": "single_choice",
  "content": "Question ? *",
  "mediaUrl": "/uploads/media/img.jpg",
  "mediaType": "image",
  "options": [
    { "id": "a", "text": "Option A" },
    { "id": "b", "text": "Option B" }
  ],
  "correctAnswer": "a",
  "points": 15,
  "timeLimit": 20,
  "explanation": "Explication...",
  "isBonus": false,
  "bonusReward": { "type": "double_points" },
  "hint": "Indice..."
}
```

**Types de questions**

| Type | `correctAnswer` | `options` |
|------|----------------|-----------|
| `single_choice` | `"id_option"` | `[{id, text}]` |
| `multiple_choice` | `["id1","id2"]` | `[{id, text}]` |
| `true_false` | `"true"` ou `"false"` | — |
| `free_text` | `["Paris","paris"]` | — |
| `image` | `"id_option"` | `[{id, text, mediaUrl?}]` |
| `audio` | `"id_option"` | `[{id, text}]` |
| `video` | `"id_option"` | `[{id, text}]` |
| `ordering` | `["id1","id2","id3"]` | `[{id, text}]` |
| `matching` | `{"id1":"val1","id2":"val2"}` | `[{id, text}]` |
| `slider` | `42` (nombre) | `{min, max, tolerance}` |
| `poll` | `null` | `[{id, text}]` |

---

### PUT `/quizzes/:id/questions/:qid`
🔒 Modifier une question.

---

### DELETE `/quizzes/:id/questions/:qid`
🔒 Supprimer une question (renumérotation automatique).

---

### PUT `/quizzes/:id/questions/reorder`
🔒 Réordonner les questions.

**Corps**
```json
{ "orderedIds": ["uuid1", "uuid2", "uuid3"] }
```

---

## Bonus de quiz

### GET `/quizzes/:id/bonuses`
🔒 Lister les bonus personnalisés du quiz.

### POST `/quizzes/:id/bonuses`
🔒 Créer un bonus personnalisé.

**Corps**
```json
{
  "type": "immunity",
  "name": "Super Bouclier",
  "icon": "🛡️",
  "description": "Protège 2 tours",
  "category": "defense",
  "config": { "duration": 2 }
}
```

### DELETE `/quizzes/:id/bonuses/:bid`
🔒 Supprimer un bonus.

---

## Parties (Game Sessions)

### POST `/games`
🔒 Créer une session de jeu.

**Corps**
```json
{
  "quizId": "uuid *",
  "mode": "projection | device",
  "teamsEnabled": false,
  "maxParticipants": 100,
  "settings": {}
}
```

**Réponse 201**
```json
{
  "id": "uuid",
  "code": "ABC123",
  "status": "lobby",
  "mode": "projection",
  "joinUrl": "http://localhost:3000/join/ABC123",
  "qrCode": "data:image/png;base64,..."
}
```

---

### GET `/games`
🔒 Lister les sessions du créateur.

---

### GET `/games/:id`
🔒 Détail d'une session (inclut quiz, participants, équipes, QR code).

---

### DELETE `/games/:id`
🔒 Supprimer une session.

---

### GET `/games/join/:code`
**Public** — Valider un code de partie avant de rejoindre.

**Réponse 200**
```json
{
  "id": "uuid",
  "code": "ABC123",
  "status": "lobby",
  "mode": "projection",
  "teamsEnabled": false,
  "quiz": { "title": "...", "coverImage": null }
}
```

**Erreurs**
- `404` — Code invalide
- `410` — Partie terminée
- `403` — Partie complète

---

## Historique

### GET `/games/history/all`
🔒 Lister tout l'historique du créateur (admin = tous).

**Réponse 200**
```json
[
  {
    "id": "uuid",
    "quizTitle": "Mon Quiz",
    "mode": "projection",
    "teamsEnabled": false,
    "participantCount": 12,
    "questionCount": 10,
    "durationSeconds": 840,
    "leaderboard": [
      { "rank": 1, "name": "Alice", "score": 145, "avatar": "dicebear:fox", "streak": 5 }
    ],
    "startedAt": "...",
    "finishedAt": "...",
    "createdAt": "..."
  }
]
```

---

### DELETE `/games/history/:id`
🔒 Supprimer un historique.

---

## Administration

> Toutes les routes `/admin/*` nécessitent le rôle `admin`.

### GET `/admin/users`
Liste tous les utilisateurs.

### POST `/admin/users`
Créer un utilisateur.

**Corps**
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "SecretPass1!",
  "role": "creator | admin"
}
```

### PUT `/admin/users/:id`
Modifier un utilisateur.

**Corps** (tous optionnels)
```json
{
  "username": "nouveau_pseudo",
  "email": "new@email.com",
  "role": "creator",
  "isActive": true,
  "password": "nouveau_mdp"
}
```

### DELETE `/admin/users/:id`
Supprimer un utilisateur.

---

### POST `/admin/invite`
Envoyer une invitation par email.

**Corps**
```json
{
  "email": "invite@example.com",
  "role": "creator"
}
```

---

### GET `/admin/settings`
Lire tous les paramètres de l'application.

**Réponse 200**
```json
{
  "app_name": "QuizzApp",
  "app_logo": "/uploads/avatars/logo.png",
  "app_favicon": "",
  "app_primary_color": "#6366f1",
  "app_accent_color": "#f59e0b",
  "registration_enabled": "true",
  "smtp_host": "smtp.gmail.com",
  "smtp_port": "587",
  "smtp_secure": "false",
  "smtp_user": "user@gmail.com",
  "smtp_pass": "...",
  "smtp_from": "noreply@quizz.local",
  "email_template_welcome": "Bienvenue !",
  "email_template_reset": "Réinitialisation MDP"
}
```

### PUT `/admin/settings`
Mettre à jour un ou plusieurs paramètres.

**Corps** — objet clé/valeur libre :
```json
{
  "app_name": "MonQuizz",
  "app_primary_color": "#3b82f6"
}
```

### DELETE `/admin/history`
Supprimer tout l'historique des parties.

### DELETE `/admin/history/:id`
Supprimer un historique spécifique.

---

## Uploads

### POST `/uploads/avatar`
🔒 Uploader un avatar personnalisé.

**Form-data** : `file` (image/jpeg, image/png, image/gif, image/webp, max 50 MB)

**Réponse 200**
```json
{ "url": "/uploads/avatars/1234567890-abc123.jpg" }
```

---

### POST `/uploads/media`
🔒 Uploader un média pour une question.

**Form-data** : `file` (image, audio/*, video/mp4, video/webm, max 50 MB)

**Réponse 200**
```json
{
  "url": "/uploads/media/1234567890-def456.mp4",
  "mediaType": "video"
}
```

---

### POST `/uploads/logo`
🔒 Uploader le logo de l'application (mis à jour dans les settings automatiquement).

---

## Paramètres publics

### GET `/settings/public`
**Public** — Paramètres affichables sans authentification (nom, logo, couleurs).

**Réponse 200**
```json
{
  "app_name": "QuizzApp",
  "app_logo": "",
  "app_favicon": "",
  "app_primary_color": "#6366f1",
  "app_accent_color": "#f59e0b"
}
```

---

## Santé

### GET `/health`
**Public** — Vérifier que le serveur fonctionne.

**Réponse 200**
```json
{
  "status": "ok",
  "timestamp": "2026-06-03T12:00:00.000Z"
}
```

---

## Codes d'erreur HTTP

| Code | Signification |
|------|---------------|
| `200` | Succès |
| `201` | Créé |
| `400` | Données invalides |
| `401` | Non authentifié |
| `403` | Accès refusé (rôle insuffisant) |
| `404` | Ressource introuvable |
| `409` | Conflit (email déjà utilisé) |
| `410` | Ressource expirée (partie terminée) |
| `429` | Trop de requêtes (rate limit) |
| `500` | Erreur serveur interne |

**Format d'erreur**
```json
{ "error": "Message d'erreur lisible" }
```

**Format d'erreur de validation**
```json
{
  "errors": [
    { "field": "email", "message": "Invalid email" }
  ]
}
```
