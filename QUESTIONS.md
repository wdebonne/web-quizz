# Types de questions

Documentation des 11 types de questions disponibles dans QuizzApp.

---

## Vue d'ensemble

| Type | Valeur API | Description | Bonne réponse |
|------|-----------|-------------|---------------|
| Choix unique | `single_choice` | Une seule bonne réponse parmi des options | ID de l'option |
| Choix multiple | `multiple_choice` | Plusieurs bonnes réponses | Tableau d'IDs |
| Vrai / Faux | `true_false` | Deux choix : Vrai ou Faux | `"true"` ou `"false"` |
| Texte libre | `free_text` | Réponse ouverte saisie au clavier | Tableau de variantes |
| Image | `image` | Image affichée + options de réponse | ID de l'option |
| Audio | `audio` | Son joué + options de réponse | ID de l'option |
| Vidéo | `video` | Vidéo jouée + options de réponse | ID de l'option |
| Curseur | `slider` | Valeur numérique sur une plage | Nombre |
| Ordre | `ordering` | Remettre des éléments dans le bon ordre | Tableau d'IDs ordonné |
| Association | `matching` | Associer deux colonnes par paires | Objet `{id: valeur}` |
| Sondage | `poll` | Vote sans bonne réponse | `null` |

---

## Choix unique (`single_choice`)

Le type de question le plus classique. Le participant choisit une réponse parmi N options.

**Configuration**
```json
{
  "type": "single_choice",
  "content": "Quelle est la capitale de la France ?",
  "options": [
    { "id": "a", "text": "Lyon" },
    { "id": "b", "text": "Paris" },
    { "id": "c", "text": "Marseille" },
    { "id": "d", "text": "Bordeaux" }
  ],
  "correctAnswer": "b"
}
```

- Minimum 2 options, maximum 8
- Les options sont mélangées avant affichage chez les participants
- La réponse est validée dès le clic (pas de bouton "Valider")

---

## Choix multiple (`multiple_choice`)

Plusieurs bonnes réponses possibles. Le participant coche toutes les réponses correctes avant de valider.

**Configuration**
```json
{
  "type": "multiple_choice",
  "content": "Quels sont les pays d'Europe ?",
  "options": [
    { "id": "a", "text": "France" },
    { "id": "b", "text": "Japon" },
    { "id": "c", "text": "Allemagne" },
    { "id": "d", "text": "Brésil" }
  ],
  "correctAnswer": ["a", "c"]
}
```

- Les réponses doivent toutes correspondre exactement (ordre insensible)
- Le participant doit appuyer sur "Valider" après avoir sélectionné

---

## Vrai / Faux (`true_false`)

Question binaire. Deux grands boutons Vrai / Faux.

**Configuration**
```json
{
  "type": "true_false",
  "content": "La Tour Eiffel a été construite en 1889.",
  "correctAnswer": "true"
}
```

- Pas d'options à définir
- La réponse est validée dès le clic

---

## Texte libre (`free_text`)

Le participant saisit sa réponse au clavier. Plusieurs variantes acceptées (insensible à la casse et aux espaces).

**Configuration**
```json
{
  "type": "free_text",
  "content": "Quelle est la formule chimique de l'eau ?",
  "correctAnswer": ["H2O", "h2o", "H₂O"]
}
```

- Comparaison insensible à la casse et aux espaces superflus
- Plusieurs variantes acceptées (tableau)
- Si `correctAnswer` est vide/null → toutes les réponses comptent comme correctes

---

## Image (`image`)

Une image est affichée au-dessus de la question, avec des options de réponse textuelles.

**Configuration**
```json
{
  "type": "image",
  "content": "Quel pays est représenté sur ce drapeau ?",
  "mediaUrl": "/uploads/media/drapeau_france.jpg",
  "mediaType": "image",
  "options": [
    { "id": "a", "text": "Italie" },
    { "id": "b", "text": "France" },
    { "id": "c", "text": "Pays-Bas" }
  ],
  "correctAnswer": "b"
}
```

- En mode Projection, l'image s'affiche sur le grand écran
- En mode Appareils, l'image s'affiche sur chaque appareil
- Upload via l'interface ou URL externe

---

## Audio (`audio`)

Un son est joué automatiquement. Le participant écoute et choisit la bonne réponse.

**Configuration**
```json
{
  "type": "audio",
  "content": "Quel artiste interprète cette chanson ?",
  "mediaUrl": "/uploads/media/extrait_musique.mp3",
  "mediaType": "audio",
  "options": [
    { "id": "a", "text": "Daft Punk" },
    { "id": "b", "text": "The Weeknd" },
    { "id": "c", "text": "Stromae" }
  ],
  "correctAnswer": "c"
}
```

- Formats supportés : MP3, OGG, WAV
- Le son se lance automatiquement à l'affichage de la question
- En mode Projection, le son est joué sur le navigateur de la projection

---

## Vidéo (`video`)

Une vidéo est jouée. Peut être utilisée pour des devinettes visuelles ou musicales.

**Configuration**
```json
{
  "type": "video",
  "content": "De quel film est tiré cet extrait ?",
  "mediaUrl": "/uploads/media/extrait_film.mp4",
  "mediaType": "video",
  "options": [
    { "id": "a", "text": "Star Wars" },
    { "id": "b", "text": "Indiana Jones" },
    { "id": "c", "text": "Jurassic Park" }
  ],
  "correctAnswer": "a"
}
```

- Formats supportés : MP4, WebM
- Lecture automatique avec les contrôles vidéo

---

## Curseur (`slider`)

Le participant déplace un curseur pour choisir une valeur numérique.

**Configuration**
```json
{
  "type": "slider",
  "content": "En quelle année la Révolution française a-t-elle débuté ?",
  "options": {
    "min": 1750,
    "max": 1810,
    "tolerance": 2
  },
  "correctAnswer": 1789
}
```

- `tolerance` : nombre d'unités d'écart accepté (ex: `2` accepte 1787–1791)
- Idéal pour des questions de date, quantité, température, etc.
- Affiche la valeur sélectionnée en temps réel

---

## Ordre (`ordering`)

Le participant remet une liste d'éléments dans le bon ordre.

**Configuration**
```json
{
  "type": "ordering",
  "content": "Remettez ces événements dans l'ordre chronologique.",
  "options": [
    { "id": "a", "text": "Première Guerre Mondiale" },
    { "id": "b", "text": "Révolution française" },
    { "id": "c", "text": "Chute du mur de Berlin" },
    { "id": "d", "text": "Seconde Guerre Mondiale" }
  ],
  "correctAnswer": ["b", "a", "d", "c"]
}
```

- Les éléments sont affichés dans un ordre aléatoire
- Le participant les glisse pour les réordonner
- La correspondance doit être exacte

---

## Association (`matching`)

Le participant associe des éléments de la colonne gauche avec la colonne droite.

**Configuration**
```json
{
  "type": "matching",
  "content": "Associez chaque capitale à son pays.",
  "options": [
    { "id": "paris", "text": "Paris" },
    { "id": "berlin", "text": "Berlin" },
    { "id": "rome", "text": "Rome" }
  ],
  "correctAnswer": {
    "paris": "France",
    "berlin": "Allemagne",
    "rome": "Italie"
  }
}
```

- Chaque élément de gauche doit être associé à la bonne valeur de droite
- Toutes les associations doivent être correctes pour marquer des points

---

## Sondage (`poll`)

Vote sans bonne réponse. Utile pour des questions d'opinion ou des brise-glace.

**Configuration**
```json
{
  "type": "poll",
  "content": "Quelle est votre pizza préférée ?",
  "options": [
    { "id": "a", "text": "Margherita" },
    { "id": "b", "text": "Quattro Formaggi" },
    { "id": "c", "text": "Calzone" }
  ],
  "correctAnswer": null
}
```

- Aucun point attribué
- Les résultats s'affichent en temps réel sur la projection
- Idéal en début de quiz pour engager les participants

---

## Paramètres communs

Ces paramètres s'appliquent à tous les types :

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `points` | `int \| null` | Défaut quiz | Points si null, utilise `defaultPoints` du quiz |
| `timeLimit` | `int \| null` | Défaut quiz | Secondes si null, utilise `defaultTimeLimit` (0 = illimité) |
| `explanation` | `string \| null` | — | Texte affiché après la réponse |
| `hint` | `string \| null` | — | Révélé lorsque le bonus 💡 Indice est utilisé |
| `isBonus` | `bool` | `false` | Si vrai, la bonne réponse donne un bonus |
| `bonusReward` | `object \| null` | — | `{ type: "double_points" }` ou `null` pour aléatoire |

---

## Bonus de vitesse

Pour toutes les questions avec limite de temps, un bonus de vitesse s'applique :

```
Points finaux = Points de base + round(Points de base × 0.2 × (1 - tempsUtilisé/tempsTotalMs))
```

Exemple : 10 pts de base, répondu en 5s sur 30s → +1 point de vitesse = 11 points total.
