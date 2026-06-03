# Changelog

Toutes les modifications notables de QuizzApp sont documentées ici.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Ce projet suit [Semantic Versioning](https://semver.org/lang/fr/).

---

## [Unreleased]

### Prévu
- Internationalisation (i18n) — FR/EN/ES
- Mode tournoi (bracket éliminatoire)
- Import de quiz depuis CSV / Google Forms
- Application mobile native (React Native)
- Statistiques avancées par question

---

## [1.0.0] — 2026-06-03

### Ajouté

#### Gestion des quiz
- Création et édition de séries de quiz
- 11 types de questions : Choix unique, Choix multiple, Vrai/Faux, Texte libre, Image, Audio, Vidéo, Curseur, Sondage, Ordre, Association
- Configuration des points par question ou par défaut quiz
- Pénalité paramétrable pour les mauvaises réponses (0–100 %)
- Limite de temps par question ou globale
- Ajout d'une explication affichée après la réponse
- Système d'indice révélé par le bonus Indice
- Gestion des questions bonus avec récompense paramétrable
- Upload de médias (image, audio, vidéo) pour les questions
- Réordonnancement des questions par glisser-déposer
- Tags et image de couverture pour les quiz

#### Système de jeu
- Génération de code de partie (6 caractères alphanumériques)
- Génération de QR code pour rejoindre une partie
- Deux modes de jeu : Projection et Appareils
- Lobby en temps réel avec liste des participants
- Démarrage, pause, reprise et fin de partie
- Timer par question avec barre de progression animée
- Bonus de vitesse (jusqu'à +20 % selon le temps de réponse)
- Compteur de série (streak) avec bonus multiplicateur visuel
- Page de projection plein écran avec animations

#### Équipes
- Mode équipe activable par partie
- Deux sous-modes : appareil partagé / chacun son appareil
- QR code et lien d'équipe pour rejoindre directement
- Chat intra-équipe
- Classement par équipe sur la projection

#### Participants
- Rejoindre via code, lien ou QR code
- Choix d'avatar parmi 30 avatars DiceBear prédéfinis
- Import d'un avatar personnalisé (JPG, PNG, GIF, WebP)
- Approbation / refus des avatars personnalisés par le créateur
- Attribution automatique d'un avatar non utilisé en cas de refus
- Pseudo unique par partie

#### Système de bonus (12 types)
- 🛡️ Immunité — protège des attaques pendant 1 question
- ✖️2 Double Points — double les points sur la prochaine question
- ⏰ Temps Bonus — +15 secondes sur la prochaine question
- 🎯 Réponse Libre — prochaine réponse toujours correcte
- 💸 Vol de Points — vole 10 % des points d'une cible
- 🧊 Gel — accélère le timer de la cible ×2
- ⏭️ Passer — passe une question sans pénalité
- 💡 Indice — révèle l'indice de la question
- 🔄 Inversé — la cible perd les points qu'elle gagnerait
- ✅ Erreur Gratuite — une mauvaise réponse tolérée
- 🙈 Aveugle — cache les options à la cible
- 🔀 Échange — échange les scores avec la cible
- Bonus personnalisés créables depuis l'interface

#### Communication
- Chat en temps réel (créateur ↔ tous / équipe / participant)
- Chat intra-équipe pendant le lobby
- Messages système automatiques (connexion, déconnexion)
- Notifications de bonus avec animations

#### Historique
- Sauvegarde automatique des parties terminées
- Classement final complet (participants et équipes)
- Durée de la partie, nombre de joueurs, nombre de questions
- Suppression individuelle ou globale par l'admin

#### Administration
- Gestion des utilisateurs (créer, modifier, désactiver, supprimer)
- Rôles : Admin et Créateur
- Configuration SMTP pour emails (reset MDP, invitations)
- Invitation d'utilisateurs par email
- Personnalisation : nom de l'app, logo, favicon, couleurs
- Templates d'objet des emails
- Changement de mot de passe obligatoire à la première connexion
- Réinitialisation de mot de passe par email (token 1h)

#### Infrastructure
- Conteneurisation Docker (2 containers : app + db)
- Build multi-stage Dockerfile (React → Node.js)
- Health checks sur les deux containers
- Volumes persistants pour PostgreSQL et les uploads
- Configuration via variables d'environnement
- Rate limiting API (500 req / 15 min)
- Helmet pour les en-têtes HTTP de sécurité
- JWT avec refresh token (7j / 30j)

---

## Légende des types de changements

- **Ajouté** — nouvelles fonctionnalités
- **Modifié** — changements de fonctionnalités existantes
- **Déprécié** — fonctionnalités bientôt supprimées
- **Supprimé** — fonctionnalités retirées
- **Corrigé** — corrections de bugs
- **Sécurité** — corrections de vulnérabilités
