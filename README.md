# G-Rard - Trello / Drive / GitHub vers Discord

Bot Node.js qui envoie des notifications Trello, Google Drive et GitHub dans des salons Discord.

Objectif principal:
- Ping un role Discord sur les evenements importants (mention en fin de message, dans un spoiler).
- Afficher l'auteur avec son pseudo Discord si un mapping existe.
- Fallback sur le pseudo de la plateforme uniquement quand il n'y a pas de mapping.

## 1. Prerequis

- Node.js 18+ et npm
- Un serveur Discord ou vous pouvez ajouter un bot
- Un endpoint HTTP public (VPS, Docker, cloud, tunnel ngrok/cloudflared)
- Trello API key + Trello API secret + token utilisateur (pour creer le webhook)
- Optionnel Drive: un projet Google Cloud + compte de service
- Optionnel GitHub: un depot avec droits admin pour configurer un webhook

## 2. Installation du projet

```bash
git clone https://github.com/Plok-Code/G-rard.git
cd G-rard
npm install
```

## 3. Creation du bot Discord (detail complet)

1. Ouvrir https://discord.com/developers/applications
2. Cliquer `New Application`, donner un nom, puis `Create`.
3. Aller dans `Bot`, cliquer `Add Bot`.
4. Dans `Bot`, cliquer `Reset Token` puis copier le token:
- Le mettre dans `.env` -> `DISCORD_BOT_TOKEN`.
5. Dans `Bot`, verifier les permissions/intents:
- `SERVER MEMBERS INTENT`: pas obligatoire pour ce projet.
- `MESSAGE CONTENT INTENT`: pas necessaire.
6. Aller dans `OAuth2` -> `URL Generator`:
- Scopes: `bot`
- Permissions bot conseillees: `View Channels`, `Send Messages`, `Embed Links`, `Read Message History`, `Mention Everyone`
7. Ouvrir l'URL generee et inviter le bot sur votre serveur.
8. Activer le mode developpeur Discord (User Settings -> Advanced -> Developer Mode).
9. Recuperer les IDs:
- ID salon Trello -> `DISCORD_TARGET_CHANNEL_ID`
- ID role a ping Trello (optionnel) -> `DISCORD_PING_ROLE_ID`
- ID salon Drive (optionnel) -> `DISCORD_DRIVE_CHANNEL_ID`
- ID role Drive (optionnel) -> `DISCORD_DRIVE_PING_ROLE_ID`
- ID salon GitHub (optionnel) -> `DISCORD_GITHUB_CHANNEL_ID`
- ID role GitHub (optionnel) -> `DISCORD_GITHUB_PING_ROLE_ID`

## 4. Configuration `.env`

1. Copier le template:

```bash
cp .env.example .env
# PowerShell (Windows)
Copy-Item .env.example .env
```

2. Remplir au minimum:
- `DISCORD_BOT_TOKEN`
- `DISCORD_TARGET_CHANNEL_ID`
- `TRELLO_WEBHOOK_CALLBACK_URL`
- `TRELLO_WEBHOOK_SECRET`

3. Integrations optionnelles:
- Drive actif seulement si `DISCORD_DRIVE_CHANNEL_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL` et `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` sont renseignes.
- GitHub actif seulement si `DISCORD_GITHUB_CHANNEL_ID` et `GITHUB_WEBHOOK_SECRET` sont renseignes.

4. Options de ping (true/false):
- Trello:
- `DISCORD_TRELLO_PING_ROLE_ENABLED` (defaut `true`)
- `DISCORD_TRELLO_PING_ACTOR_ENABLED` (defaut `true`)
- Drive:
- `DISCORD_DRIVE_PING_ROLE_ENABLED` (defaut `true`)
- `DISCORD_DRIVE_PING_ACTOR_ENABLED` (defaut `true`)
- GitHub:
- `DISCORD_GITHUB_PING_ROLE_ENABLED` (defaut `true`)
- `DISCORD_GITHUB_PING_ACTOR_ENABLED` (defaut `true`)
- Roles:
- `DISCORD_PING_ROLE_ID` = role Trello (et fallback Drive/GitHub si pas de role specifique)
- `DISCORD_DRIVE_PING_ROLE_ID` = role Drive specifique (optionnel)
- `DISCORD_GITHUB_PING_ROLE_ID` = role GitHub specifique (optionnel)

Exemple:
- Si vous voulez les notifs Trello sans ping role: `DISCORD_TRELLO_PING_ROLE_ENABLED=false`
- Si vous voulez afficher l'auteur sans le mentionner: mettez `*_PING_ACTOR_ENABLED=false`

## 5. Trello: creer key/secret/token + webhook

### 5.1 Recuperer la API key et le API secret Trello

1. Ouvrir https://trello.com/power-ups/admin
2. Creer un Power-Up (ou ouvrir un existant).
3. Copier:
- `API Key`
- `API Secret`

Important:
- `TRELLO_WEBHOOK_SECRET` dans `.env` = `API Secret` Trello.
- C'est ce secret qui sert a verifier la signature `x-trello-webhook`.

### 5.2 Generer un token utilisateur Trello

Ouvrir cette URL dans le navigateur (remplacer `YOUR_KEY`):

```text
https://trello.com/1/authorize?expiration=never&name=G-Rard&scope=read,write&response_type=token&key=YOUR_KEY
```

Copier le token retourne.

### 5.3 Recuperer l'ID du board Trello

Option 1:
- Ouvrir le board puis utiliser l'API Trello pour lire ses infos et recuperer `id`.

Option 2:
- Passer par l'interface developpeur/API si vous avez deja la commande curl de listing.

### 5.4 Creer le webhook Trello

`TRELLO_WEBHOOK_CALLBACK_URL` doit etre l'URL publique de votre app + `/webhooks/trello`.

Exemple de creation webhook:

```bash
curl -X POST "https://api.trello.com/1/webhooks/?key=YOUR_KEY&token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"callbackURL\":\"https://votre-domaine.com/webhooks/trello\",\"idModel\":\"ID_DU_BOARD\",\"description\":\"G-Rard relay\"}"
```

## 6. Google Drive: procedure complete

### 6.1 Creer le projet et activer l'API

1. Ouvrir Google Cloud Console.
2. Creer un projet (ou utiliser un existant).
3. Aller dans `APIs & Services` -> `Library`.
4. Activer `Google Drive API`.

### 6.2 Creer un compte de service + cle JSON

1. Aller dans `IAM & Admin` -> `Service Accounts`.
2. `Create Service Account`.
3. Ouvrir ce compte de service -> `Keys` -> `Add Key` -> `Create new key` -> JSON.
4. Recuperer dans le JSON:
- `client_email` -> `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` -> `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

Dans `.env`, la cle privee doit garder les `\n`:

```env
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 6.3 Donner acces au dossier/drive surveille

1. Dans Google Drive, partager le dossier cible avec le `client_email` du compte de service.
2. Donner au minimum `Lecteur` (ou plus selon besoin).

### 6.4 Choisir le scope surveille

- `GOOGLE_DRIVE_FOLDER_ID`: ID dossier racine a surveiller.
- `GOOGLE_DRIVE_SHARED_DRIVE_ID`: ID Shared Drive (si vous utilisez un drive partage).
- Si `GOOGLE_DRIVE_FOLDER_ID` est vide, le bot observe plus largement selon votre config Drive.

Notes:
- Au premier demarrage, le bot initialise son token Drive sans spammer (pas de replay historique).
- Le fichier `drive-state.json` garde la position de lecture des changements.

## 7. GitHub: procedure complete

### 7.1 Preparer le secret

Generer un secret fort, par exemple:

```bash
openssl rand -hex 32
```

Mettre la valeur dans `.env` -> `GITHUB_WEBHOOK_SECRET`.

### 7.2 Creer le webhook GitHub

1. Ouvrir votre repo GitHub -> `Settings` -> `Webhooks` -> `Add webhook`.
2. Remplir:
- `Payload URL`: `https://votre-domaine.com/webhooks/github`
- `Content type`: `application/json`
- `Secret`: meme valeur que `GITHUB_WEBHOOK_SECRET`
3. Evenements recommandes:
- `Pull requests`
- `Pushes`
- `Issue comments`
- `Pull request reviews`
- `Commit comments`
- `Delete`

## 8. Mapping utilisateurs (Discord pseudo prioritaire)

Le mapping se fait dans `src/config/userDirectory.js`.

Regle appliquee par le bot:
- Mapping trouve: affichage du pseudo Discord (`discordDisplayName`).
- Mention de l'auteur (`<@DISCORD_ID>`) seulement si la variable `*_PING_ACTOR_ENABLED=true`.
- Pas de mapping: fallback sur le nom de la plateforme (Trello/Drive/GitHub).

Notes de format message:
- Le role, quand il est actif, est toujours place en fin de message au format spoiler (`||<@&ROLE_ID>||`).
- Si le ping role est desactive pour une integration, le role n'est pas mentionne.

Exemple minimal:

```js
const userDirectory = [
  {
    discordUserId: '123456789012345678',
    discordDisplayName: 'Rard',
    trello: {
      memberId: 'abc123memberid',
      username: 'rard_trello',
      email: 'rard@exemple.com',
    },
    drive: {
      email: 'rard@exemple.com',
      displayName: 'Gerard R',
    },
    github: {
      usernames: ['plok-code', 'rard-dev'],
      emails: ['rard@exemple.com'],
      names: ['Gerard'],
    },
  },
];

module.exports = { userDirectory };
```

Conseils pratiques:
- Renseigner plusieurs aliases GitHub (`usernames`, `emails`, `names`) pour fiabiliser le matching.
- Pour Trello et Drive, mettre plusieurs criteres quand possible (ID + username + email).
- Si vous ne voulez pas mentionner un utilisateur, laissez `discordUserId` vide mais gardez `discordDisplayName`.

## 9. Demarrage local

```bash
npm run start
```

Healthcheck local:

```bash
curl http://localhost:3000/health
```

## 10. Exposer une URL publique (dev local)

Exemple avec ngrok:

```bash
ngrok http 3000
```

Puis:
- Mettre l'URL HTTPS ngrok dans `TRELLO_WEBHOOK_CALLBACK_URL` (`.../webhooks/trello`).
- Mettre la meme base pour GitHub (`.../webhooks/github`).
- Recreer/mettre a jour les webhooks Trello et GitHub si l'URL change.

## 11. Hebergement (production)

### Option A - Docker

Build et run:

```bash
docker build -t g-rard .
docker run -d --name g-rard --restart unless-stopped --env-file .env -p 3000:3000 g-rard
```

### Option B - VPS + PM2

```bash
npm install
npm install -g pm2
pm2 start src/index.js --name g-rard
pm2 save
pm2 startup
```

Points importants en prod:
- URL stable avec HTTPS (reverse proxy type Nginx/Caddy recommande).
- Variables `.env` securisees.
- Sauvegarder `drive-state.json` si vous redeployez souvent.

## 12. Checklist de validation

1. Le bot Discord est en ligne dans le serveur.
2. `GET /health` repond `ok`.
3. Trello: une action notifiable envoie bien un message.
4. Drive: creation/suppression de fichier remonte dans le salon Drive.
5. GitHub: un push ou une PR envoie bien un message.
6. Les auteurs mappes apparaissent en pseudo Discord.
7. Les auteurs non mappes restent en fallback plateforme.
8. Le role actif est mentionne en fin de message, dans un spoiler.

## 13. Depannage rapide

- `Missing required environment variable ...`: une variable obligatoire manque dans `.env`.
- Trello `401 Invalid signature`: `TRELLO_WEBHOOK_SECRET` ne correspond pas a l'API Secret du Power-Up.
- GitHub `401 Invalid signature`: `GITHUB_WEBHOOK_SECRET` ne correspond pas au secret du webhook GitHub.
- Drive silencieux: verifier le partage du dossier/drive au compte de service.
- Drive silencieux: verifier `DISCORD_DRIVE_CHANNEL_ID` + credentials Google presentes.
- Pas de pseudo Discord affiche: verifier `src/config/userDirectory.js` (match + `discordDisplayName`).

## 14. Fichiers utiles

- `.env.example`: toutes les variables supportees
- `src/config/userDirectory.js`: mapping utilisateurs centralise
- `src/trello/router.js`: webhook Trello
- `src/drive/monitor.js`: polling Drive
- `src/github/router.js`: webhook GitHub
