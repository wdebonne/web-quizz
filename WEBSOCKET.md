# Documentation WebSocket (Socket.io)

L'application utilise Socket.io pour toute la communication en temps réel.

**Endpoint** : `ws://localhost:3000` (même port que l'API HTTP)

---

## Authentification à la connexion

Passer les identifiants dans `socket.handshake.auth` lors de la connexion.

### Créateur / Page de projection
```js
const socket = io('/', {
  auth: { token: '<JWT accessToken>' }
});
```

### Participant
```js
const socket = io('/', {
  auth: {
    participantId: '<uuid généré côté client>',
    sessionCode: 'ABC123'
  }
});
```

---

## Rooms Socket.io

| Room | Membres |
|------|---------|
| `session:{id}` | Tous (créateur + participants + projection) |
| `session:{id}:creator` | Créateur uniquement |
| `session:{id}:team:{teamId}` | Membres d'une équipe |
| `session:{id}:projection` | Page de projection |

---

## Événements — Créateur

### Émis par le créateur

#### `creator:join_session`
Rejoindre une session existante (nécessaire pour recevoir les événements).
```json
{ "sessionId": "uuid" }
```

#### `creator:start_game`
Démarrer la partie (passe de `lobby` à `active`, affiche la 1ère question).
```json
{}
```

#### `creator:next_question`
Passer à la question suivante (ou terminer si dernière question).
```json
{}
```

#### `creator:pause`
Mettre la partie en pause.
```json
{}
```

#### `creator:resume`
Reprendre la partie après une pause.
```json
{}
```

#### `creator:end_game`
Terminer la partie immédiatement.
```json
{}
```

#### `creator:send_message`
Envoyer un message (ciblé ou global).
```json
{
  "content": "Texte du message",
  "toType": "all | team | participant | creator",
  "toId": "uuid | null",
  "toName": "Nom cible | null"
}
```

#### `creator:reject_avatar`
Rejeter l'avatar personnalisé d'un participant.
```json
{
  "participantId": "uuid",
  "reason": "Avatar non approprié."
}
```

#### `creator:approve_avatar`
Approuver l'avatar personnalisé d'un participant.
```json
{ "participantId": "uuid" }
```

#### `creator:kick_participant`
Exclure un participant de la partie.
```json
{ "participantId": "uuid" }
```

#### `creator:show_results`
Afficher le classement intermédiaire sur la projection.
```json
{}
```

---

### Reçus par le créateur

#### `session:state`
État complet de la session à la connexion.
```json
{
  "id": "uuid",
  "code": "ABC123",
  "status": "lobby",
  "mode": "projection",
  "teamsEnabled": false,
  "currentQuestionIndex": -1,
  "participants": [...],
  "teams": [...],
  "quiz": { "title": "...", "questions": [...] }
}
```

#### `lobby:update`
Mise à jour de la liste des participants / équipes.
```json
{
  "participants": [...],
  "teams": [...]
}
```

#### `participant:new`
Nouveau participant rejoint le lobby.
```json
{
  "participant": { "id": "uuid", "name": "Alice", "avatar": "dicebear:fox", ... },
  "needsApproval": false
}
```

#### `participant:updated`
Un participant a été mis à jour (avatar changé, etc.).
```json
{ "participant": { ... } }
```

#### `participant:left`
Un participant a quitté.
```json
{ "participantId": "uuid" }
```

#### `participant:disconnected`
Un participant s'est déconnecté (connexion perdue).
```json
{ "participantId": "uuid" }
```

#### `avatar:pending_approval`
Un avatar personnalisé attend l'approbation du créateur.
```json
{ "participant": { "id": "uuid", "name": "...", "avatar": "/uploads/..." } }
```

#### `participant:answered`
Un participant a répondu à la question en cours.
```json
{
  "participantId": "uuid",
  "name": "Alice",
  "isCorrect": true,
  "pointsEarned": 12,
  "newScore": 45,
  "questionId": "uuid"
}
```

#### `game:question_full`
Version complète de la question (avec la bonne réponse) — créateur uniquement.
```json
{
  "question": { "id": "...", "correctAnswer": "a", "explanation": "...", ... },
  "questionIndex": 0,
  "totalQuestions": 10,
  "timeLimit": 30
}
```

#### `game:time_up`
Le temps est écoulé pour la question en cours.
```json
{}
```

---

## Événements — Participant

### Émis par le participant

#### `participant:join`
Rejoindre une session (après la connexion socket).
```json
{
  "sessionCode": "ABC123",
  "name": "Alice",
  "avatar": "dicebear:fox",
  "teamId": "uuid | null",
  "teamCode": "WXYZ | null",
  "createTeam": false,
  "teamName": "Les Champions | null"
}
```

#### `participant:answer`
Envoyer une réponse à la question en cours.
```json
{
  "questionId": "uuid",
  "answer": "a | ['a','b'] | 'texte' | 42 | ['id1','id2']",
  "timeMs": 8500
}
```

#### `participant:send_message`
Envoyer un message au chat global ou ciblé.
```json
{
  "content": "Bonne question !",
  "toType": "all | creator",
  "toId": null,
  "toName": null
}
```

#### `team:send_message`
Envoyer un message au chat de l'équipe uniquement.
```json
{ "content": "Stratégie ?" }
```

#### `participant:use_bonus`
Utiliser un bonus de son inventaire.
```json
{
  "bonusType": "steal_points",
  "targetId": "uuid | null",
  "targetType": "participant | team | null"
}
```

#### `projection:join`
Rejoindre la room de projection (pour la page plein écran).
```json
{ "sessionId": "uuid" }
```

---

### Reçus par le participant

#### `participant:joined`
Confirmation de la connexion réussie.
```json
{
  "participant": { "id": "uuid", "name": "Alice", "avatar": "dicebear:fox", "score": 0, ... },
  "session": { "id": "uuid", "status": "lobby", "mode": "projection", "teamsEnabled": false, "quiz": { "title": "..." } }
}
```

#### `team:created`
Confirmation de la création d'une équipe avec son QR code.
```json
{
  "team": {
    "id": "uuid",
    "name": "Les Champions",
    "code": "WXYZ",
    "joinUrl": "http://localhost:3000/join/ABC123?team=WXYZ",
    "qrCode": "data:image/png;base64,..."
  }
}
```

#### `answer:result`
Résultat de la réponse envoyée.
```json
{
  "questionId": "uuid",
  "isCorrect": true,
  "pointsEarned": 12,
  "newScore": 57,
  "correctAnswer": "a",
  "explanation": "Paris est la capitale de la France.",
  "streak": 3
}
```

#### `bonus:received`
Un bonus a été reçu (question bonus réussie ou bonus d'attaque converti).
```json
{
  "bonus": {
    "type": "double_points",
    "config": {}
  }
}
```

#### `bonus:used`
Confirmation que le bonus a bien été utilisé.
```json
{ "bonusType": "double_points" }
```

#### `bonus:attacked`
Un adversaire vous a ciblé avec un bonus d'attaque.
```json
{ "type": "freeze" }
```

#### `bonus:immunity_used`
Votre immunité a été consommée pour bloquer une attaque.
```json
{ "fromBonusType": "freeze" }
```

#### `avatar:rejected`
Votre avatar personnalisé a été refusé, un nouvel avatar vous est attribué.
```json
{
  "newAvatar": "dicebear:wolf",
  "reason": "Avatar non approprié."
}
```

#### `game:kicked`
Vous avez été exclu de la partie par le créateur.
```json
{}
```

---

## Événements — Partagés (tous les rôles)

#### `game:started`
La partie vient de démarrer.
```json
{ "mode": "projection | device" }
```

#### `game:question`
Une nouvelle question est affichée (version sans la bonne réponse).
```json
{
  "question": {
    "id": "uuid",
    "order": 0,
    "type": "single_choice",
    "content": "Quelle est la capitale de la France ?",
    "mediaUrl": null,
    "mediaType": null,
    "options": [
      { "id": "a", "text": "Lyon" },
      { "id": "b", "text": "Paris" },
      { "id": "c", "text": "Marseille" },
      { "id": "d", "text": "Bordeaux" }
    ],
    "isBonus": false,
    "hint": null
  },
  "questionIndex": 0,
  "totalQuestions": 10,
  "timeLimit": 30
}
```

#### `game:timer`
Tick du timer (émis chaque seconde).
```json
{
  "remaining": 25,
  "total": 30
}
```

#### `scores:update`
Mise à jour des scores en temps réel après chaque réponse.
```json
{
  "participants": [
    { "id": "uuid", "name": "Alice", "score": 57, "avatar": "dicebear:fox", "teamId": null, "isConnected": true, "streak": 3 }
  ],
  "teams": [
    { "id": "uuid", "name": "Les Champions", "score": 120, "color": "#6366f1", "avatar": "🏆" }
  ]
}
```

#### `game:paused`
La partie est en pause.
```json
{}
```

#### `game:resumed`
La partie reprend après une pause.
```json
{}
```

#### `game:results_show`
Le créateur affiche le classement intermédiaire.
```json
{
  "leaderboard": [
    { "rank": 1, "id": "uuid", "name": "Alice", "score": 120, "avatar": "dicebear:fox", "type": "participant" }
  ]
}
```

#### `game:finished`
La partie est terminée — classement final.
```json
{
  "leaderboard": [
    {
      "rank": 1, "id": "uuid", "name": "Alice",
      "score": 145, "avatar": "dicebear:fox",
      "streak": 5, "type": "participant"
    }
  ]
}
```

#### `message:new`
Nouveau message dans le chat.
```json
{
  "id": "uuid",
  "sessionId": "uuid",
  "fromType": "creator | participant | system",
  "fromId": "uuid | null",
  "fromName": "Alice",
  "toType": "all | team | participant | creator",
  "toId": "uuid | null",
  "toName": "Bob | null",
  "content": "Bravo !",
  "type": "text | system | bonus_alert",
  "createdAt": "..."
}
```

#### `bonus:activated`
Animation globale quand quelqu'un utilise un bonus.
```json
{
  "fromName": "Alice",
  "fromAvatar": "dicebear:fox",
  "bonusType": "steal_points",
  "targetId": "uuid",
  "targetType": "participant"
}
```

#### `error`
Erreur Socket.io côté serveur.
```json
{ "message": "Code invalide." }
```

---

## Exemple de flux complet

```
CRÉATEUR                          PARTICIPANT
    │                                  │
    ├── creator:join_session ──────────┤
    │◄─ session:state ─────────────────┤
    │                                  │
    │            ┌── participant:join──►│
    │◄─ participant:new ───────────────┤
    │◄─ lobby:update ──────────────────┤
    │                      ◄─ participant:joined
    │                                  │
    ├── creator:start_game ────────────┤
    │                      ◄─ game:started
    │                                  │
    ├─────── game:question ───────────►│
    │◄────── game:question_full ───────┤ (créateur uniquement)
    │                                  │
    │           ┌── participant:answer──►│
    │◄─ participant:answered ──────────┤
    │                      ◄─ answer:result
    │◄────── scores:update ───────────►│
    │                                  │
    ├── creator:next_question ─────────┤
    │                                  │
    [... questions suivantes ...]
    │                                  │
    ├─── game:finished ───────────────►│
                           ◄─ game:finished
```
