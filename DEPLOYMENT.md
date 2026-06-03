# Guide de déploiement

---

## Prérequis

| Logiciel | Version minimale |
|----------|-----------------|
| Docker | 24.x |
| Docker Compose | 2.x (`docker compose`) |
| Git | 2.x |
| Portainer CE (optionnel) | 2.x |

---

## 1. Déploiement local (développement)

### Cloner et configurer

```bash
git clone <url-depot> quizzapp
cd quizzapp
cp .env.example .env
```

Éditez `.env` :

```env
APP_PORT=3000
APP_URL=http://localhost:3000
DB_PASSWORD=mon_mot_de_passe_securise
JWT_SECRET=une_chaine_aleatoire_de_minimum_32_caracteres
JWT_REFRESH_SECRET=une_autre_chaine_aleatoire_differente
```

### Lancer avec Docker Compose

```bash
docker compose up -d --build
```

L'application est disponible sur `http://localhost:3000`.

### Arrêter

```bash
docker compose down
```

### Arrêter et supprimer les données

```bash
docker compose down -v
```

> ⚠️ L'option `-v` supprime les volumes (base de données + uploads).

---

## 2. Déploiement production (serveur Linux)

### Préparer le serveur

```bash
# Installer Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Cloner le projet
git clone <url-depot> /opt/quizzapp
cd /opt/quizzapp
cp .env.example .env
```

### Configurer `.env` pour la production

```env
APP_PORT=3000
APP_URL=https://quizz.mondomaine.com    # URL publique HTTPS

DB_NAME=quizz
DB_USER=quizz
DB_PASSWORD=<mot_de_passe_fort_aleatoire>

JWT_SECRET=<64_caracteres_aleatoires>
JWT_REFRESH_SECRET=<64_autres_caracteres>

# SMTP (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre@gmail.com
SMTP_PASS=app_password_gmail
SMTP_FROM=noreply@mondomaine.com
```

### Lancer en production

```bash
docker compose up -d --build
```

### Configurer un reverse proxy (Nginx recommandé)

```nginx
# /etc/nginx/sites-available/quizzapp
server {
    listen 80;
    server_name quizz.mondomaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name quizz.mondomaine.com;

    ssl_certificate /etc/letsencrypt/live/quizz.mondomaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/quizz.mondomaine.com/privkey.pem;

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts pour les longues connexions
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # Limite taille upload
    client_max_body_size 55M;
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/quizzapp /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# HTTPS avec Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d quizz.mondomaine.com
```

---

## 3. Déploiement via Portainer

### Méthode A — Stack depuis Git (recommandée)

1. Portainer → **Stacks** → **Add stack**
2. Nom : `quizzapp`
3. **Build method** : `Repository`
4. Repository URL : `https://github.com/votre-user/quizzapp.git`
5. Branch : `main`
6. Compose path : `docker-compose.yml`
7. Variables d'environnement → **Add an environment variable** :

| Nom | Valeur |
|-----|--------|
| `DB_PASSWORD` | `votre_mot_de_passe` |
| `JWT_SECRET` | `votre_secret_64chars` |
| `JWT_REFRESH_SECRET` | `votre_autre_secret` |
| `APP_URL` | `https://quizz.mondomaine.com` |
| `SMTP_HOST` | `smtp.gmail.com` (optionnel) |

8. **Deploy the stack**

Portainer détectera les changements Git si vous activez le **Auto update** (webhook ou polling).

### Méthode B — Stack depuis l'éditeur Portainer

1. **Stacks** → **Add stack** → **Web editor**
2. Coller le contenu de `docker-compose.yml`
3. Ajouter les variables d'environnement (onglet **Environment variables**)
4. **Deploy the stack**

### Mise à jour avec Portainer

1. Aller dans la stack `quizzapp`
2. **Pull and redeploy** (si depuis Git) ou éditer et re-déployer

---

## 4. Mise à jour manuelle

```bash
cd /opt/quizzapp
git pull origin main
docker compose up -d --build
```

Les données sont préservées dans les volumes Docker.

---

## 5. Sauvegarde et restauration

### Sauvegarder la base de données

```bash
docker exec quizz-db pg_dump -U quizz quizz > backup_$(date +%Y%m%d).sql
```

### Restaurer la base de données

```bash
cat backup_20260603.sql | docker exec -i quizz-db psql -U quizz quizz
```

### Sauvegarder les uploads

```bash
# Depuis le volume Docker
docker run --rm \
  -v quizzapp_uploads_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/uploads_$(date +%Y%m%d).tar.gz /data
```

### Sauvegarde automatique (cron)

```bash
# Éditer la crontab
crontab -e

# Sauvegarder chaque jour à 3h du matin, garder 30 jours
0 3 * * * docker exec quizz-db pg_dump -U quizz quizz > /opt/backups/quizz_$(date +\%Y\%m\%d).sql && find /opt/backups -name "quizz_*.sql" -mtime +30 -delete
```

---

## 6. Surveillance et logs

### Voir les logs en temps réel

```bash
# Tous les services
docker compose logs -f

# Application uniquement
docker compose logs -f app

# Base de données uniquement
docker compose logs -f db
```

### Statut des containers

```bash
docker compose ps
```

### Ressources utilisées

```bash
docker stats quizz-app quizz-db
```

---

## 7. Variables d'environnement — Référence complète

| Variable | Obligatoire | Défaut | Description |
|----------|------------|--------|-------------|
| `APP_PORT` | Non | `3000` | Port exposé |
| `APP_URL` | Oui | `http://localhost:3000` | URL publique (utilisée pour les QR codes et emails) |
| `APP_NAME` | Non | `QuizzApp` | Nom affiché (modifiable aussi dans l'admin) |
| `DB_HOST` | Non | `db` (service Docker) | Hôte PostgreSQL |
| `DB_PORT` | Non | `5432` | Port PostgreSQL |
| `DB_NAME` | Non | `quizz` | Nom de la base |
| `DB_USER` | Non | `quizz` | Utilisateur PostgreSQL |
| `DB_PASSWORD` | **Oui** | — | Mot de passe PostgreSQL |
| `JWT_SECRET` | **Oui** | — | Secret pour signer les access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | **Oui** | — | Secret pour les refresh tokens (différent du JWT_SECRET) |
| `SMTP_HOST` | Non | — | Hôte SMTP |
| `SMTP_PORT` | Non | `587` | Port SMTP |
| `SMTP_SECURE` | Non | `false` | `true` pour SSL/TLS (port 465) |
| `SMTP_USER` | Non | — | Identifiant SMTP |
| `SMTP_PASS` | Non | — | Mot de passe SMTP |
| `SMTP_FROM` | Non | `noreply@quizz.local` | Adresse d'expédition |

---

## 8. Dépannage

### Le container `app` ne démarre pas

```bash
docker compose logs app
```

Causes fréquentes :
- La base de données n'est pas encore prête → attendre quelques secondes, le healthcheck gère cela
- Variable `JWT_SECRET` manquante
- Port 3000 déjà utilisé → changer `APP_PORT`

### Impossible de se connecter à la base

```bash
docker compose exec app node -e "require('./src/config/database').sequelize.authenticate().then(() => console.log('OK')).catch(console.error)"
```

### Réinitialiser le mot de passe admin sans email

```bash
docker compose exec db psql -U quizz quizz -c "
UPDATE users SET
  password = '\$2a\$12\$LRkTKzFGRUFBPXJf9qOJDO5tVLSn7eEeNEXxb47zqHJ0T8gYXfTMi',
  \"mustChangePassword\" = true
WHERE email = 'admin@quizz.local';"
```
> Ce hash correspond au mot de passe `Admin1234!`.

### Uploads non persistants après redémarrage

Vérifier que le volume `uploads_data` est bien monté :
```bash
docker compose config | grep -A3 volumes
docker volume ls | grep uploads
```
