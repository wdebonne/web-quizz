# Système de bonus

Le système de bonus ajoute une couche stratégique et ludique au quiz. Les participants peuvent collecter des bonus et les utiliser pour se booster ou attaquer les adversaires.

---

## Comment obtenir un bonus

1. **Questions bonus** — Certaines questions sont marquées comme "Bonus" par le créateur. Répondre correctement à une question bonus attribue un bonus.
2. **Bonus prédéfini** — Le créateur associe un type de bonus spécifique à la question.
3. **Bonus aléatoire** — Si aucun type n'est défini, un bonus aléatoire parmi les 12 types est attribué.

---

## Les 12 types de bonus

### 🛡️ Immunité (`immunity`)
**Catégorie :** Défense

Protège le porteur contre le prochain bonus d'attaque reçu. L'immunité est consommée automatiquement au moment de l'attaque.

- L'adversaire qui vous attaque ne récupère pas son bonus
- Visible par tous lors de l'activation (animation)
- Dure jusqu'à utilisation ou fin de partie

---

### ✖️2 Double Points (`double_points`)
**Catégorie :** Boost

Double les points gagnés sur la **prochaine question** répondue correctement.

- S'applique avant le bonus de vitesse
- Consommé automatiquement après la question
- Exemple : 10 pts × 2 + bonus vitesse = 22 pts

---

### ⏰ Temps Bonus (`extra_time`)
**Catégorie :** Boost

Ajoute +15 secondes au timer de la prochaine question.

- Utilisable avant ou pendant la question
- Le timer affiché est mis à jour visuellement
- Sans effet si la question n'a pas de limite de temps

---

### 🎯 Réponse Libre (`free_answer`)
**Catégorie :** Boost

La prochaine réponse est **toujours validée comme correcte**, quelle que soit la réponse donnée (même fausse, même vide).

- Points de base attribués comme si la réponse était juste
- Consommé automatiquement après la question
- Peut être combiné avec Double Points

---

### 💸 Vol de Points (`steal_points`)
**Catégorie :** Attaque

Vole **10 %** du score actuel d'un participant ou d'une équipe ciblée.

- Cible sélectionnable parmi tous les adversaires
- Bloqué par 🛡️ Immunité
- Le voleur récupère les points volés (+10 % du score cible)
- Le minimum volé est 0 (ne peut pas faire tomber en négatif)

---

### 🧊 Gel (`freeze`)
**Catégorie :** Attaque

Le timer de la cible s'**écoule deux fois plus vite** pendant la prochaine question.

- Bloqué par 🛡️ Immunité
- Animation visuelle sur l'appareil de la cible (bordure bleue)
- Sans effet si la question n'a pas de limite de temps

---

### ⏭️ Passer (`skip_question`)
**Catégorie :** Neutre

Permet de **sauter la prochaine question** sans pénalité et sans points.

- Consommé automatiquement
- La question suivante du déroulé n'est pas affectée
- Utile pour éviter un sujet sur lequel on est mauvais

---

### 💡 Indice (`hint`)
**Catégorie :** Boost

Révèle l'**indice** de la question en cours (si le créateur en a configuré un).

- Utilisable uniquement pendant une question
- L'indice s'affiche sous le texte de la question
- Si aucun indice n'est configuré, le bonus est gâché (sans effet)

---

### 🔄 Inversé (`reverse`)
**Catégorie :** Attaque

La cible **perd les points** qu'elle gagnerait sur sa prochaine question correcte.

- Bloqué par 🛡️ Immunité
- Si la cible répond faux, pas d'effet (elle ne gagnait rien)
- Animation spéciale sur la projection

---

### ✅ Erreur Gratuite (`extra_wrong`)
**Catégorie :** Boost

Tolère **une mauvaise réponse supplémentaire** sans pénalité.

- Ne s'applique qu'aux questions avec pénalité activée
- Consommé automatiquement après la première mauvaise réponse
- N'augmente pas le nombre de tentatives (réponse déjà envoyée)

---

### 🙈 Aveugle (`blind`)
**Catégorie :** Attaque

Cache les **options de réponse** à la cible pendant les **10 premières secondes** de la question.

- Bloqué par 🛡️ Immunité
- La cible voit uniquement la question, pas les choix
- Peut répondre en texte libre si elle connaît la réponse
- Sans effet sur les questions sans options (texte libre, slider)

---

### 🔀 Échange (`swap_scores`)
**Catégorie :** Attaque

**Échange** le score du porteur avec celui d'une cible.

- Bloqué par 🛡️ Immunité chez la cible
- Stratégique : à utiliser quand la cible a plus de points que vous
- Animation spectaculaire sur la projection

---

## Catégories de bonus

| Catégorie | Couleur | Bonus |
|-----------|---------|-------|
| 🟦 Défense | Bleu/Cyan | Immunité |
| 🟨 Boost | Jaune/Vert | Double Points, Temps Bonus, Réponse Libre, Indice, Erreur Gratuite, Passer |
| 🟥 Attaque | Rouge/Orange | Vol de Points, Gel, Inversé, Aveugle, Échange |

---

## Interactions entre bonus

| Attaquant | Défenseur avec Immunité | Résultat |
|-----------|------------------------|---------|
| Vol de Points | 🛡️ | Immunité consommée, vol annulé |
| Gel | 🛡️ | Immunité consommée, gel annulé |
| Inversé | 🛡️ | Immunité consommée, inversion annulée |
| Aveugle | 🛡️ | Immunité consommée, aveuglement annulé |
| Échange | 🛡️ | Immunité consommée, échange annulé |

---

## Interface participant

Les bonus sont affichés dans la barre supérieure de l'interface de jeu (bouton ⭐). En cliquant dessus :
- Un panneau déroulant s'ouvre avec toutes les cartes de bonus
- Les bonus d'attaque affichent un sélecteur de cible (participants ou équipes)
- Les bonus de boost s'appliquent immédiatement sans sélection de cible
- Les bonus actifs ne peuvent pas être utilisés après avoir répondu à la question en cours

---

## Animations

| Événement | Animation |
|-----------|-----------|
| Réception d'un bonus | Carte animée au centre de l'écran (3 sec) |
| Activation d'un bonus par n'importe qui | Bannière animée sur la projection |
| Attaque reçue | Bordure rouge pulsante + notification |
| Immunité activée | Bouclier doré animé |
| Double Points actif | Indicateur ✖️2 visible sur la question |

---

## Bonus personnalisés

Le créateur peut définir des bonus personnalisés depuis l'onglet "Bonus" de l'éditeur de quiz. Ces bonus utilisent les mêmes types (`type` parmi les 12 définis) mais avec un nom, une icône et une description personnalisés.

Exemple : créer un bonus "Super Boost" qui utilise le type `double_points` avec une description custom et l'icône 🚀.
