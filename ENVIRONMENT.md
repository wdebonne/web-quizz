# Variables d'environnement

Référence complète de toutes les variables d'environnement supportées par QuizzApp.

---

## Fichier `.env`

Copier `.env.example` vers `.env` et adapter les valeurs :

```bash
cp .env.example .env
```

---

## Référence

### Application

| Variable | Obligatoire | Défaut | Description |
|----------|:-----------:|--------|-------------|
| `APP_PORT` | Non | `3000` | Port HTTP exposé par le container |
| `APP_URL` | **Oui** | `http://localhost:3000` | URL publique complète (utilisée pour les QR codes et les liens d'invitation) |
| `APP_NAME` | Non | `QuizzApp` | Nom de l'application (modifiable aussi depuis l'interface admin) |
| `NODE_ENV` | Non | `production` | Environnement Node.js (`production` ou `development`) |

> En `development`, Sequelize affiche les requêtes SQL dans la console et utilise `alter:true` pour les migrations.

---

### Base de données

| Variable | Obligatoire | Défaut | Description |
|----------|:-----------:|--------|-------------|
| `DB_HOST` | Non | `db` | Hôte PostgreSQL (nom du service Docker Compose en production) |
| `DB_PORT` | Non | `5432` | Port PostgreSQL |
| `DB_NAME` | Non | `quizz` | Nom de la base de données |
| `DB_USER` | Non | `quizz` | Utilisateur PostgreSQL |
| `DB_PASSWORD` | **Oui** | — | Mot de passe PostgreSQL |

---

### Sécurité JWT

| Variable | Obligatoire | Description |
|----------|:-----------:|-------------|
| `JWT_SECRET` | **Oui** | Secret pour signer les **access tokens** (7 jours). Minimum 32 caractères. Utilisez `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | **Oui** | Secret pour les **refresh tokens** (30 jours). Doit être **différent** de `JWT_SECRET` |

> ⚠️ Si ces valeurs changent, tous les tokens existants deviennent invalides et les utilisateurs devront se reconnecter.

---

### SMTP (emails)

Tous optionnels. Si non configurés, les fonctionnalités email (reset MDP, invitations) sont silencieusement ignorées.

| Variable | Défaut | Description |
|----------|--------|-------------|
| `SMTP_HOST` | — | Serveur SMTP (ex: `smtp.gmail.com`, `mail.infomaniak.com`) |
| `SMTP_PORT` | `587` | Port SMTP |
| `SMTP_SECURE` | `false` | `true` pour SSL/TLS (port 465), `false` pour STARTTLS (port 587) |
| `SMTP_USER` | — | Identifiant de connexion SMTP |
| `SMTP_PASS` | — | Mot de passe SMTP |
| `SMTP_FROM` | `noreply@quizz.local` | Adresse d'expéditeur affichée dans les emails |

> Ces paramètres peuvent aussi être configurés depuis l'interface admin (onglet SMTP) et sont alors stockés en base de données. La priorité est : **base de données > variable d'environnement**.

---

## Exemples de configuration SMTP

### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre@gmail.com
SMTP_PASS=votre_app_password_gmail
SMTP_FROM=votre@gmail.com
```

> Pour Gmail, créer un **App Password** dans Sécurité > Connexion Google > Mots de passe des applications.

### Infomaniak

```env
SMTP_HOST=mail.infomaniak.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre@domaine.com
SMTP_PASS=votre_mot_de_passe
SMTP_FROM=noreply@domaine.com
```

### OVH

```env
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre@domaine.com
SMTP_PASS=votre_mot_de_passe
```

### Serveur local Mailhog (développement)

```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=dev@quizz.local
```

---

## Génération de secrets sécurisés

### Sous Linux/macOS

```bash
# JWT_SECRET
openssl rand -hex 32
# Exemple : a3f7e2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1

# JWT_REFRESH_SECRET (valeur différente)
openssl rand -hex 32
```

### Sous Windows (PowerShell)

```powershell
[System.Web.Security.Membership]::GeneratePassword(64, 8)
# ou
-join (1..64 | ForEach { [char](Get-Random -Min 65 -Max 90) })
```

### En ligne

- [https://www.uuidgenerator.net/](https://www.uuidgenerator.net/) (UUID v4)
- [https://randomkeygen.com/](https://randomkeygen.com/) (clés aléatoires)

---

## Variables dans Portainer

Dans Portainer → Stack → Environment variables, ajouter :

```
DB_PASSWORD      →  [valeur]
JWT_SECRET       →  [64 chars aléatoires]
JWT_REFRESH_SECRET → [64 autres chars aléatoires]
APP_URL          →  https://quizz.mondomaine.com
```

Les variables définies dans l'interface Portainer écrasent celles du `.env` embarqué dans l'image.

---

## Ordre de priorité des paramètres SMTP

```
1. Base de données (paramètres admin)       ← plus haute priorité
2. Variables d'environnement (.env)
3. Valeurs par défaut dans le code
```

Cela permet de configurer SMTP via l'interface admin **sans redémarrer les containers**.
