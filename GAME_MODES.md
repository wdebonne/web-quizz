# Modes de jeu

QuizzApp propose deux modes de jeu adaptés à différentes configurations (en présentiel ou à distance).

---

## Mode Projection (`projection`)

### Principe

Les **questions s'affichent sur un grand écran** (projecteur, TV, partage d'écran en visio) et les participants **répondent uniquement sur leurs appareils**.

```
Écran de projection                    Appareils participants
┌─────────────────────────────┐        ┌──────────────────┐
│  Question 3 / 10            │        │  🦊 Alice        │
│                             │        │  Score: 45 pts   │
│  "Quelle est la capitale    │        │                  │
│   de l'Australie ?"         │        │  A 🟥  B 🟦      │
│                             │        │  C 🟨  D 🟩      │
│  A. Sydney                  │        │                  │
│  B. Melbourne               │        │  ⏱️ 22s restant  │
│  C. Canberra                │        └──────────────────┘
│  D. Brisbane                │
│         ⏱️ 22s              │
└─────────────────────────────┘
```

### Usage typique
- Soirée quiz entre amis ou en famille
- Animation d'entreprise
- Salle de classe
- Événement avec grand groupe

### Configuration
- Ouvrir la page de projection sur le navigateur connecté au projecteur : `http://localhost:3000/projection/<sessionId>`
- F11 pour passer en plein écran
- Les participants rejoignent sur leurs téléphones/tablettes

### Avantages
- Interface épurée sur les appareils (uniquement les choix de réponse)
- Grande lisibilité de la question
- Tension collective devant l'écran partagé

---

## Mode Appareils (`device`)

### Principe

**Question et réponses s'affichent sur chaque appareil**. Idéal pour jouer à distance. Le créateur dispose d'une page de projection optionnelle qui affiche les scores en temps réel sous forme de **course animée**.

```
Appareil participant                    Page de projection (optionnelle)
┌──────────────────────────┐           ┌─────────────────────────────────┐
│  Q3/10  ⏱️ 22s           │           │       🏆 Classement Live         │
│                          │           │                                  │
│  "Quelle est la capitale │           │  1 🦊 Alice  ████████████ 95    │
│   de l'Australie ?"      │           │  2 🐺 Bob    ████████░░░░ 72    │
│                          │           │  3 🦁 Carol  ██████░░░░░░ 58    │
│  🟥 Sydney               │           │  4 🐯 David  ████░░░░░░░░ 41    │
│  🟦 Melbourne            │           │                                  │
│  🟨 Canberra             │           │    [Animation de course en       │
│  🟩 Brisbane             │           │     temps réel avec avatars]     │
└──────────────────────────┘           └─────────────────────────────────┘
```

### Usage typique
- Quiz en ligne / à distance (visioconférence)
- Jeu en autonomie (chacun à son rythme si mode sans timer)
- Animation avec participants dans des salles différentes

### Configuration
- Même procédure de création de partie
- Le créateur peut partager la page de projection en partage d'écran lors d'un appel vidéo

### Page de projection — Mode course
La projection en mode Appareils affiche une course animée :
- Les avatars se déplacent horizontalement selon leur score relatif
- Le leader est toujours en tête avec 90 % de la largeur
- Mise à jour en temps réel après chaque réponse
- Animation Framer Motion fluide

---

## Mode équipe

Disponible dans les deux modes de jeu, activable à la création de la partie.

### Sous-mode : Appareil partagé

Un seul appareil par équipe (le capitaine répond pour tous).

```
Configuration    Rejoindre la partie
┌────────────┐   ┌──────────────────────┐
│ QR global  │   │ Scan QR → équipe → OK│
└────────────┘   └──────────────────────┘
```

### Sous-mode : Appareils individuels

Chaque membre de l'équipe a son propre appareil.

```
Créateur d'équipe        Membres de l'équipe
┌────────────────┐       ┌──────────────────────────┐
│ Créer équipe   │──────►│ QR code d'équipe généré  │
│ "Les Champions"│       │ Code: WXYZ               │
│ Code: WXYZ     │       └──────────────────────────┘
└────────────────┘             │
                         Chaque membre scan →
                         rejoint l'équipe directement
```

**Flux de communication en équipe :**
- Chat intra-équipe pendant le lobby (stratégie avant le début)
- Scores agrégés par équipe (somme des scores individuels)
- Le classement sur la projection affiche les équipes

---

## Choisir le bon mode

| Critère | Projection | Appareils |
|---------|-----------|-----------|
| En présentiel | ✅ Idéal | ✅ Possible |
| À distance | ❌ Difficile | ✅ Idéal |
| Grand groupe (>30) | ✅ | ✅ |
| Tension collective | ✅ Forte | ⚠️ Moins |
| Projection des scores | Optionnel | Recommandé |
| Questions visuelles | ✅ Grand écran | ✅ Chaque appareil |

---

## Pages de projection

| URL | Usage |
|-----|-------|
| `/projection/:sessionId` | Page plein écran pour le projecteur |

La page de projection fonctionne **sans connexion créateur** — n'importe quel navigateur peut l'afficher. Elle se connecte en lecture seule via Socket.io et affiche automatiquement :
- Le lobby (code + QR en attente)
- Les questions (mode Projection)
- La course de scores (mode Appareils)
- Les résultats finaux avec animations
- Les notifications de bonus
