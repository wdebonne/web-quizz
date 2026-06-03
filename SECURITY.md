# Sécurité

---

## Mesures en place

### Authentification
- **JWT** (JSON Web Tokens) avec deux niveaux :
  - Access token (durée 7 jours)
  - Refresh token (durée 30 jours) pour renouveler sans re-connexion
- **bcrypt** (coût 12) pour le hachage des mots de passe
- Réinitialisation de mot de passe via token aléatoire (32 octets hex) expirant en 1 heure
- Changement de mot de passe obligatoire à la première connexion

### Autorisation
- Middleware `authenticate` vérifie le JWT sur toutes les routes protégées
- Middleware `requireRole` contrôle admin/creator
- Vérification du `userId` ou du rôle `admin` sur chaque ressource (impossible d'accéder aux quizzes d'un autre utilisateur)

### Transport
- **Helmet.js** ajoute les en-têtes HTTP de sécurité (HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
- CORS restreint à l'`APP_URL` configurée
- HTTPS recommandé en production via reverse proxy (voir [DEPLOYMENT.md](DEPLOYMENT.md))

### Validation des entrées
- **express-validator** sur toutes les routes mutantes
- Sequelize utilise des requêtes paramétrées (protection SQL injection)
- React échappe automatiquement le HTML (protection XSS)

### Uploads de fichiers
- Whitelist des types MIME (image, audio, video seulement)
- Limite de taille à 50 MB
- Les noms de fichiers sont générés aléatoirement (pas d'injection de chemin)
- Stockés hors de la racine web dans `/uploads/`

### Rate limiting
- 500 requêtes par 15 minutes par IP sur `/api/*`

---

## Checklist de durcissement en production

### Obligatoire avant le premier déploiement

- [ ] Changer le mot de passe admin (`admin@quizz.local` / `Admin1234!`)
- [ ] Définir `JWT_SECRET` avec une valeur aléatoire de **64+ caractères** :
  ```bash
  openssl rand -hex 32
  ```
- [ ] Définir `JWT_REFRESH_SECRET` avec une **valeur différente** de JWT_SECRET
- [ ] Définir `DB_PASSWORD` avec un mot de passe fort
- [ ] Définir `APP_URL` avec l'URL HTTPS publique exacte
- [ ] Configurer un reverse proxy avec HTTPS (Let's Encrypt)

### Recommandé

- [ ] Limiter l'accès au port PostgreSQL (5432) au réseau interne Docker uniquement — c'est déjà le cas par défaut dans `docker-compose.yml` (pas de `ports` exposés sur `db`)
- [ ] Activer `registration_enabled: false` si vous ne souhaitez pas d'inscriptions publiques
- [ ] Configurer les sauvegardes automatiques (voir [DEPLOYMENT.md](DEPLOYMENT.md))
- [ ] Surveiller les logs pour détecter les tentatives de connexion en masse

---

## Signaler une vulnérabilité

Si vous découvrez une faille de sécurité, merci de **ne pas l'ouvrir publiquement** en issue GitHub.

Envoyez un email à l'administrateur de l'instance en décrivant :
1. Le type de vulnérabilité
2. Les étapes pour la reproduire
3. L'impact potentiel

Nous répondrons dans les 48h et fournirons un correctif dans les meilleurs délais.

---

## Dépendances surveillées

Les dépendances sont auditées régulièrement avec :

```bash
# Backend
cd backend && npm audit

# Frontend
cd frontend && npm audit
```

Pour appliquer les correctifs automatiques :
```bash
npm audit fix
```
